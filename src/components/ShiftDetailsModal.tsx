import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sun, 
  Moon, 
  Printer, 
  Search, 
  CheckCircle2, 
  ArrowUpRight, 
  ShoppingBag, 
  Receipt, 
  Clock, 
  DollarSign, 
  Calendar,
  Layers,
  Sparkles,
  Award,
  TrendingUp,
  Percent
} from 'lucide-react';
import { CashierShift, Currency, SaleRecord } from '../types';
import { formatPrice, formatNumber, formatDate, normalizeSearchText } from '../utils/formatters';

interface ShiftDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: SaleRecord[];
  currency: Currency;
  activeShift: CashierShift;
  onSelectShift: (shift: CashierShift) => void;
  onViewReceipt?: (sale: SaleRecord) => void;
}

export const ShiftDetailsModal: React.FC<ShiftDetailsModalProps> = ({
  isOpen,
  onClose,
  sales,
  currency,
  activeShift,
  onSelectShift,
  onViewReceipt,
}) => {
  const [selectedTab, setSelectedTab] = useState<'day' | 'night' | 'compare'>('day');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'all'>('today');
  const [showPrintSlip, setShowPrintSlip] = useState(false);

  // Helper to resolve shift
  const getSaleShift = (sale: SaleRecord): CashierShift => {
    if (sale.shift) return sale.shift;
    const hour = new Date(sale.timestamp).getHours();
    return hour >= 8 && hour < 16 ? 'day' : 'night';
  };

  // Filter sales by date
  const filteredSales = useMemo(() => {
    const todayStr = new Date().toDateString();
    return sales.filter((s) => {
      if (dateFilter === 'today') {
        const saleDateStr = new Date(s.timestamp).toDateString();
        return saleDateStr === todayStr;
      }
      return true;
    });
  }, [sales, dateFilter]);

  // Split sales by shift
  const daySales = useMemo(() => filteredSales.filter((s) => getSaleShift(s) === 'day'), [filteredSales]);
  const nightSales = useMemo(() => filteredSales.filter((s) => getSaleShift(s) === 'night'), [filteredSales]);

  // Aggregate stats helper
  const calculateShiftStats = (shiftSales: SaleRecord[]) => {
    const revenue = shiftSales.reduce((acc, s) => acc + s.totalAmount, 0);
    const profit = shiftSales.reduce((acc, s) => acc + s.totalProfit, 0);
    const count = shiftSales.length;
    const totalItems = shiftSales.reduce((acc, s) => acc + s.items.reduce((sum, i) => sum + i.quantity, 0), 0);
    const avgTicket = count > 0 ? revenue / count : 0;

    // Aggregate sold items
    const itemMap = new Map<string, {
      productId: string;
      name: string;
      barcode: string;
      quantity: number;
      unitPrice: number;
      totalRevenue: number;
      totalProfit: number;
    }>();

    shiftSales.forEach((s) => {
      s.items.forEach((item) => {
        const existing = itemMap.get(item.productId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.totalRevenue += item.totalPrice;
          existing.totalProfit += item.totalProfit;
        } else {
          itemMap.set(item.productId, {
            productId: item.productId,
            name: item.productName,
            barcode: item.barcode,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalRevenue: item.totalPrice,
            totalProfit: item.totalProfit,
          });
        }
      });
    });

    const itemsSold = Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity);

    return {
      revenue,
      profit,
      count,
      totalItems,
      avgTicket,
      itemsSold,
    };
  };

  const dayStats = useMemo(() => calculateShiftStats(daySales), [daySales]);
  const nightStats = useMemo(() => calculateShiftStats(nightSales), [nightSales]);

  // Current viewed stats
  const currentViewStats = selectedTab === 'day' ? dayStats : nightStats;
  const currentViewSales = selectedTab === 'day' ? daySales : nightSales;

  // Filter items in active shift view
  const filteredItems = useMemo(() => {
    if (!itemSearchQuery.trim()) return currentViewStats.itemsSold;
    const norm = normalizeSearchText(itemSearchQuery);
    return currentViewStats.itemsSold.filter((item) => 
      normalizeSearchText(item.name).includes(norm) || item.barcode.includes(norm)
    );
  }, [currentViewStats.itemsSold, itemSearchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div 
        className="w-full max-w-4xl bg-stone-950 border border-emerald-900/60 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.25)] flex flex-col max-h-[92vh] overflow-hidden text-stone-100 animate-in fade-in zoom-in duration-200"
        dir="rtl"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-stone-950 via-emerald-950/40 to-stone-950 border-b border-emerald-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">
                  بەڕێوەبردنی شەفتەکانی کاشێر
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${
                  activeShift === 'day'
                    ? 'bg-amber-950 text-amber-300 border-amber-600/50'
                    : 'bg-indigo-950 text-indigo-300 border-indigo-600/50'
                }`}>
                  {activeShift === 'day' ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3 text-indigo-400" />}
                  <span>شەفتی ئێستا چالاکە: {activeShift === 'day' ? 'شەفتی ڕۆژ' : 'شەفتی شەو'}</span>
                </span>
              </div>
              <p className="text-xs text-stone-400">
                بەراوردکردنی فرۆشتنی شەفتی ڕۆژ و شەفتی شەو، و لیستی هەموو ئەو کاڵایانەی لە هەر شەفتێکدا فرۆشراون
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="چاپکردنی وەسڵی شەفت"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">چاپکردن</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 border border-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Control Bar: Shift Tabs & Date Filter */}
        <div className="px-5 py-3 bg-stone-900/80 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3">
          {/* Main Shift Selector Tabs */}
          <div className="flex items-center gap-1.5 bg-stone-950 p-1 rounded-xl border border-stone-800">
            <button
              onClick={() => setSelectedTab('day')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedTab === 'day'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>☀️ شەفتی ڕۆژ</span>
              <span className="bg-stone-900 text-stone-300 text-[10px] px-1.5 py-0.2 rounded-full border border-stone-800">
                {formatPrice(dayStats.revenue, currency)}
              </span>
            </button>

            <button
              onClick={() => setSelectedTab('night')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedTab === 'night'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>🌙 شەفتی شەو</span>
              <span className="bg-stone-900 text-stone-300 text-[10px] px-1.5 py-0.2 rounded-full border border-stone-800">
                {formatPrice(nightStats.revenue, currency)}
              </span>
            </button>

            <button
              onClick={() => setSelectedTab('compare')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedTab === 'compare'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>📊 بەراوردکاری</span>
            </button>
          </div>

          {/* Quick Date Switcher: Today vs All */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400">کات:</span>
            <div className="flex items-center bg-stone-950 p-0.5 rounded-lg border border-stone-800 text-xs">
              <button
                onClick={() => setDateFilter('today')}
                className={`px-2.5 py-1 rounded-md transition-all font-semibold ${
                  dateFilter === 'today'
                    ? 'bg-emerald-600 text-stone-950 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                فرۆشی ئەمڕۆ
              </button>
              <button
                onClick={() => setDateFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-all font-semibold ${
                  dateFilter === 'all'
                    ? 'bg-emerald-600 text-stone-950 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                هەموو فرۆشراوەکان
              </button>
            </div>

            {/* Quick Set Active Shift Button */}
            {selectedTab !== 'compare' && activeShift !== selectedTab && (
              <button
                onClick={() => onSelectShift(selectedTab)}
                className="px-3 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5"
                title="دانانی ئەم شەفتە وەک شەفتی چالاکی کاشێر"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>چالاککردنی ئەم شەفتە بۆ کاشێر</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-sm">

          {/* TAB 1 & 2: Shift Individual View (Day or Night) */}
          {selectedTab !== 'compare' && (
            <div className="space-y-6">
              
              {/* Shift Overview Banner */}
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                selectedTab === 'day'
                  ? 'bg-gradient-to-r from-amber-950/40 via-stone-900 to-stone-900 border-amber-600/40'
                  : 'bg-gradient-to-r from-indigo-950/40 via-stone-900 to-stone-900 border-indigo-600/40'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-md border ${
                    selectedTab === 'day'
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                  }`}>
                    {selectedTab === 'day' ? <Sun className="w-6 h-6 text-amber-400" /> : <Moon className="w-6 h-6 text-indigo-400" />}
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-white">
                      {selectedTab === 'day' ? 'شەفتی ڕۆژ (Day Shift)' : 'شەفتی شەو (Night Shift)'}
                    </h3>
                    <p className="text-xs text-stone-400">
                      {selectedTab === 'day' ? 'کات: بەیانیان بۆ ئێواران (08:00 AM - 04:00 PM)' : 'کات: ئێواران بۆ شەوان (04:00 PM - 12:00 AM)'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                    activeShift === selectedTab 
                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500' 
                      : 'bg-stone-800 text-stone-400 border-stone-700'
                  }`}>
                    {activeShift === selectedTab ? '✓ شەفتی چالاکی ئێستایە' : 'شەفتی ناچالاکە'}
                  </span>
                </div>
              </div>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                
                {/* Total Shift Revenue */}
                <div className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
                  <span className="text-[11px] text-stone-400">کۆی فرۆشتنی شەفت:</span>
                  <div className="font-mono font-black text-base sm:text-lg text-emerald-400">
                    {formatPrice(currentViewStats.revenue, currency)}
                  </div>
                </div>

                {/* Total Shift Profit */}
                <div className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
                  <span className="text-[11px] text-stone-400">کۆی قازانجی شەفت:</span>
                  <div className="font-mono font-black text-base sm:text-lg text-emerald-300">
                    {formatPrice(currentViewStats.profit, currency)}
                  </div>
                </div>

                {/* Total Receipts */}
                <div className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
                  <span className="text-[11px] text-stone-400">ژمارەی وەسڵەکان:</span>
                  <div className="font-mono font-black text-base sm:text-lg text-white">
                    {currentViewStats.count} وەسڵ
                  </div>
                </div>

                {/* Total Quantity Sold */}
                <div className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
                  <span className="text-[11px] text-stone-400">کۆی دانەی فرۆشراو:</span>
                  <div className="font-mono font-black text-base sm:text-lg text-amber-300">
                    {currentViewStats.totalItems} دانە
                  </div>
                </div>

              </div>

              {/* SECTION: EXACTLY WHAT WAS SOLD IN THIS SHIFT (چی فرۆشتووە لەم شەفتە) */}
              <div className="bg-stone-900/90 rounded-2xl border border-stone-800 overflow-hidden">
                <div className="p-4 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 bg-stone-950/60">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-bold text-sm text-white">
                      لیستی ئەو کاڵایانەی لەم شەفتەدا فرۆشراون ({currentViewStats.itemsSold.length} جۆر کاڵا)
                    </h4>
                  </div>

                  {/* Search inside shift sold items */}
                  <div className="relative min-w-[220px]">
                    <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none" />
                    <input
                      type="text"
                      value={itemSearchQuery}
                      onChange={(e) => setItemSearchQuery(e.target.value)}
                      placeholder="گەڕان بەپێی ناوی کاڵا یان بارکۆد..."
                      className="w-full pr-8 pl-3 py-1.5 text-xs rounded-lg border border-stone-700 bg-stone-950 text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 shadow-inner"
                    />
                  </div>
                </div>

                {/* Items Sold Table */}
                <div className="overflow-x-auto max-h-[300px]">
                  {filteredItems.length === 0 ? (
                    <div className="p-8 text-center text-stone-500 text-xs">
                      هیچ کاڵایەک لەم شەفتەدا نەدۆزرایەوە یان فرۆش نییە
                    </div>
                  ) : (
                    <table className="w-full text-right text-xs">
                      <thead className="bg-stone-950 text-stone-400 sticky top-0 border-b border-stone-800">
                        <tr>
                          <th className="py-2.5 px-3">ڕیزبەندی</th>
                          <th className="py-2.5 px-3">ناوی کاڵا</th>
                          <th className="py-2.5 px-3 font-mono">بارکۆد</th>
                          <th className="py-2.5 px-3 text-center">چەند دانە فرۆشراوە</th>
                          <th className="py-2.5 px-3">نرخی تاک</th>
                          <th className="py-2.5 px-3 text-emerald-400 font-bold">کۆی پارە</th>
                          <th className="py-2.5 px-3 text-emerald-300 font-bold">قازانج</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-800/60 font-medium">
                        {filteredItems.map((item, idx) => (
                          <tr key={item.productId} className="hover:bg-stone-800/40 transition-colors">
                            <td className="py-2 px-3 text-stone-500 text-center w-10">
                              {idx < 3 ? (
                                <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-600/50 flex items-center justify-center font-bold text-[10px] mx-auto">
                                  {idx + 1}
                                </span>
                              ) : (
                                idx + 1
                              )}
                            </td>
                            <td className="py-2 px-3 font-bold text-white">
                              {item.name}
                            </td>
                            <td className="py-2 px-3 font-mono text-stone-400 text-[11px]">
                              {item.barcode}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-stone-950 text-white font-mono font-bold border border-stone-800">
                                {item.quantity} دانە
                              </span>
                            </td>
                            <td className="py-2 px-3 font-mono text-stone-300">
                              {formatPrice(item.unitPrice, currency)}
                            </td>
                            <td className="py-2 px-3 font-mono font-black text-emerald-400">
                              {formatPrice(item.totalRevenue, currency)}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-emerald-300">
                              +{formatPrice(item.totalProfit, currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* RECENT RECEIPTS OF THIS SHIFT */}
              <div className="bg-stone-900/60 rounded-xl border border-stone-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-white flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span>دوایین وەسڵەکانی ئەم شەفتە ({currentViewSales.length} وەسڵ)</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto">
                  {currentViewSales.map((sale) => (
                    <div 
                      key={sale.id}
                      onClick={() => onViewReceipt && onViewReceipt(sale)}
                      className="p-2.5 rounded-lg bg-stone-950 border border-stone-800 hover:border-emerald-600/50 cursor-pointer transition-all space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-emerald-400">{sale.receiptNumber}</span>
                        <span className="text-[10px] text-stone-400">{formatDate(sale.timestamp)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-900">
                        <span className="text-stone-400 text-[11px]">{sale.items.length} کاڵا</span>
                        <span className="font-black text-white">{formatPrice(sale.totalAmount, currency)}</span>
                      </div>
                    </div>
                  ))}
                  {currentViewSales.length === 0 && (
                    <div className="col-span-full py-4 text-center text-xs text-stone-500">
                      هیچ وەسڵێک تۆمار نەکراوە
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: COMPARISON VIEW (بەراوردکاری نێوان هەردوو شەفت) */}
          {selectedTab === 'compare' && (
            <div className="space-y-6">
              
              {/* Grand Comparison Header */}
              <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 space-y-2">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <span>بەراوردکاری ڕاستەوخۆ: شەفتی ڕۆژ vs شەفتی شەو</span>
                </h3>
                <p className="text-stone-300 text-xs leading-relaxed">
                  لێرەدا دەتوانیت بە تەواوی بزانیت کام شەفت فرۆش و قازانجی زیاتر بووە، و چەند کاڵا لە هەر شەفتێک فرۆشراون.
                </p>
              </div>

              {/* Side-by-Side Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Day Shift Summary Column */}
                <div className="p-5 rounded-2xl bg-stone-900/90 border border-amber-500/40 space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                        <Sun className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">شەفتی ڕۆژ ☀️</h4>
                        <span className="text-[11px] text-stone-400">08:00 AM - 04:00 PM</span>
                      </div>
                    </div>
                    <span className="font-mono font-black text-amber-400 text-base">
                      {formatPrice(dayStats.revenue, currency)}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between text-stone-300">
                      <span>کۆی وەسڵەکان:</span>
                      <span className="font-bold text-white font-mono">{dayStats.count} وەسڵ</span>
                    </div>
                    <div className="flex justify-between text-stone-300">
                      <span>کۆی دانەی فرۆشراو:</span>
                      <span className="font-bold text-white font-mono">{dayStats.totalItems} دانە</span>
                    </div>
                    <div className="flex justify-between text-stone-300">
                      <span>کۆی قازانج:</span>
                      <span className="font-bold text-emerald-300 font-mono">+{formatPrice(dayStats.profit, currency)}</span>
                    </div>
                    <div className="flex justify-between text-stone-300">
                      <span>مامناوەندی هەر وەسڵێک:</span>
                      <span className="font-bold text-stone-200 font-mono">{formatPrice(dayStats.avgTicket, currency)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedTab('day')}
                    className="w-full py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-600/50 text-amber-300 text-xs font-bold transition-all"
                  >
                    بینینی کاڵا فرۆشراوەکانی شەفتی ڕۆژ &larr;
                  </button>
                </div>

                {/* Night Shift Summary Column */}
                <div className="p-5 rounded-2xl bg-stone-900/90 border border-indigo-500/40 space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">
                        <Moon className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">شەفتی شەو 🌙</h4>
                        <span className="text-[11px] text-stone-400">04:00 PM - 12:00 AM</span>
                      </div>
                    </div>
                    <span className="font-mono font-black text-indigo-300 text-base">
                      {formatPrice(nightStats.revenue, currency)}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between text-stone-300">
                      <span>کۆی وەسڵەکان:</span>
                      <span className="font-bold text-white font-mono">{nightStats.count} وەسڵ</span>
                    </div>
                    <div className="flex justify-between text-stone-300">
                      <span>کۆی دانەی فرۆشراو:</span>
                      <span className="font-bold text-white font-mono">{nightStats.totalItems} دانە</span>
                    </div>
                    <div className="flex justify-between text-stone-300">
                      <span>کۆی قازانج:</span>
                      <span className="font-bold text-emerald-300 font-mono">+{formatPrice(nightStats.profit, currency)}</span>
                    </div>
                    <div className="flex justify-between text-stone-300">
                      <span>مامناوەندی هەر وەسڵێک:</span>
                      <span className="font-bold text-stone-200 font-mono">{formatPrice(nightStats.avgTicket, currency)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedTab('night')}
                    className="w-full py-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-600/50 text-indigo-300 text-xs font-bold transition-all"
                  >
                    بینینی کاڵا فرۆشراوەکانی شەفتی شەو &larr;
                  </button>
                </div>

              </div>

              {/* Total Day + Night Combined */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/50 via-stone-900 to-emerald-950/50 border border-emerald-600/40 flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-400 block">کۆی گشتی هەردوو شەفتەکە پێکەوە:</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    {formatPrice(dayStats.revenue + nightStats.revenue, currency)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-white font-bold">{dayStats.count + nightStats.count} کۆی وەسڵ</span>
                  <span className="text-emerald-300 font-bold">+{formatPrice(dayStats.profit + nightStats.profit, currency)} قازانج</span>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-stone-950 border-t border-stone-900 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span>سیستەمی شەفتەکانی pedros POS</span>
            <span>•</span>
            <span>شەفتی ڕۆژ ☀️ و شەفتی شەو 🌙</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-colors"
          >
            داخستن
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  Calendar, 
  Printer, 
  ArrowUpRight, 
  ShoppingBag,
  Clock,
  Eye,
  FileSpreadsheet,
  Sun,
  Moon
} from 'lucide-react';
import { SaleRecord, Currency, CashierShift } from '../types';
import { formatPrice, formatDate, formatNumber } from '../utils/formatters';

interface SalesReportProps {
  sales: SaleRecord[];
  currency: Currency;
  onViewReceipt: (sale: SaleRecord) => void;
}

export const SalesReport: React.FC<SalesReportProps> = ({
  sales,
  currency,
  onViewReceipt,
}) => {
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week'>('all');
  const [filterShift, setFilterShift] = useState<'all' | 'day' | 'night'>('all');

  const getSaleShift = (sale: SaleRecord): CashierShift => {
    if (sale.shift) return sale.shift;
    const hour = new Date(sale.timestamp).getHours();
    return hour >= 8 && hour < 16 ? 'day' : 'night';
  };

  // Filter sales
  const now = new Date();
  const filteredSales = sales.filter((sale) => {
    if (filterPeriod === 'all') return true;
    const saleDate = new Date(sale.timestamp);
    const diffHours = (now.getTime() - saleDate.getTime()) / (1000 * 60 * 60);

    if (filterPeriod === 'today') {
      return diffHours <= 24;
    }
    if (filterPeriod === 'week') {
      if (diffHours > 24 * 7) return false;
    }

    if (filterShift !== 'all' && getSaleShift(sale) !== filterShift) {
      return false;
    }

    return true;
  });

  // Calculate totals
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalProfit = filteredSales.reduce((sum, s) => sum + s.totalProfit, 0);
  const totalItemsSold = filteredSales.reduce(
    (sum, s) => sum + s.items.reduce((iSum, item) => iSum + item.quantity, 0),
    0
  );

  // Top selling products aggregation
  const productSalesMap: { [id: string]: { name: string; quantity: number; revenue: number } } = {};
  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = {
          name: item.productName,
          quantity: 0,
          revenue: 0,
        };
      }
      productSalesMap[item.productId].quantity += item.quantity;
      productSalesMap[item.productId].revenue += item.totalPrice;
    });
  });

  const topSellingList = Object.values(productSalesMap).sort((a, b) => b.quantity - a.quantity);

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-y-auto space-y-5 bg-stone-950 text-stone-100">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-900/95 p-4 rounded-2xl border border-emerald-900/30 shadow-2xl">
        <div>
          <h2 className="text-base font-bold text-white">ڕاپۆرتی فرۆش و قازانجی مارکێت</h2>
          <p className="text-xs text-stone-400">
            وردەکاری هەموو فرۆشراوەکان، داهات، قازانجی تۆمارکراو و ژمارەی وەسڵەکان
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Shift filter */}
          <div className="flex items-center bg-stone-950 p-1 rounded-xl text-xs border border-stone-800">
            <button
              onClick={() => setFilterShift('all')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                filterShift === 'all'
                  ? 'bg-emerald-600 text-stone-950 font-bold shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              هەموو شەفتەکان
            </button>
            <button
              onClick={() => setFilterShift('day')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                filterShift === 'day'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Sun className="w-3 h-3 text-amber-400" />
              <span>ڕۆژ</span>
            </button>
            <button
              onClick={() => setFilterShift('night')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                filterShift === 'night'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Moon className="w-3 h-3 text-indigo-400" />
              <span>شەو</span>
            </button>
          </div>

          {/* Period selector */}
          <div className="flex items-center bg-stone-950 p-1 rounded-xl text-xs border border-stone-800">
            <button
              onClick={() => setFilterPeriod('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterPeriod === 'all'
                  ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              هەموو کاتێک
            </button>
            <button
              onClick={() => setFilterPeriod('week')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterPeriod === 'week'
                  ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              ٧ ڕۆژی ڕابردوو
            </button>
            <button
              onClick={() => setFilterPeriod('today')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterPeriod === 'today'
                  ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              ئەمڕۆ
            </button>
          </div>

          <button
            onClick={handlePrintReport}
            className="px-3.5 py-1.5 rounded-xl border border-emerald-800 hover:bg-emerald-950 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>چاپکردنی ڕاپۆرت</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Total Revenue */}
        <div className="bg-stone-900/90 p-4 rounded-2xl border border-emerald-900/40 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-400 block mb-1">
              کۆی پارەی فرۆشراو (داهات)
            </span>
            <span className="text-2xl font-black text-emerald-400">
              {formatPrice(totalRevenue, currency)}
            </span>
            <span className="text-[11px] text-stone-500 block mt-1">
              {filteredSales.length} فرۆشتنی ئەنجامدراو
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total Profit */}
        <div className="bg-stone-900/90 p-4 rounded-2xl border border-emerald-900/40 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-400 block mb-1">
              کۆی قازانجی بەدەستهاتوو
            </span>
            <span className="text-2xl font-black text-emerald-300">
              {formatPrice(totalProfit, currency)}
            </span>
            <span className="text-[11px] text-emerald-400/80 font-semibold block mt-1">
              داهات پاش لێدەرکردنی تێچوو
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Items Sold Quantity */}
        <div className="bg-stone-900/90 p-4 rounded-2xl border border-stone-800 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-400 block mb-1">
              ژمارەی پارچە فرۆشراوەکان
            </span>
            <span className="text-2xl font-black text-cyan-400">
              {formatNumber(totalItemsSold)}
            </span>
            <span className="text-[11px] text-stone-500 block mt-1">
              دانە لە هەموو کاڵاکان
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Total Receipts */}
        <div className="bg-stone-900/90 p-4 rounded-2xl border border-stone-800 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-400 block mb-1">
              ژمارەی وەسڵەکان (کڕیار)
            </span>
            <span className="text-2xl font-black text-white">
              {filteredSales.length}
            </span>
            <span className="text-[11px] text-stone-500 block mt-1">
              وەسڵی فرۆشتن
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-stone-800 border border-stone-700 text-stone-300 flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Two Columns: Recent Transactions & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Sales Transactions Table (2 Cols) */}
        <div className="lg:col-span-2 bg-stone-900/95 rounded-2xl border border-emerald-900/30 shadow-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>مێژووی فرۆشتنەکان و وەسڵەکان</span>
            </h3>
            <span className="text-xs text-stone-400">{filteredSales.length} فرۆشتن</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-stone-950 text-stone-400 font-bold border-b border-stone-800">
                <tr>
                  <th className="py-2.5 px-4">ژمارەی وەسڵ</th>
                  <th className="py-2.5 px-3">بەروار و کات</th>
                  <th className="py-2.5 px-3">کاڵاکان</th>
                  <th className="py-2.5 px-3">کۆی پارە</th>
                  <th className="py-2.5 px-3 text-emerald-400">قازانج</th>
                  <th className="py-2.5 px-3 text-center">وەسڵ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {filteredSales.map((sale) => {
                  const itemCount = sale.items.reduce((s, i) => s + i.quantity, 0);
                  return (
                    <tr key={sale.id} className="hover:bg-emerald-950/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        <div className="flex items-center gap-1.5">
                          <span>{sale.receiptNumber}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${
                            getSaleShift(sale) === 'day'
                              ? 'bg-amber-950/60 text-amber-300 border-amber-700/50'
                              : 'bg-indigo-950/60 text-indigo-300 border-indigo-700/50'
                          }`}>
                            {getSaleShift(sale) === 'day' ? '☀️ ڕۆژ' : '🌙 شەو'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-stone-400 text-[11px]">
                        {formatDate(sale.timestamp)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-stone-300">
                          {itemCount} دانە ({sale.items.length} جۆر)
                        </span>
                      </td>
                      <td className="py-3 px-3 font-extrabold text-white">
                        {formatPrice(sale.totalAmount, currency)}
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-400">
                        +{formatPrice(sale.totalProfit, currency)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onViewReceipt(sale)}
                          className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-semibold transition-colors inline-flex items-center gap-1 border border-stone-700"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>بینین</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredSales.length === 0 && (
              <div className="p-8 text-center text-stone-500">
                <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-400" />
                <p className="text-xs">هیچ فرۆشتنێک لەم ماوەیەدا ئەنجام نەدراوە</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Selling Products List (1 Col) */}
        <div className="bg-stone-900/95 rounded-2xl border border-emerald-900/30 shadow-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-stone-800 bg-stone-950">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              <span>پڕفرۆشترین کاڵاکانی مارکێت</span>
            </h3>
            <p className="text-[11px] text-stone-400 mt-0.5">کاڵاکان بەپێی بڕی فرۆشراو</p>
          </div>

          <div className="p-4 divide-y divide-stone-800 overflow-y-auto max-h-[400px]">
            {topSellingList.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-2 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-stone-400">داهات: {formatPrice(item.revenue, currency)}</p>
                  </div>
                </div>

                <div className="text-left shrink-0">
                  <span className="text-xs font-black text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-md">
                    {item.quantity} فرۆشراو
                  </span>
                </div>
              </div>
            ))}

            {topSellingList.length === 0 && (
              <div className="py-8 text-center text-stone-500 text-xs">
                هێشتا هیچ فرۆشتنێک تۆمار نەکراوە
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

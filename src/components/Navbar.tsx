import React from 'react';
import { 
  ShoppingCart, 
  Boxes, 
  TrendingUp, 
  Barcode, 
  Store, 
  RefreshCw,
  PackagePlus,
  Banknote
} from 'lucide-react';
import { ActiveTab, Currency, Product, SaleRecord } from '../types';
import { formatPrice } from '../utils/formatters';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  products: Product[];
  sales: SaleRecord[];
  onResetSampleData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  products,
  sales,
  onResetSampleData,
}) => {
  const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);

  return (
    <header className="bg-stone-950 border-b border-stone-800 shrink-0 sticky top-0 z-30 shadow-md text-stone-100">
      
      {/* Top Main Brand Row - Clean & Luxury: Only Brand & Money/Currency */}
      <div className="px-4 lg:px-6 py-2.5 flex items-center justify-between gap-3 border-b border-stone-900">
        
        {/* Market Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-950 text-white flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.35)] border border-emerald-500/40">
            <Store className="w-5 h-5 text-emerald-100" />
          </div>
          <div>
            <h1 className="font-black text-2xl text-white tracking-wider font-sans leading-none">
              pedros
            </h1>
          </div>
        </div>

        {/* Cashier & Finance Info: تەنیا پارەکە دیاربێت */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Top Money Display - Only the Cash / Revenue */}
          <div className="flex items-center gap-2.5 bg-stone-900/90 px-3.5 py-1.5 rounded-xl border border-emerald-900/50 shadow-inner">
            <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-600/40 flex items-center justify-center text-emerald-400">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <span className="text-stone-400 block text-[10px] font-medium leading-tight">کۆی داهات (پارە):</span>
              <span className="font-black text-emerald-400 text-sm sm:text-base font-mono leading-tight">
                {formatPrice(totalRevenue, currency)}
              </span>
            </div>
          </div>

          {/* Currency toggle */}
          <div className="flex items-center bg-stone-900 p-0.5 rounded-xl border border-stone-800 text-xs font-bold shadow-inner">
            <button
              onClick={() => setCurrency('IQD')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                currency === 'IQD'
                  ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              دینار (د.ع)
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                currency === 'USD'
                  ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              دۆلار ($)
            </button>
          </div>

          {/* Reset sample data */}
          <button
            onClick={() => {
              if (confirm('ئایا دڵنیایت لە گەڕاندنەوەی زانیارییە سەرەتاییە نموونەییەکان؟')) {
                onResetSampleData();
              }
            }}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-900 border border-transparent hover:border-stone-800 transition-colors"
            title="گەڕاندنەوەی داتای سەرەتایی نموونەیی"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* PWA Install on PC & Mobile & Guide */}
          <PWAInstallButton />
        </div>

      </div>

      {/* Tabs Navigation Bar */}
      <div className="px-4 lg:px-6 flex items-center gap-1.5 overflow-x-auto bg-stone-950/90 border-t border-stone-900">
        
        {/* POS Cashier */}
        <button
          onClick={() => setActiveTab('pos')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'pos'
              ? 'border-emerald-500 text-emerald-400 bg-stone-900/90 shadow-[0_4px_12px_rgba(16,185,129,0.2)]'
              : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/40'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>کاشێر و فرۆشتن (POS)</span>
        </button>

        {/* Dedicated Item Entry Section: "داخلکردنی ئەشیا" */}
        <button
          onClick={() => setActiveTab('entry')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'entry'
              ? 'border-emerald-500 text-emerald-400 bg-stone-900/90 shadow-[0_4px_12px_rgba(16,185,129,0.2)]'
              : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/40'
          }`}
        >
          <PackagePlus className="w-4 h-4 text-emerald-400" />
          <span>داخلکردنی ئەشیا و بارنامە</span>
        </button>

        {/* Inventory & Stock */}
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'inventory'
              ? 'border-emerald-500 text-emerald-400 bg-stone-900/90 shadow-[0_4px_12px_rgba(16,185,129,0.2)]'
              : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/40'
          }`}
        >
          <Boxes className="w-4 h-4 text-emerald-400" />
          <span>کۆگا و کاڵاکان</span>
          <span className="bg-stone-800 text-stone-300 border border-stone-700 text-[11px] px-1.5 py-0.5 rounded-full">
            {products.length}
          </span>
        </button>

        {/* Sales Reports */}
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'sales'
              ? 'border-emerald-500 text-emerald-400 bg-stone-900/90 shadow-[0_4px_12px_rgba(16,185,129,0.2)]'
              : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/40'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>ڕاپۆرتی فرۆشراوەکان و قازانج</span>
          {sales.length > 0 && (
            <span className="bg-emerald-950 border border-emerald-700/60 text-emerald-300 text-[11px] px-1.5 py-0.5 rounded-full">
              {sales.length}
            </span>
          )}
        </button>

        {/* Barcode & Label Center */}
        <button
          onClick={() => setActiveTab('barcodes')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'barcodes'
              ? 'border-emerald-500 text-emerald-400 bg-stone-900/90 shadow-[0_4px_12px_rgba(16,185,129,0.2)]'
              : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/40'
          }`}
        >
          <Barcode className="w-4 h-4 text-emerald-400" />
          <span>بارکۆد ساز و چاپکردنی لەزگە</span>
        </button>

      </div>
    </header>
  );
};

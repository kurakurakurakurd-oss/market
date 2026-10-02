import React, { useState, useRef } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  Barcode, 
  Printer, 
  Boxes, 
  ShoppingBag, 
  DollarSign, 
  Camera, 
  X, 
  CheckCircle2, 
  ShieldAlert, 
  PackageCheck, 
  ArrowDownToLine, 
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Product, Currency } from '../types';
import { formatPrice, formatNumber, generateRandomBarcode, normalizeSearchText } from '../utils/formatters';
import { CATEGORIES } from '../data/initialProducts';
import { BarcodeGeneratorModal } from './BarcodeGeneratorModal';
import { CameraScannerModal } from './CameraScannerModal';

interface InventoryManagerProps {
  products: Product[];
  currency: Currency;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onRestock: (productId: string, quantityToAdd: number) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  products,
  currency,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onRestock,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('هەموو جۆرەکان');
  const [stockFilter, setStockFilter] = useState<'all' | 'available' | 'low' | 'out'>('all');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [barcodeLabelProduct, setBarcodeLabelProduct] = useState<Product | null>(null);
  const [restockProductId, setRestockProductId] = useState<string | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(12);
  const [isCameraScanning, setIsCameraScanning] = useState(false);

  // Form State for Add / Edit
  const [formBarcode, setFormBarcode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('خۆراکی قوتوو');
  const [formBuyPrice, setFormBuyPrice] = useState<number>(1000);
  const [formSellPrice, setFormSellPrice] = useState<number>(1500);
  const [formStock, setFormStock] = useState<number>(20);
  const [formMinAlert, setFormMinAlert] = useState<number>(5);
  const [formUnit, setFormUnit] = useState('دانە');

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Open add product modal
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormBarcode(generateRandomBarcode());
    setFormName('');
    setFormCategory('خۆراکی قوتوو');
    setFormBuyPrice(1000);
    setFormSellPrice(1500);
    setFormStock(20);
    setFormMinAlert(5);
    setFormUnit('دانە');
    setIsAddModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormBarcode(p.barcode);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormBuyPrice(p.buyPrice);
    setFormSellPrice(p.sellPrice);
    setFormStock(p.stock);
    setFormMinAlert(p.minStockAlert);
    setFormUnit(p.unit);
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formBarcode.trim()) return;

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        barcode: formBarcode.trim(),
        name: formName.trim(),
        category: formCategory,
        buyPrice: Number(formBuyPrice) || 0,
        sellPrice: Number(formSellPrice) || 0,
        stock: Number(formStock) || 0,
        minStockAlert: Number(formMinAlert) || 5,
        unit: formUnit,
      });
    } else {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        barcode: formBarcode.trim(),
        name: formName.trim(),
        category: formCategory,
        buyPrice: Number(formBuyPrice) || 0,
        sellPrice: Number(formSellPrice) || 0,
        stock: Number(formStock) || 0,
        soldCount: 0,
        minStockAlert: Number(formMinAlert) || 5,
        unit: formUnit,
        createdAt: new Date().toISOString(),
      };
      onAddProduct(newProd);
    }
    setIsAddModalOpen(false);
  };

  // Quick Restock submit
  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (restockProductId && restockAmount > 0) {
      onRestock(restockProductId, restockAmount);
      setRestockProductId(null);
    }
  };

  // Statistics summaries
  const totalStockItems = products.reduce((acc, p) => acc + p.stock, 0);
  const totalSoldItems = products.reduce((acc, p) => acc + p.soldCount, 0);
  const totalInventoryValue = products.reduce((acc, p) => acc + p.stock * p.buyPrice, 0);
  const availableStockCount = products.filter((p) => p.stock > p.minStockAlert).length;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.minStockAlert).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;

  // Normalized search query for robust Kurdish/Arabic/digit/barcode matching
  const normalizedQuery = normalizeSearchText(searchQuery);
  const cleanBarcodeQuery = searchQuery.replace(/[^a-zA-Z0-9]/g, '');

  // Filter products
  const filteredProducts = products.filter((product) => {
    // 1. Check Search Match
    if (normalizedQuery) {
      const normName = normalizeSearchText(product.name);
      const normBarcode = normalizeSearchText(product.barcode);
      const cleanProdBarcode = product.barcode.replace(/[^a-zA-Z0-9]/g, '');
      const normCategory = normalizeSearchText(product.category);

      const matchesSearch =
        normName.includes(normalizedQuery) ||
        normBarcode.includes(normalizedQuery) ||
        (cleanBarcodeQuery && cleanProdBarcode.includes(cleanBarcodeQuery)) ||
        normCategory.includes(normalizedQuery);

      if (!matchesSearch) return false;
    }

    // 2. Check Category Match
    if (selectedCategory !== 'هەموو جۆرەکان' && product.category !== selectedCategory) {
      return false;
    }

    // 3. Check Stock Status Filter (چی ماوە چی نەماوە)
    if (stockFilter === 'available') {
      return product.stock > product.minStockAlert;
    }
    if (stockFilter === 'low') {
      return product.stock > 0 && product.stock <= product.minStockAlert;
    }
    if (stockFilter === 'out') {
      return product.stock <= 0;
    }

    return true;
  });

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-y-auto space-y-5 bg-stone-950 text-stone-100">
      
      {/* Top Highlight Summary Cards (Red & Black Luxury Aesthetics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Total Stock Remaining (چەند ئەشیا ماوە) */}
        <div 
          onClick={() => setStockFilter('available')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between ${
            stockFilter === 'available'
              ? 'bg-emerald-950/80 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500'
              : 'bg-stone-900/90 border-emerald-900/40 hover:border-emerald-600/70 hover:bg-stone-900'
          }`}
        >
          <div>
            <span className="text-xs font-bold text-emerald-400 block mb-1">
              چی ماوە (بەردەست لە عەمبار)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white">
                {formatNumber(totalStockItems)}
              </span>
              <span className="text-xs text-stone-400 font-medium">دانە ماوە</span>
            </div>
            <span className="text-[11px] text-emerald-400/80 font-medium mt-1 block">
              {availableStockCount} جۆر بڕی تەواویان هەیە
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        {/* Total Sold Items (چەند فرۆشراوە) */}
        <div className="bg-stone-900/90 p-4 rounded-2xl border border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-cyan-400 block mb-1">
              کۆی ئەشیاکانی فرۆشراو
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white">
                {formatNumber(totalSoldItems)}
              </span>
              <span className="text-xs text-stone-400 font-medium">دانە فرۆشراوە</span>
            </div>
            <span className="text-[11px] text-cyan-400/80 font-medium mt-1 block">
              سەرجەم کڕیارەکان
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800/50 text-cyan-400 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Total Inventory Asset Value (نرخی سەرمایەی عەمبار) */}
        <div className="bg-stone-900/90 p-4 rounded-2xl border border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-400 block mb-1">
              سەرمایەی ماوە لە کۆگا (بە کڕین)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-white">
                {formatPrice(totalInventoryValue, currency)}
              </span>
            </div>
            <span className="text-[11px] text-stone-400 mt-1 block">
              بەهای هەموو کاڵاکانی ماوە
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-950 border border-amber-800/50 text-amber-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Stock Alerts (چی نەماوە و کەمی ماوە) */}
        <div 
          onClick={() => setStockFilter(outOfStockCount > 0 ? 'out' : 'low')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between ${
            stockFilter === 'out' || stockFilter === 'low'
              ? 'bg-rose-950/60 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)] ring-1 ring-rose-500'
              : 'bg-stone-900/90 border-stone-800 hover:border-rose-700/60 hover:bg-stone-900'
          }`}
        >
          <div>
            <span className="text-xs font-bold text-rose-400 block mb-1">
              چی نەماوە و کەمی ماوە
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-md bg-rose-950 border border-rose-700/70 text-rose-300 font-bold">
                {outOfStockCount} نەماوە (سیفر)
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-amber-950 border border-amber-700/70 text-amber-300 font-bold">
                {lowStockCount} کەمی ماوە
              </span>
            </div>
            <span className="text-[11px] text-rose-400/80 mt-1.5 block">
              پێویستە تێبکرێنەوە
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-950 border border-rose-800/60 text-rose-400 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Inventory Section */}
      <div className="bg-stone-900/95 rounded-2xl border border-emerald-900/30 shadow-2xl overflow-hidden flex flex-col flex-1">
        
        {/* Controls Bar: Enhanced Search, Category, Status Filter & Actions */}
        <div className="p-4 border-b border-stone-800 bg-stone-900/80 flex flex-col gap-3">
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Search Input (Fixed, Fast, supports Barcode + Name + Camera) */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="گەڕان بە ناوی کاڵا، بارکۆد، یان جۆر (دەستبەجێ)..."
                className="w-full pr-10 pl-20 py-2.5 rounded-xl border border-emerald-900/50 bg-stone-950 text-stone-100 placeholder-stone-500 text-xs font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-inner"
              />
              
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="p-1 text-stone-400 hover:text-white rounded-md transition-colors"
                    title="سڕینەوەی گەڕان"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCameraScanning(true)}
                  className="p-1 rounded-lg bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-400 transition-colors"
                  title="خوێندنەوەی بارکۆد بە کامێرا بۆ دۆزینەوە"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-stone-800 bg-stone-950 text-stone-200 text-xs focus:outline-none focus:border-emerald-500 shadow-inner"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-stone-900 text-stone-100">
                  {c}
                </option>
              ))}
            </select>

            {/* Add Product Button */}
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>زیادکردنی کاڵای نوێ بۆ کۆگا</span>
            </button>
          </div>

          {/* Prominent "چی ماوە چی نەماوە" Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800/70">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-stone-400 ml-1">دۆخی کاڵاکان:</span>
              
              {/* All */}
              <button
                onClick={() => setStockFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  stockFilter === 'all'
                    ? 'bg-stone-800 text-white border border-stone-600 shadow-xs'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                }`}
              >
                هەموو کاڵاکان ({products.length})
              </button>

              {/* What is Remaining: چی ماوە */}
              <button
                onClick={() => setStockFilter('available')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  stockFilter === 'available'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'text-emerald-400/70 hover:text-emerald-300 hover:bg-emerald-950/40'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>چی ماوە (بەردەست - {availableStockCount})</span>
              </button>

              {/* Low Stock: کەمی ماوە */}
              <button
                onClick={() => setStockFilter('low')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  stockFilter === 'low'
                    ? 'bg-amber-950 text-amber-300 border border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                    : 'text-amber-400/70 hover:text-amber-300 hover:bg-amber-950/40'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>کەمی ماوە ({lowStockCount})</span>
              </button>

              {/* Out of Stock: چی نەماوە */}
              <button
                onClick={() => setStockFilter('out')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  stockFilter === 'out'
                    ? 'bg-rose-950 text-rose-300 border border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                    : 'text-rose-400/70 hover:text-rose-300 hover:bg-rose-950/40'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span>چی نەماوە (تەواوبوو - {outOfStockCount})</span>
              </button>
            </div>

            {/* Results Count & Clear Search shortcut */}
            <div className="text-xs text-stone-400 flex items-center gap-2">
              {searchQuery && (
                <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-900/60">
                  {filteredProducts.length} ئەنجام بۆ «{searchQuery}»
                </span>
              )}
              {selectedCategory !== 'هەموو جۆرەکان' && (
                <button
                  onClick={() => setSelectedCategory('هەموو جۆرەکان')}
                  className="text-stone-400 hover:text-emerald-400 underline text-[11px]"
                >
                  پاککردنەوەی جۆر
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Product Table (High-contrast Dark Green & Obsidian Black) */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-right text-xs">
            <thead className="bg-stone-950 text-stone-400 font-bold border-b border-stone-800 tracking-wide">
              <tr>
                <th className="py-3 px-4">ناوی کاڵا و جۆر</th>
                <th className="py-3 px-3">بارکۆد</th>
                <th className="py-3 px-3 text-center">دۆخی عەمبار (چی ماوە / نەماوە)</th>
                <th className="py-3 px-3 text-center">چەند فرۆشراوە</th>
                <th className="py-3 px-3">نرخی کڕین</th>
                <th className="py-3 px-3">نرخی فرۆشتن</th>
                <th className="py-3 px-3 text-emerald-400">قازانج لە دانە</th>
                <th className="py-3 px-4 text-center">کردارەکان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60">
              {filteredProducts.map((product) => {
                const isLowStock = product.stock > 0 && product.stock <= product.minStockAlert;
                const isOutOfStock = product.stock <= 0;
                const isAvailable = product.stock > product.minStockAlert;
                const profitPerUnit = product.sellPrice - product.buyPrice;

                return (
                  <tr
                    key={product.id}
                    className={`transition-colors group ${
                      isOutOfStock
                        ? 'bg-rose-950/20 hover:bg-rose-950/40'
                        : isLowStock
                        ? 'bg-amber-950/15 hover:bg-amber-950/30'
                        : 'hover:bg-emerald-950/20'
                    }`}
                  >
                    {/* Name & Category */}
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-white text-sm group-hover:text-emerald-300 transition-colors">
                        {product.name}
                      </div>
                      <div className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-1.5">
                        <span className="bg-stone-800 px-1.5 py-0.5 rounded text-stone-300 border border-stone-700/60">
                          {product.category}
                        </span>
                        <span>•</span>
                        <span>یەکە: {product.unit}</span>
                      </div>
                    </td>

                    {/* Barcode */}
                    <td className="py-3 px-3">
                      <div className="inline-flex items-center gap-1.5 bg-stone-950 px-2.5 py-1 rounded-lg font-mono text-emerald-400 text-[11px] font-bold border border-emerald-900/30">
                        <Barcode className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{product.barcode}</span>
                      </div>
                    </td>

                    {/* Remaining Stock & Status Badge (چی ماوە چی نەماوە) */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex flex-col items-center justify-center gap-1">
                        {isOutOfStock ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-950/90 text-rose-300 border border-rose-600/70 font-black shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                            <span>نەماوە (تەواوبوو - ٠)</span>
                          </div>
                        ) : isLowStock ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-950/90 text-amber-300 border border-amber-600/70 font-black shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            <span>کەمی ماوە: {product.stock} {product.unit}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/90 text-emerald-300 border border-emerald-600/60 font-black shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>ماوە: {product.stock} {product.unit}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Units Sold (چەند فرۆشراوە) */}
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-cyan-300 text-sm px-2.5 py-0.5 rounded-lg bg-cyan-950/70 border border-cyan-800/40">
                        {formatNumber(product.soldCount)} دانە
                      </span>
                    </td>

                    {/* Buy Price */}
                    <td className="py-3 px-3 font-semibold text-stone-400">
                      {formatPrice(product.buyPrice, currency)}
                    </td>

                    {/* Sell Price */}
                    <td className="py-3 px-3 font-black text-white text-sm">
                      {formatPrice(product.sellPrice, currency)}
                    </td>

                    {/* Profit per unit */}
                    <td className="py-3 px-3 font-bold text-emerald-400">
                      +{formatPrice(profitPerUnit, currency)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Quick restock button */}
                        <button
                          type="button"
                          onClick={() => setRestockProductId(product.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 hover:text-white text-[11px] font-bold border border-emerald-700/50 transition-colors shadow-xs"
                          title="زیادکردنی عەمبار"
                        >
                          + تێکردنەوە
                        </button>

                        {/* Barcode Sticker Label button */}
                        <button
                          type="button"
                          onClick={() => setBarcodeLabelProduct(product)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                          title="چاپکردنی لەزگەی بارکۆد"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(product)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-300 hover:bg-stone-800 transition-colors"
                          title="دەستکاریکردنی کاڵا"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`ئایا دڵنیایت لە سڕینەوەی کاڵای "${product.name}"؟`)) {
                              onDeleteProduct(product.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                          title="سڕینەوە"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="h-56 flex flex-col items-center justify-center text-stone-400 p-6 text-center">
              <Package className="w-10 h-10 mb-2 opacity-30 text-emerald-400" />
              <p className="text-sm font-bold text-stone-200">
                هیچ کاڵایەک نەدۆزرایەوە بەپێی ئەم فلتەر یان گەڕانە
              </p>
              <p className="text-xs text-stone-500 mt-1">
                تکایە دڵنیابەرەوە لە ڕێنووسی ناوەکە، یان بارکۆدەکە بە تەواوی لێبدە.
              </p>
              {(searchQuery || selectedCategory !== 'هەموو جۆرەکان' || stockFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('هەموو جۆرەکان');
                    setStockFilter('all');
                  }}
                  className="mt-3 px-3.5 py-1.5 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 rounded-xl text-xs font-bold border border-emerald-700/50 transition-colors"
                >
                  پاککردنەوەی هەموو گەڕان و فلتەرەکان
                </button>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Modal: Add or Edit Product (Red & Black Theme) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-stone-900 rounded-2xl shadow-2xl max-w-lg w-full border border-emerald-800/40 overflow-hidden text-stone-100">
            
            <div className="px-6 py-4 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700/60 text-emerald-400 flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {editingProduct ? 'دەستکاریکردنی زانیارییەکانی کاڵا' : 'زیادکردنی کاڵای نوێ بۆ مارکێت'}
                  </h3>
                  <p className="text-xs text-stone-400">
                    بارکۆد، نرخەکانی کڕین و فرۆشتن و بڕی ماوە دیاری بکە
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 text-xs">
              
              {/* Barcode Section with Camera Scan & Auto-generate */}
              <div>
                <label className="block font-bold text-stone-300 mb-1">
                  بارکۆدی کاڵا (لە جیهاز بدە یان دروستی بکە):
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Barcode className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                    <input
                      type="text"
                      required
                      value={formBarcode}
                      onChange={(e) => setFormBarcode(e.target.value)}
                      placeholder="بۆ نموونە: 6291100234501"
                      className="w-full pr-9 pl-3 py-2 rounded-xl border border-stone-700 bg-stone-950 font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormBarcode(generateRandomBarcode())}
                    className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold whitespace-nowrap transition-colors"
                  >
                    بارکۆدی هەڕەمەکی
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCameraScanning(true)}
                    className="p-2 rounded-xl bg-emerald-950 border border-emerald-700/60 text-emerald-400 hover:bg-emerald-900 transition-colors"
                    title="خوێندنەوە بە کامێرا"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block font-bold text-stone-300 mb-1">ناوی کاڵا:</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="بۆ نموونە: برنجی کوردی، چای مەحمود، زاهی..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-700 bg-stone-950 font-medium text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-300 mb-1">جۆری کاڵا:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-700 bg-stone-950 text-stone-200 focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'هەموو جۆرەکان').map((c) => (
                      <option key={c} value={c} className="bg-stone-900 text-stone-100">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-300 mb-1">یەکە:</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-700 bg-stone-950 text-stone-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="دانە">دانە</option>
                    <option value="پاکەت">پاکەت</option>
                    <option value="کیلۆ">کیلۆ</option>
                    <option value="بوتڵ">بوتڵ</option>
                    <option value="کارتۆن">کارتۆن</option>
                    <option value="قتوو">قتوو</option>
                    <option value="فەردە">فەردە</option>
                  </select>
                </div>
              </div>

              {/* Prices: Cost vs Sale */}
              <div className="grid grid-cols-2 gap-3 bg-stone-950 p-3 rounded-xl border border-stone-800">
                <div>
                  <label className="block font-bold text-stone-400 mb-1">
                    نرخی کڕین (تێچوو بە دینار):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="250"
                    required
                    value={formBuyPrice}
                    onChange={(e) => setFormBuyPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-stone-700 bg-stone-900 font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-emerald-400 mb-1">
                    نرخی فرۆشتن (بە دینار):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="250"
                    required
                    value={formSellPrice}
                    onChange={(e) => setFormSellPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-emerald-700/60 bg-stone-900 font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="col-span-2 flex items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-800">
                  <span>قازانج لە هەر دانەیەک:</span>
                  <span className="font-extrabold text-emerald-400">
                    +{formatPrice(Math.max(0, formSellPrice - formBuyPrice), currency)}
                  </span>
                </div>
              </div>

              {/* Stock Quantity (چەند ماوە) & Low Stock Alert */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-300 mb-1">
                    بڕی ماوە لە عەمبار (Stock):
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-700 bg-stone-950 font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-300 mb-1">
                    ئاگاداری کاتێک کەمتر بوو لە:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formMinAlert}
                    onChange={(e) => setFormMinAlert(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-700 bg-stone-950 font-mono text-stone-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-400 hover:bg-stone-800 font-semibold"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  {editingProduct ? 'نوێکردنەوەی کاڵا' : 'تۆمارکردن'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Modal: Quick Restock (+ تێکردنەوەی عەمبار) */}
      {restockProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-stone-900 rounded-2xl shadow-2xl max-w-sm w-full border border-emerald-800/50 p-5 text-stone-100">
            <h3 className="font-bold text-white text-sm mb-1">تێکردنەوە و زیادکردنی عەمبار</h3>
            <p className="text-xs text-stone-400 mb-4">
              چەند دانە نوێ لەم کاڵایە هاتووەتە مارکێت؟
            </p>
            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <input
                  type="number"
                  min="1"
                  autoFocus
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-emerald-500 bg-stone-950 font-mono font-bold text-center text-xl text-emerald-400 focus:outline-none shadow-inner"
                />
              </div>
              <div className="flex items-center gap-1 justify-center">
                {[6, 12, 24, 50, 100].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRestockAmount(num)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-emerald-950 hover:text-emerald-300 text-stone-300 font-mono font-bold border border-stone-700 transition-colors"
                  >
                    +{num}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setRestockProductId(null)}
                  className="px-3 py-1.5 text-xs text-stone-400 hover:bg-stone-800 rounded-lg"
                >
                  داخستن
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                >
                  زیادکردن بۆ کۆگا
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode label modal */}
      {barcodeLabelProduct && (
        <BarcodeGeneratorModal
          product={barcodeLabelProduct}
          currency={currency}
          onClose={() => setBarcodeLabelProduct(null)}
        />
      )}

      {/* Camera scanner for modal */}
      {isCameraScanning && (
        <CameraScannerModal
          onScanSuccess={(scanned) => {
            setSearchQuery(scanned);
            setIsCameraScanning(false);
          }}
          onClose={() => setIsCameraScanning(false)}
        />
      )}

    </div>
  );
};

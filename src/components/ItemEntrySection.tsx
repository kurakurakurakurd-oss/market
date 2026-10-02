import React, { useState, useRef, useEffect } from 'react';
import { 
  PackagePlus, 
  Barcode, 
  Camera, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  History, 
  Plus, 
  ArrowDownToLine, 
  Boxes, 
  Check, 
  X, 
  Search, 
  Tag, 
  DollarSign, 
  ShieldAlert,
  ListFilter,
  Download,
  HelpCircle,
  FileArchive,
  Globe,
  Laptop,
  TrendingUp
} from 'lucide-react';
import { Product, Currency, InwardEntryRecord } from '../types';
import { formatPrice, formatNumber, generateRandomBarcode, formatDate, normalizeSearchText } from '../utils/formatters';
import { CATEGORIES } from '../data/initialProducts';
import { playBarcodeBeep, playSuccessChime, playErrorBeep } from '../utils/audio';
import { CameraScannerModal } from './CameraScannerModal';

interface ItemEntrySectionProps {
  products: Product[];
  currency: Currency;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onRestock: (productId: string, quantityToAdd: number, newBuyPrice?: number, newSellPrice?: number) => void;
  inwardHistory: InwardEntryRecord[];
  onAddInwardRecord: (record: InwardEntryRecord) => void;
}

export const ItemEntrySection: React.FC<ItemEntrySectionProps> = ({
  products,
  currency,
  onAddProduct,
  onUpdateProduct,
  onRestock,
  inwardHistory,
  onAddInwardRecord,
}) => {
  // Input fields state
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('خۆراکی قوتوو');
  const [unit, setUnit] = useState('دانە');
  const [buyPrice, setBuyPrice] = useState<number>(1000);
  const [sellPrice, setSellPrice] = useState<number>(1500);
  const [quantity, setQuantity] = useState<number>(12);
  const [minAlert, setMinAlert] = useState<number>(5);
  const [supplierName, setSupplierName] = useState('');
  
  // Existing product matched
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Status Filter view for "چی ماوە چی نەماوە"
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'out' | 'low' | 'available'>('out');
  const [stockSearch, setStockSearch] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Flash message
  const showFeedback = (text: string, type: 'success' | 'info' | 'error') => {
    setFeedback({ text, type });
    setTimeout(() => {
      setFeedback(null);
    }, 3200);
  };

  // Watch for barcode changes to detect existing product
  useEffect(() => {
    const trimmed = barcode.trim();
    if (!trimmed) {
      setMatchedProduct(null);
      return;
    }

    const cleanInput = trimmed.replace(/[^a-zA-Z0-9]/g, '');
    const found = products.find(
      (p) => p.barcode === trimmed || (cleanInput && p.barcode.replace(/[^a-zA-Z0-9]/g, '') === cleanInput)
    );

    if (found) {
      setMatchedProduct(found);
      setName(found.name);
      setCategory(found.category);
      setUnit(found.unit);
      setBuyPrice(found.buyPrice);
      setSellPrice(found.sellPrice);
      setMinAlert(found.minStockAlert);
      playBarcodeBeep();
    } else {
      setMatchedProduct(null);
    }
  }, [barcode, products]);

  // Handle Entry Form Submission
  const handleSubmitEntry = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanBarcode = barcode.trim();
    const cleanName = name.trim();

    if (!cleanBarcode) {
      playErrorBeep();
      showFeedback('تکایە بارکۆدی کاڵاکە لێبدە یان دیاری بکە!', 'error');
      return;
    }

    if (!cleanName) {
      playErrorBeep();
      showFeedback('تکایە ناوی کاڵاکە بنووسە!', 'error');
      return;
    }

    if (quantity <= 0) {
      playErrorBeep();
      showFeedback('بڕی داخلکراو دەبێت لە ١ دانە زیاتر بێت!', 'error');
      return;
    }

    // 1. If product already exists in market: RESTOCK & UPDATE
    if (matchedProduct) {
      onRestock(matchedProduct.id, quantity, buyPrice, sellPrice);

      const inwardRecord: InwardEntryRecord = {
        id: `inward-${Date.now()}`,
        productId: matchedProduct.id,
        productName: matchedProduct.name,
        barcode: matchedProduct.barcode,
        quantityAdded: quantity,
        buyPrice: buyPrice,
        sellPrice: sellPrice,
        totalCost: quantity * buyPrice,
        supplierName: supplierName.trim() || undefined,
        timestamp: new Date().toISOString(),
        isNewProduct: false,
      };
      onAddInwardRecord(inwardRecord);

      playSuccessChime();
      showFeedback(
        `+${quantity} دانە لە "${matchedProduct.name}" بە سەرکەوتوویی زیادکرا بۆ عەمبار!`,
        'success'
      );
      resetForm();
      return;
    }

    // 2. If it is a completely NEW product: REGISTER & ADD TO STOCK
    const newProductId = `prod-${Date.now()}`;
    const newProduct: Product = {
      id: newProductId,
      barcode: cleanBarcode,
      name: cleanName,
      category,
      buyPrice,
      sellPrice,
      stock: quantity,
      soldCount: 0,
      minStockAlert: minAlert,
      unit,
      createdAt: new Date().toISOString(),
    };

    onAddProduct(newProduct);

    const inwardRecord: InwardEntryRecord = {
      id: `inward-${Date.now()}`,
      productId: newProductId,
      productName: cleanName,
      barcode: cleanBarcode,
      quantityAdded: quantity,
      buyPrice,
      sellPrice,
      totalCost: quantity * buyPrice,
      supplierName: supplierName.trim() || undefined,
      timestamp: new Date().toISOString(),
      isNewProduct: true,
    };
    onAddInwardRecord(inwardRecord);

    playSuccessChime();
    showFeedback(`کاڵای نوێ "${cleanName}" بە ${quantity} دانەوە خرایە عەمبار!`, 'success');
    resetForm();
  };

  const resetForm = () => {
    setBarcode('');
    setName('');
    setQuantity(12);
    setSupplierName('');
    setMatchedProduct(null);
    barcodeInputRef.current?.focus();
  };

  // Quick direct select from "چی نەماوە" table into form
  const handleSelectToRestock = (prod: Product) => {
    setBarcode(prod.barcode);
    setMatchedProduct(prod);
    setName(prod.name);
    setCategory(prod.category);
    setUnit(prod.unit);
    setBuyPrice(prod.buyPrice);
    setSellPrice(prod.sellPrice);
    setMinAlert(prod.minStockAlert);
    setQuantity(12);
    barcodeInputRef.current?.focus();
    playBarcodeBeep();
  };

  // Categorize products for "چی ماوە چی نەماوە" (کۆنترۆڵی عەمبار)
  const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
  const totalSold = products.reduce((acc, p) => acc + p.soldCount, 0);
  const outOfStockItems = products.filter((p) => p.stock <= 0);
  const lowStockItems = products.filter((p) => p.stock > 0 && p.stock <= p.minStockAlert);
  const availableItems = products.filter((p) => p.stock > p.minStockAlert);

  const normStockSearch = normalizeSearchText(stockSearch);
  const cleanSearchBarcode = stockSearch.replace(/[^a-zA-Z0-9]/g, '');

  const displayList = products.filter((p) => {
    if (normStockSearch) {
      const normName = normalizeSearchText(p.name);
      const normBarcode = normalizeSearchText(p.barcode);
      const cleanProdBarcode = p.barcode.replace(/[^a-zA-Z0-9]/g, '');
      const normCat = normalizeSearchText(p.category);

      const matchesSearch =
        normName.includes(normStockSearch) ||
        normBarcode.includes(normStockSearch) ||
        (cleanSearchBarcode && cleanProdBarcode.includes(cleanSearchBarcode)) ||
        normCat.includes(normStockSearch);

      if (!matchesSearch) return false;
    }

    if (stockStatusFilter === 'out') return p.stock <= 0;
    if (stockStatusFilter === 'low') return p.stock > 0 && p.stock <= p.minStockAlert;
    if (stockStatusFilter === 'available') return p.stock > p.minStockAlert;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-y-auto space-y-5 bg-stone-950 text-stone-100">
      
      {/* Top Banner: Action row with title and system ZIP download / Host guide */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-stone-900/90 border border-stone-800 p-3.5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
            <PackagePlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">داخلکردنی ئەشیا و بەڕێوەبردنی بارنامە</h2>
            <p className="text-xs text-stone-400">تۆمارکردنی کاڵای نوێ، زیادکردنی بار، و پشکنینی عەمبار</p>
          </div>
        </div>

        {/* Project ZIP Download & Host Guide (Neatly placed here away from cashier) */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <a
            href="/pedros_pos_project.zip"
            download="pedros_pos_project.zip"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs shadow-md transition-all border border-emerald-400/30 active:scale-98"
            title="داگرتنی فایلی ZIP ی تەواوی کۆد و داتای پڕۆژە"
          >
            <Download className="w-4 h-4" />
            <span>داگرتنی کۆپی (ZIP)</span>
          </a>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-emerald-400 border border-stone-700 text-xs font-bold transition-all"
            title="ڕێنمایی هۆستکردن و فرۆشتنی پڕۆژە"
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>ڕێنمایی هۆست</span>
          </button>
        </div>
      </div>

      {/* Prominent Stock Dashboard (چی ماوە vs چی نەماوە) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Available stock card (چی ماوە - لە عەمبار) */}
        <div 
          onClick={() => setStockStatusFilter('available')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between ${
            stockStatusFilter === 'available'
              ? 'bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
              : 'bg-stone-900/90 border-stone-800 hover:border-emerald-600/70 hover:bg-stone-900'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-black text-emerald-400">
                چی ماوە (لە عەمبار)
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white">
                {formatNumber(totalStock)}
              </span>
              <span className="text-xs text-emerald-400 font-bold">دانە</span>
            </div>
            <p className="text-[11px] text-emerald-400/80 mt-1">
              لەناو {availableItems.length} جۆر کاڵادا
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Out of stock card (چی نەماوە - سیفر) */}
        <div 
          onClick={() => setStockStatusFilter('out')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between ${
            stockStatusFilter === 'out'
              ? 'bg-rose-950/80 border-rose-500 ring-2 ring-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
              : 'bg-stone-900/90 border-stone-800 hover:border-rose-700/60 hover:bg-stone-900'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-xs font-black text-rose-400">
                چی نەماوە (سیفر و تەواو)
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white">
                {outOfStockItems.length}
              </span>
              <span className="text-xs text-rose-400 font-bold">جۆر کاڵا</span>
            </div>
            <p className="text-[11px] text-rose-400/80 mt-1">
              پێویستە دەستبەجێ بار داخل بکرێت
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-950 border border-rose-800/60 text-rose-400 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Low stock card (کەمی ماوە) */}
        <div 
          onClick={() => setStockStatusFilter('low')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between ${
            stockStatusFilter === 'low'
              ? 'bg-amber-950/80 border-amber-500 ring-2 ring-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
              : 'bg-stone-900/90 border-stone-800 hover:border-amber-700/60 hover:bg-stone-900'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="text-xs font-black text-amber-400">
                کەمی ماوە (ئاگاداری)
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white">
                {lowStockItems.length}
              </span>
              <span className="text-xs text-amber-400 font-bold">جۆر کاڵا</span>
            </div>
            <p className="text-[11px] text-amber-400/80 mt-1">
              لە ئاستی دیاریکراو کەمتر ماون
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-950 border border-amber-800/50 text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Total Sold card (کۆی فرۆشراو لە هەموو کاڵاکان) */}
        <div 
          onClick={() => setStockStatusFilter('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between ${
            stockStatusFilter === 'all'
              ? 'bg-stone-800 border-cyan-500 ring-2 ring-cyan-500/30 shadow-xs'
              : 'bg-stone-900/90 border-stone-800 hover:border-stone-700 hover:bg-stone-900'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <span className="text-xs font-black text-cyan-400">
                کۆی فرۆشراو
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white">
                {formatNumber(totalSold)}
              </span>
              <span className="text-xs text-cyan-400 font-bold">دانە</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              سەرجەم: {products.length} جۆر کاڵا
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800/50 text-cyan-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Two-Column Workflow (Red & Black Luxury Theme) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT / CENTER COLUMN: Rapid Item Entry Station (داخلکردنی ئەشیا) */}
        <div className="lg:col-span-7 bg-stone-900/95 rounded-2xl border border-emerald-900/30 shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-emerald-950 via-stone-900 to-emerald-950 border-b border-emerald-900/40 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-900/80 border border-emerald-600/50 flex items-center justify-center text-emerald-300">
                <PackagePlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  بەشی داخلکردنی ئەشیا و شتی نوێ
                </h3>
                <p className="text-xs text-emerald-400/80">
                  بارکۆد لێبدە، بڕەکەی بنووسە و دەستبەجێ دەچێتە عەمبار
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Camera className="w-4 h-4" />
              <span>کامێرا</span>
            </button>
          </div>

          {/* Notification Feedback */}
          {feedback && (
            <div
              className={`p-3 text-xs font-bold flex items-center gap-2 border-b ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                  : feedback.type === 'error'
                  ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                  : 'bg-stone-900 text-emerald-300 border-emerald-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Entry Form */}
          <form onSubmit={handleSubmitEntry} className="p-5 space-y-4 text-stone-200 text-xs">
            
            {/* Barcode Input Section */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                  <Barcode className="w-4 h-4 text-emerald-400" />
                  <span>بارکۆدی کاڵا (لە جیهاز بدە یان دەستکاری بکە):</span>
                </label>
                <button
                  type="button"
                  onClick={() => setBarcode(generateRandomBarcode())}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline"
                >
                  دروستکردنی بارکۆدی نوێ
                </button>
              </div>

              <div className="relative">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  required
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="بارکۆد لە جیهاز بدە، بۆ نموونە: 6291100234501"
                  className="w-full pr-4 pl-24 py-2.5 rounded-xl border border-stone-700 bg-stone-950 font-mono font-bold text-emerald-400 text-sm focus:outline-none focus:border-emerald-500 shadow-inner"
                />
                {barcode && (
                  <button
                    type="button"
                    onClick={() => {
                      setBarcode('');
                      setMatchedProduct(null);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Product Status Alert Banner (Recognized vs New) */}
            {matchedProduct ? (
              <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-600/60 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-900 border border-emerald-500/50 text-emerald-300 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-white">
                      {matchedProduct.name}
                    </span>
                    <span className="text-xs bg-emerald-900/90 text-emerald-300 border border-emerald-700/60 font-black px-2 py-0.5 rounded-full">
                      لە مارکێتدا هەیە
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-emerald-300/80 mt-1">
                    <span>
                      بڕی ئێستا لە عەمبار:{' '}
                      <strong className="text-white">{matchedProduct.stock} {matchedProduct.unit}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      کۆی فرۆشراو: <strong className="text-white">{matchedProduct.soldCount}</strong>
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-300 mt-1">
                    بڕی نوێی ئەم بارە لە خوارەوە بنووسە تا ڕاستەوخۆ بچێتە سەر کۆگا.
                  </p>
                </div>
              </div>
            ) : barcode.trim() ? (
              <div className="p-3 rounded-xl bg-stone-950 border border-cyan-800/60 flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-xs text-cyan-300 font-bold">
                  ئەم بارکۆدە نوێیە! تکایە ناو و نرخی کڕین و فرۆشتنی لێرە بنووسە تا تۆمار بێت.
                </span>
              </div>
            ) : null}

            {/* Product Name Input */}
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1">
                ناوی کاڵا یان بابەت:
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="بۆ نموونە: کێکی لۆتۆس، ڕۆنی زەیتوون، ئاوی سروشتی..."
                className="w-full px-3 py-2.5 rounded-xl border border-stone-700 bg-stone-950 font-bold text-white text-xs focus:outline-none focus:border-emerald-500 shadow-inner"
              />
            </div>

            {/* Category & Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  جۆری کاڵا:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-stone-200 text-xs focus:outline-none focus:border-emerald-500"
                >
                  {CATEGORIES.filter((c) => c !== 'هەموو جۆرەکان').map((c) => (
                    <option key={c} value={c} className="bg-stone-900 text-stone-100">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  یەکە (فرۆشتن بە چی):
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-stone-200 text-xs focus:outline-none focus:border-emerald-500"
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

            {/* Prices Section: Cost vs Sale Price */}
            <div className="grid grid-cols-2 gap-3 bg-stone-950 p-3 rounded-xl border border-stone-800">
              <div>
                <label className="block text-xs font-bold text-stone-400 mb-1">
                  نرخی کڕین (تێچوو بە دینار):
                </label>
                <input
                  type="number"
                  min="0"
                  step="250"
                  required
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-700 bg-stone-900 font-mono font-bold text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-400 mb-1">
                  نرخی فرۆشتن بە کڕیار:
                </label>
                <input
                  type="number"
                  min="0"
                  step="250"
                  required
                  value={sellPrice}
                  onChange={(e) => setSellPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-emerald-700/60 bg-stone-900 font-mono font-bold text-emerald-300 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="col-span-2 flex items-center justify-between text-xs text-stone-400 pt-1 border-t border-stone-800">
                <span>قازانج لە هەر دانەیەک:</span>
                <span className="font-extrabold text-emerald-400">
                  +{formatPrice(Math.max(0, sellPrice - buyPrice), currency)}
                </span>
              </div>
            </div>

            {/* Quantity to Receive / Add to Stock */}
            <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-800/60">
              <label className="block text-xs font-black text-emerald-300 mb-1">
                چەند دانە نوێ هاتووەتە مارکێت بۆ داخلکردن؟ (بڕ):
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-32 px-3 py-2 rounded-xl border-2 border-emerald-500 font-mono font-black text-xl text-center text-emerald-300 bg-stone-950 focus:outline-none shadow-inner"
                />
                
                {/* Quick quantity pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[6, 12, 24, 48, 100].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuantity(num)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-stone-900 border border-emerald-800 text-emerald-300 hover:bg-emerald-950 transition-colors"
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculation Preview */}
              <div className="mt-2 text-xs text-emerald-400/90 flex items-center justify-between">
                <span>کۆی پارەی کڕینی ئەم بارە:</span>
                <span className="font-black text-sm text-white">
                  {formatPrice(quantity * buyPrice, currency)}
                </span>
              </div>
            </div>

            {/* Optional Supplier Name */}
            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-1">
                ناوی کۆمپانیا یان نوێنەری بار (تێبینی - ئارەزوومەندانە):
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="بۆ نموونە: کۆمپانیای دابەشکاری، بازاڕی عەلوە..."
                className="w-full px-3 py-2 rounded-xl border border-stone-700 bg-stone-950 text-xs text-stone-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-99 text-white font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
            >
              <ArrowDownToLine className="w-5 h-5" />
              <span>
                {matchedProduct ? 'تەواوکردن و زیادکردن بۆ عەمبار' : 'تۆمارکردن و داخلکردنی کاڵای نوێ'}
              </span>
            </button>
          </form>

        </div>

        {/* RIGHT COLUMN: Clear View of "چی ماوە چی نەماوە" & Quick-Restock Action */}
        <div className="lg:col-span-5 bg-stone-900/95 rounded-2xl border border-emerald-900/30 shadow-2xl overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="p-4 border-b border-stone-800 bg-stone-950 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <ListFilter className="w-4 h-4 text-emerald-400" />
                <span>چاودێری "چی ماوە و چی نەماوە"</span>
              </h3>
              <span className="text-xs font-bold text-stone-400">
                {displayList.length} کاڵا
              </span>
            </div>

            {/* Search within status view */}
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400" />
              <input
                type="text"
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                placeholder="گەڕان بەپێی ناو یان بارکۆد..."
                className="w-full pr-9 pl-3 py-1.5 rounded-lg border border-stone-700 text-xs bg-stone-950 text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-stone-950 p-1 rounded-xl text-[11px] font-bold text-center border border-stone-800">
              <button
                type="button"
                onClick={() => setStockStatusFilter('out')}
                className={`py-1.5 rounded-lg transition-colors ${
                  stockStatusFilter === 'out'
                    ? 'bg-rose-950 text-rose-300 border border-rose-600/70 shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                چی نەماوە ({outOfStockItems.length})
              </button>
              <button
                type="button"
                onClick={() => setStockStatusFilter('low')}
                className={`py-1.5 rounded-lg transition-colors ${
                  stockStatusFilter === 'low'
                    ? 'bg-amber-950 text-amber-300 border border-amber-600/70 shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                کەمی ماوە ({lowStockItems.length})
              </button>
              <button
                type="button"
                onClick={() => setStockStatusFilter('available')}
                className={`py-1.5 rounded-lg transition-colors ${
                  stockStatusFilter === 'available'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/70 shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                چی ماوە ({availableItems.length})
              </button>
            </div>
          </div>

          {/* Items List with 1-Click Fast Restock */}
          <div className="divide-y divide-stone-800 overflow-y-auto max-h-[500px]">
            {displayList.map((product) => {
              const isOut = product.stock <= 0;
              const isLow = product.stock > 0 && product.stock <= product.minStockAlert;

              return (
                <div
                  key={product.id}
                  className={`p-3 transition-colors flex items-center justify-between gap-2.5 ${
                    isOut
                      ? 'bg-rose-950/20 hover:bg-rose-950/40'
                      : isLow
                      ? 'bg-amber-950/20 hover:bg-amber-950/30'
                      : 'hover:bg-emerald-950/20'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-white truncate">
                        {product.name}
                      </h4>
                      {isOut && (
                        <span className="text-[10px] bg-rose-950 border border-rose-600/70 text-rose-300 font-black px-1.5 py-0.2 rounded">
                          نەماوە!
                        </span>
                      )}
                      {isLow && (
                        <span className="text-[10px] bg-amber-950 border border-amber-600/70 text-amber-300 font-black px-1.5 py-0.2 rounded">
                          کەمە
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-1">
                      <span className="font-mono text-emerald-400">{product.barcode}</span>
                      <span>•</span>
                      <span className="font-bold text-white">
                        {formatPrice(product.sellPrice, currency)}
                      </span>
                      <span>•</span>
                      <span className="text-stone-400">فرۆشراو: {product.soldCount}</span>
                    </div>
                  </div>

                  {/* Stock count and quick load to entry form */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-black px-2 py-1 rounded-lg ${
                        isOut
                          ? 'bg-rose-950 border border-rose-700 text-rose-300'
                          : isLow
                          ? 'bg-amber-950 border border-amber-700 text-amber-300'
                          : 'bg-emerald-950 border border-emerald-700 text-emerald-300'
                      }`}
                    >
                      ماوە: {product.stock}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleSelectToRestock(product)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-900/70 hover:bg-emerald-800 text-emerald-300 hover:text-white border border-emerald-700/60 transition-colors shadow-xs"
                      title="هەڵبژاردن بۆ داخلکردن لە فۆڕمەکە"
                    >
                      داخلکردن
                    </button>
                  </div>
                </div>
              );
            })}

            {displayList.length === 0 && (
              <div className="p-8 text-center text-stone-400 text-xs">
                هیچ کاڵایەک لەم بەشەدا نییە
              </div>
            )}
          </div>

        </div>

      </div>

      {/* BOTTOM SECTION: Today's Inward Goods Receiving History */}
      <div className="bg-stone-900/95 rounded-2xl border border-emerald-900/30 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-sm text-white">
              مێژووی داخلکراوەکان و بارنامەکان
            </h3>
          </div>
          <span className="text-xs text-stone-400">
            سەرجەم {inwardHistory.length} بارنامەی تۆمارکراو
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-stone-950 text-stone-400 font-bold border-b border-stone-800">
              <tr>
                <th className="py-2.5 px-3">ناوی کاڵا</th>
                <th className="py-2.5 px-3">بارکۆد</th>
                <th className="py-2.5 px-3 text-center">بڕی داخلکراو</th>
                <th className="py-2.5 px-3">نرخی کڕین</th>
                <th className="py-2.5 px-3">کۆی تێچوو</th>
                <th className="py-2.5 px-3">کۆمپانیا / دابەشکەر</th>
                <th className="py-2.5 px-3">بەروار و کات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {inwardHistory.map((record) => (
                <tr key={record.id} className="hover:bg-emerald-950/20">
                  <td className="py-2.5 px-3 font-bold text-white">
                    <div className="flex items-center gap-1.5">
                      <span>{record.productName}</span>
                      {record.isNewProduct && (
                        <span className="text-[10px] bg-emerald-950 border border-emerald-700 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                          نوێ
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-emerald-400 text-[11px]">
                    {record.barcode}
                  </td>
                  <td className="py-2.5 px-3 text-center font-black text-emerald-400">
                    +{record.quantityAdded} دانە
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-stone-400">
                    {formatPrice(record.buyPrice, currency)}
                  </td>
                  <td className="py-2.5 px-3 font-black text-white">
                    {formatPrice(record.totalCost, currency)}
                  </td>
                  <td className="py-2.5 px-3 text-stone-300">
                    {record.supplierName || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-stone-500 text-[11px]">
                    {formatDate(record.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {inwardHistory.length === 0 && (
            <div className="py-6 text-center text-stone-400 text-xs">
              هێشتا هیچ بارێکی نوێ لەم خولەدا داخل نەکراوە
            </div>
          )}
        </div>
      </div>

      {/* Camera scanner modal */}
      {showCamera && (
        <CameraScannerModal
          onScanSuccess={(scannedText) => {
            setBarcode(scannedText);
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Guide Modal: How to host, sell or run locally */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-stone-100">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <FileArchive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">ڕێنمایی داگرتن، هۆستکردن و فرۆشتنی پڕۆژەی pedros</h3>
                  <p className="text-xs text-stone-400">فایلی ZIP ئامادەکراوە و دەتوانیت ڕاستەوخۆ داونلۆدی بکەیت</p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Download Banner */}
            <div className="bg-gradient-to-br from-emerald-950/80 to-stone-900 border border-emerald-500/40 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="font-bold text-emerald-300 block text-sm">فایلی تەواوی پڕۆژەکە (Source Code ZIP)</span>
                <span className="text-xs text-stone-400">هەموو کۆدەکان، وێنەکان، و ڕێنمایی کارپێکردن بە قەبارەی ٤٩ کەیبی</span>
              </div>
              <a
                href="/pedros_pos_project.zip"
                download="pedros_pos_project.zip"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-sm flex items-center gap-2 shadow-lg transition-all shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>داگرتنی ZIP ئێستا</span>
              </a>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-stone-300">
              {/* Option 1: Local */}
              <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2 text-sm">
                  <Laptop className="w-4 h-4" />
                  <span>١. کارپێکردن لەسەر کۆمپیوتەری کڕیار یان مارکێت (Localhost)</span>
                </div>
                <p className="mb-2 text-stone-400">
                  فایلە زیپەکە بکەرەوە و لە ناو فۆڵدەرەکە لە تێرمیناڵ ئەم دوو فەرمانە لێبدە (پێویستی بە Node.js هەیە):
                </p>
                <div className="bg-stone-900 border border-stone-800 p-2.5 rounded-lg font-mono text-[11px] text-emerald-300 space-y-1" dir="ltr">
                  <div>npm install</div>
                  <div>npm run dev</div>
                </div>
                <p className="mt-2 text-stone-400">
                  پاشان لە کرۆم دەکرێتەوە لە <span className="text-emerald-400 font-mono">http://localhost:3000</span>
                </p>
              </div>

              {/* Option 2: Host on Vercel / Netlify */}
              <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2 text-sm">
                  <Globe className="w-4 h-4" />
                  <span>٢. هۆستکردن لەسەر ئینتەرنێت بۆ ئەوەی لە هەموو شوێنێک بەردەست بێت</span>
                </div>
                <ul className="list-disc list-inside space-y-1.5 text-stone-400">
                  <li>
                    <strong className="text-stone-200">لە Vercel:</strong> فۆڵدەرەکە ببە سەر هەژماری Vercel.com یان GitHub، ڕاستەوخۆ لینکێکی بێبەرامبەرت پێدەدات (وەک pedros.vercel.app).
                  </li>
                  <li>
                    <strong className="text-stone-200">لە Netlify:</strong> لە کۆمپیوتەرەکەت فەرمانی <span className="text-emerald-400 font-mono">npm run build</span> لێبدە، پاشان فۆڵدەری <span className="font-mono text-emerald-400">dist</span> ڕابکێشە بۆ ناو Netlify.com.
                  </li>
                </ul>
              </div>

              {/* Option 3: Turn into app */}
              <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>٣. چۆن بیکەیتە ئەپی وێندۆز یان مۆبایل؟</span>
                </div>
                <p className="text-stone-400">
                  لە براوسەری Chrome یا Edge دەتوانیت لە بەشی سەرەوە سێ خاڵەکە دابگریت و کلیک لەسەر <span className="text-stone-200 font-bold">Install pedros as app</span> بکەیت تا دەستبەجێ وەک بەرنامەیەکی فەرمی بچێتە ناو لیستی پرۆگرامەکانی کۆمپیوتەر بە بێ هیچ پێداویستییەک.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-800 flex justify-end">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs transition-colors"
              >
                داخستن
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

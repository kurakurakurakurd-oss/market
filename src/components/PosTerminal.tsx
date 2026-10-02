import React, { useState, useRef, useEffect } from 'react';
import { 
  Barcode, 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Camera, 
  Check, 
  AlertTriangle, 
  CreditCard, 
  Banknote, 
  RotateCcw, 
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Sun,
  Moon,
  Clock,
  Sparkles
} from 'lucide-react';
import { Product, CartItem, Currency, SaleRecord, CashierShift } from '../types';
import { formatPrice, formatNumber, normalizeSearchText } from '../utils/formatters';
import { playBarcodeBeep, playErrorBeep, playSuccessChime } from '../utils/audio';
import { CameraScannerModal } from './CameraScannerModal';
import { ShiftDetailsModal } from './ShiftDetailsModal';

interface PosTerminalProps {
  products: Product[];
  sales: SaleRecord[];
  currency: Currency;
  currentShift: CashierShift;
  onShiftChange: (shift: CashierShift) => void;
  onCompleteSale: (sale: SaleRecord, updatedProducts: Product[]) => void;
  onViewReceipt?: (sale: SaleRecord) => void;
}

export const PosTerminal: React.FC<PosTerminalProps> = ({
  products,
  sales,
  currency,
  currentShift,
  onShiftChange,
  onCompleteSale,
  onViewReceipt,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('هەموو');
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  // Compute live shift stats for today
  const todayStr = new Date().toDateString();
  const todaySales = sales.filter((s) => new Date(s.timestamp).toDateString() === todayStr);
  const getSaleShift = (s: SaleRecord): CashierShift => {
    if (s.shift) return s.shift;
    const h = new Date(s.timestamp).getHours();
    return h >= 8 && h < 16 ? 'day' : 'night';
  };

  const todayDaySales = todaySales.filter((s) => getSaleShift(s) === 'day');
  const todayNightSales = todaySales.filter((s) => getSaleShift(s) === 'night');

  const todayDayRevenue = todayDaySales.reduce((acc, s) => acc + s.totalAmount, 0);
  const todayNightRevenue = todayNightSales.reduce((acc, s) => acc + s.totalAmount, 0);

  // Keep barcode input ready for hardware scanner
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Flash scan message
  const triggerMessage = (text: string, type: 'success' | 'error') => {
    setScanMessage({ text, type });
    setTimeout(() => {
      setScanMessage(null);
    }, 2800);
  };

  // Add product to cart by barcode or direct selection
  const handleAddToCart = (product: Product, qty: number = 1) => {
    if (product.stock <= 0) {
      playErrorBeep();
      triggerMessage(`کاڵای "${product.name}" لە عەمبار نەماوە!`, 'error');
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity + qty > product.stock) {
          playErrorBeep();
          triggerMessage(
            `تەنها ${product.stock} دانە لە عەمبار ماوە لە "${product.name}"!`,
            'error'
          );
          return prevCart;
        }
        playBarcodeBeep();
        triggerMessage(`+١ دانە لە "${product.name}" زیادکرا`, 'success');
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      } else {
        playBarcodeBeep();
        triggerMessage(`"${product.name}" خرایە سەبەتە`, 'success');
        return [...prevCart, { product, quantity: qty, discount: 0 }];
      }
    });
  };

  // Handle hardware barcode scanner gun submit or typed barcode
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanBarcode = barcodeInput.trim();
    if (!cleanBarcode) return;

    const normalizedScan = cleanBarcode.replace(/[^a-zA-Z0-9]/g, '');

    const found = products.find(
      (p) => p.barcode === cleanBarcode || (normalizedScan && p.barcode.replace(/[^a-zA-Z0-9]/g, '') === normalizedScan)
    );

    if (found) {
      handleAddToCart(found, 1);
      setBarcodeInput('');
    } else {
      playErrorBeep();
      triggerMessage(`کاڵایەک بە بارکۆدی (${cleanBarcode}) نەدۆزرایەوە!`, 'error');
      setBarcodeInput('');
    }
  };

  // Handle camera barcode scan
  const handleCameraScan = (scannedText: string) => {
    setShowCameraScanner(false);
    const cleanBarcode = scannedText.trim();
    const normalizedScan = cleanBarcode.replace(/[^a-zA-Z0-9]/g, '');

    const found = products.find(
      (p) => p.barcode === cleanBarcode || (normalizedScan && p.barcode.replace(/[^a-zA-Z0-9]/g, '') === normalizedScan)
    );

    if (found) {
      handleAddToCart(found, 1);
    } else {
      playErrorBeep();
      triggerMessage(`کاڵایەک بە بارکۆدی (${cleanBarcode}) نەدۆزرایەوە!`, 'error');
    }
  };

  // Update quantity in cart
  const updateCartQuantity = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > product.stock) {
              playErrorBeep();
              triggerMessage(`تەنها ${product.stock} دانە لە عەمبار ماوە!`, 'error');
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Remove single item from cart
  const removeCartItem = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setPaidAmount('');
  };

  // Financial calculations
  const subtotal = cart.reduce((acc, item) => acc + item.product.sellPrice * item.quantity, 0);
  const totalAmount = Math.max(0, subtotal - discount);
  const costTotal = cart.reduce((acc, item) => acc + item.product.buyPrice * item.quantity, 0);
  const totalProfit = totalAmount - costTotal;

  const numericPaid = paidAmount ? parseFloat(paidAmount) : totalAmount;
  const changeAmount = Math.max(0, numericPaid - totalAmount);

  // Complete sale checkout
  const handleCheckout = () => {
    if (cart.length === 0) return;

    if (numericPaid < totalAmount) {
      playErrorBeep();
      triggerMessage('پارەی دراو لە کۆی گشتی کەمترە!', 'error');
      return;
    }

    // Build sale record
    const saleRecord: SaleRecord = {
      id: `sale-${Date.now()}`,
      receiptNumber: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        barcode: item.product.barcode,
        quantity: item.quantity,
        unitPrice: item.product.sellPrice,
        costPrice: item.product.buyPrice,
        totalPrice: item.product.sellPrice * item.quantity,
        totalProfit: (item.product.sellPrice - item.product.buyPrice) * item.quantity,
      })),
      subtotal,
      discount,
      totalAmount,
      totalProfit,
      paidAmount: numericPaid,
      changeAmount,
      paymentMethod: 'cash',
      timestamp: new Date().toISOString(),
      shift: currentShift,
    };

    // Update product stock and soldCount
    const updatedProducts = products.map((prod) => {
      const cartItem = cart.find((c) => c.product.id === prod.id);
      if (cartItem) {
        return {
          ...prod,
          stock: Math.max(0, prod.stock - cartItem.quantity),
          soldCount: prod.soldCount + cartItem.quantity,
        };
      }
      return prod;
    });

    playSuccessChime();
    onCompleteSale(saleRecord, updatedProducts);
    clearCart();
  };

  // Categories list
  const categories = ['هەموو', ...Array.from(new Set(products.map((p) => p.category)))];

  // Normalized search query for robust Kurdish/Arabic/digit/barcode matching
  const normQuery = normalizeSearchText(searchQuery);
  const cleanSearchBarcode = searchQuery.replace(/[^a-zA-Z0-9]/g, '');

  // Filter products for catalog
  const filteredProducts = products.filter((prod) => {
    const matchesCategory = selectedCategory === 'هەموو' || prod.category === selectedCategory;
    if (!matchesCategory) return false;

    if (normQuery) {
      const normName = normalizeSearchText(prod.name);
      const normBarcode = normalizeSearchText(prod.barcode);
      const cleanProdBarcode = prod.barcode.replace(/[^a-zA-Z0-9]/g, '');
      const normCat = normalizeSearchText(prod.category);

      return (
        normName.includes(normQuery) ||
        normBarcode.includes(normQuery) ||
        (cleanSearchBarcode && cleanProdBarcode.includes(cleanSearchBarcode)) ||
        normCat.includes(normQuery)
      );
    }

    return true;
  });

  return (
    <div className="flex-1 flex flex-col gap-3.5 h-full overflow-hidden p-3 lg:p-5 bg-stone-950 text-stone-100">
      
      {/* CASHIER SHIFT HEADER: شەفتی ڕۆژ ☀️ و شەفتی شەو 🌙 */}
      <div className="bg-stone-900/95 border border-stone-800 rounded-2xl p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2.5 shadow-lg shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Day Shift Button */}
          <button
            onClick={() => onShiftChange('day')}
            className={`flex items-center gap-2.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
              currentShift === 'day'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/50'
                : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200 hover:border-stone-700'
            }`}
            title="چالاککردنی شەفتی ڕۆژ بۆ کاشێر"
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
              currentShift === 'day' ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'
            }`}>
              <Sun className="w-4 h-4" />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5 leading-none">
                <span>شەفتی ڕۆژ ☀️</span>
                {currentShift === 'day' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="شەفتی چالاک"></span>
                )}
              </div>
              <span className="text-[11px] font-mono font-black text-amber-400 block mt-1">
                {formatPrice(todayDayRevenue, currency)}
              </span>
            </div>
          </button>

          {/* Night Shift Button */}
          <button
            onClick={() => onShiftChange('night')}
            className={`flex items-center gap-2.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
              currentShift === 'night'
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/50'
                : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200 hover:border-stone-700'
            }`}
            title="چالاککردنی شەفتی شەو بۆ کاشێر"
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
              currentShift === 'night' ? 'bg-indigo-500 text-stone-950' : 'bg-stone-800 text-stone-400'
            }`}>
              <Moon className="w-4 h-4" />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5 leading-none">
                <span>شەفتی شەو 🌙</span>
                {currentShift === 'night' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="شەفتی چالاک"></span>
                )}
              </div>
              <span className="text-[11px] font-mono font-black text-indigo-400 block mt-1">
                {formatPrice(todayNightRevenue, currency)}
              </span>
            </div>
          </button>
        </div>

        {/* Shift Details and Items Report Trigger Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShiftModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 text-emerald-400 hover:text-emerald-300 border border-emerald-600/50 text-xs font-bold shadow-inner transition-all active:scale-95"
          >
            <Clock className="w-4 h-4" />
            <span>وردەکاری و کاڵاکانی شەفت (ڕۆژ و شەو)</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
      
      {/* LEFT AREA: Barcode Scanner & Product Catalog */}
      <div className="flex-1 flex flex-col min-w-0 bg-stone-900/95 rounded-2xl border border-emerald-900/30 shadow-2xl overflow-hidden">
        
        {/* Top Barcode Input & Scanner Bar */}
        <div className="p-4 bg-stone-950 border-b border-stone-800">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            
            {/* Direct Barcode Entry (Optimized for Hardware Scanner Guns) */}
            <form onSubmit={handleBarcodeSubmit} className="flex-1 relative flex items-center">
              <div className="absolute right-3 text-emerald-400 pointer-events-none flex items-center gap-1.5">
                <Barcode className="w-5 h-5" />
              </div>
              <input
                ref={barcodeInputRef}
                data-barcode-input="true"
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="بارکۆد لە جیهاز بدە یان لێرە بنووسە و ئینتەر داگرە..."
                className="w-full pr-11 pl-20 py-3 rounded-xl border border-emerald-900/60 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-stone-950 text-white font-mono text-sm placeholder:text-stone-500 placeholder:font-sans transition-all outline-none shadow-inner"
              />
              <button
                type="submit"
                className="absolute left-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
              >
                <span>لێدان</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            </form>

            {/* Camera Barcode Scanner Trigger */}
            <button
              type="button"
              onClick={() => setShowCameraScanner(true)}
              className="px-3.5 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold flex items-center justify-center gap-2 border border-stone-700 transition-colors shrink-0"
              title="خوێندنەوە بە کامێرا لە مۆبایل یان کۆمپیوتەر"
            >
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>کامێرای بارکۆد</span>
            </button>
          </div>

          {/* Feedback notification when scanned */}
          {scanMessage && (
            <div
              className={`mt-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                scanMessage.type === 'success'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                  : 'bg-rose-950/80 text-rose-300 border border-rose-800'
              }`}
            >
              {scanMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{scanMessage.text}</span>
            </div>
          )}
        </div>

        {/* Filter & Search Header */}
        <div className="p-3.5 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 bg-stone-900">
          {/* Quick Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="گەڕان بەپێی ناوی کاڵا یان بارکۆد..."
              className="w-full pr-9 pl-3 py-1.5 rounded-lg border border-stone-700 text-xs text-white bg-stone-950 placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 shadow-inner"
            />
          </div>

          {/* Categories Pill Scroller */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const isLowStock = product.stock > 0 && product.stock <= product.minStockAlert;
              const isOutOfStock = product.stock <= 0;

              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && handleAddToCart(product, 1)}
                  className={`p-3 rounded-xl border flex flex-col justify-between transition-all select-none ${
                    isOutOfStock
                      ? 'bg-rose-950/20 border-rose-900/60 opacity-60 cursor-not-allowed'
                      : isLowStock
                      ? 'bg-amber-950/20 border-amber-900/60 hover:border-amber-500 cursor-pointer active:scale-98'
                      : 'bg-stone-950 border-stone-800 hover:border-emerald-500 hover:bg-stone-900/90 cursor-pointer active:scale-98 shadow-xs'
                  }`}
                >
                  <div>
                    {/* Category & Out-of-Stock Alert */}
                    <div className="flex items-center justify-between gap-1 mb-1.5 text-[10px]">
                      <span className="text-stone-400 truncate bg-stone-900 px-1.5 py-0.5 rounded border border-stone-800">
                        {product.category}
                      </span>
                      {isOutOfStock && (
                        <span className="text-rose-300 font-bold bg-rose-950 border border-rose-700 px-1.5 py-0.5 rounded">
                          نەماوە
                        </span>
                      )}
                    </div>

                    {/* Product Name */}
                    <h4 className="font-extrabold text-white text-xs line-clamp-2 leading-snug mb-1">
                      {product.name}
                    </h4>

                    {/* Barcode */}
                    <div className="font-mono text-[10px] text-stone-400 mb-2 truncate">
                      {product.barcode}
                    </div>
                  </div>

                  {/* Price Display: تەنیا نرخ و پارەکە بە ڕوونی دیاربێت */}
                  <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between mt-auto">
                    <span className="font-black text-sm text-emerald-400 font-mono tracking-tight">
                      {formatPrice(product.sellPrice, currency)}
                    </span>
                    <span className="text-[10px] font-bold text-stone-300 bg-stone-900/90 px-2 py-0.5 rounded border border-stone-800">
                      نرخ
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="h-48 flex flex-col items-center justify-center text-stone-400 text-center">
              <Search className="w-8 h-8 mb-2 opacity-40 text-emerald-400" />
              <p className="text-sm font-medium">هیچ کاڵایەک نەدۆزرایەوە</p>
              <p className="text-xs text-stone-500">وشەیەکی تر بگەڕێ یان جۆرەکەی بگۆڕە</p>
            </div>
          )}
        </div>

      </div>

      {/* RIGHT AREA: Cart & Cash Register Drawer */}
      <div className="w-full lg:w-[420px] flex flex-col bg-stone-900/95 rounded-2xl border border-emerald-900/30 shadow-2xl overflow-hidden shrink-0">
        
        {/* Cart Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-950 via-stone-900 to-emerald-950 border-b border-emerald-900/40 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-900/80 border border-emerald-600/50 flex items-center justify-center text-emerald-300">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">سەبەتەی کاشێر</h3>
              <p className="text-[11px] text-emerald-300/80">
                {cart.length} کاڵا دیاریکراوە ({cart.reduce((s, i) => s + i.quantity, 0)} دانە)
              </p>
            </div>
          </div>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-emerald-300 hover:text-white px-2 py-1 rounded-lg hover:bg-emerald-900/50 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>بەتاڵکردن</span>
            </button>
          )}
        </div>

        {/* Cart Item List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2 min-h-[180px] max-h-[340px] lg:max-h-none">
          {cart.length === 0 ? (
            <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-stone-400 text-center p-4">
              <ShoppingCart className="w-10 h-10 mb-2 opacity-30 text-emerald-400" />
              <p className="text-sm font-semibold text-stone-300">سەبەتە بەتاڵە</p>
              <p className="text-xs text-stone-500 max-w-[220px] mt-1">
                بارکۆد بە جیهاز لێبدە، یان لە لیستی کاڵاکان کلیک بکە بۆ زیادکردن
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="bg-stone-950 border border-stone-800 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white truncate">{item.product.name}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
                    <span className="font-mono text-emerald-400">{formatPrice(item.product.sellPrice, currency)}</span>
                    <span>•</span>
                    <span className="text-stone-400">ماوە: {item.product.stock}</span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-700 rounded-lg p-1">
                  <button
                    onClick={() => updateCartQuantity(item.product.id, -1)}
                    className="w-6 h-6 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center active:scale-95"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-bold text-white text-xs">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartQuantity(item.product.id, 1)}
                    className="w-6 h-6 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center active:scale-95"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Line Total */}
                <div className="text-left w-20 shrink-0">
                  <div className="font-black text-white text-xs">
                    {formatPrice(item.product.sellPrice * item.quantity, currency)}
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeCartItem(item.product.id)}
                  className="text-stone-500 hover:text-rose-400 p-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Calculation Summary & Checkout Drawer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 space-y-3">
          
          {/* Discount & Subtotal */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-400">
              <span>کۆی سەرەتایی:</span>
              <span className="font-semibold text-stone-200">{formatPrice(subtotal, currency)}</span>
            </div>

            <div className="flex items-center justify-between text-stone-400">
              <span>داشکاندن (دینار):</span>
              <input
                type="number"
                min="0"
                step="250"
                value={discount || ''}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                placeholder="0"
                className="w-24 px-2 py-1 text-left rounded-md border border-stone-700 bg-stone-900 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-between text-base font-black text-white pt-2 border-t border-stone-800">
              <span>کۆی گشتی بۆ دان:</span>
              <span className="text-emerald-400 text-lg">
                {formatPrice(totalAmount, currency)}
              </span>
            </div>
          </div>

          {/* Customer Paid and Change (پارەی دراو و بەقیە) */}
          {cart.length > 0 && (
            <div className="pt-2 border-t border-stone-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-stone-300">پارەی دراو (نەختینە):</span>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder={totalAmount.toString()}
                  className="w-28 px-2.5 py-1 text-left rounded-md border border-stone-700 bg-stone-900 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Quick Cash Quick-Pills for Iraqi Dinar */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {[5000, 10000, 25000, 50000].map((cashVal) => (
                  <button
                    key={cashVal}
                    type="button"
                    onClick={() => setPaidAmount(cashVal.toString())}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono font-semibold whitespace-nowrap border border-stone-700 transition-colors"
                  >
                    {cashVal.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Change (بەقیە) */}
              <div className="flex justify-between text-xs font-bold text-stone-200 bg-emerald-950/60 p-2 rounded-lg border border-emerald-800/60">
                <span>پارەی گەڕاوە (بەقیە):</span>
                <span className="text-emerald-400 font-mono text-sm">
                  {formatPrice(changeAmount, currency)}
                </span>
              </div>
            </div>
          )}

          {/* Active Shift Indicator before Checkout */}
          <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-stone-900 border border-stone-800">
            <span className="text-stone-400">تۆمارکردن لەسەر:</span>
            <div className="flex items-center gap-1.5 font-bold">
              {currentShift === 'day' ? (
                <span className="text-amber-400 flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5" />
                  <span>شەفتی ڕۆژ ☀️</span>
                </span>
              ) : (
                <span className="text-indigo-400 flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5" />
                  <span>شەفتی شەو 🌙</span>
                </span>
              )}
              <button
                type="button"
                onClick={() => onShiftChange(currentShift === 'day' ? 'night' : 'day')}
                className="text-[10px] text-stone-400 hover:text-emerald-300 underline mr-1"
              >
                (گۆڕین)
              </button>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all ${
              cart.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 active:scale-99 text-white shadow-[0_0_18px_rgba(16,185,129,0.35)]'
                : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
            }`}
          >
            <Banknote className="w-5 h-5" />
            <span>تەواوکردنی فرۆشتن و وەسڵ</span>
          </button>
        </div>

      </div>
      </div>

      {/* Shift Details Modal: وردەکاری و کاڵاکانی شەفتی ڕۆژ و شەفتی شەو */}
      {showShiftModal && (
        <ShiftDetailsModal
          isOpen={showShiftModal}
          onClose={() => setShowShiftModal(false)}
          sales={sales}
          currency={currency}
          activeShift={currentShift}
          onSelectShift={(shift) => onShiftChange(shift)}
          onViewReceipt={onViewReceipt}
        />
      )}

      {/* Camera scanner modal */}
      {showCameraScanner && (
        <CameraScannerModal
          onScanSuccess={handleCameraScan}
          onClose={() => setShowCameraScanner(false)}
        />
      )}
    </div>
  );
};

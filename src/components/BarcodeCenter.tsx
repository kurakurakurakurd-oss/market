import React, { useState, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { 
  Barcode, 
  Printer, 
  Search, 
  Tag, 
  Check, 
  Download, 
  Plus, 
  Sparkles, 
  Camera, 
  ScanLine 
} from 'lucide-react';
import { Product, Currency } from '../types';
import { formatPrice, generateRandomBarcode, normalizeSearchText } from '../utils/formatters';
import { playBarcodeBeep } from '../utils/audio';
import { CameraScannerModal } from './CameraScannerModal';

interface BarcodeCenterProps {
  products: Product[];
  currency: Currency;
  onUpdateProductBarcode: (productId: string, newBarcode: string) => void;
}

export const BarcodeCenter: React.FC<BarcodeCenterProps> = ({
  products,
  currency,
  onUpdateProductBarcode,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [testScanInput, setTestScanInput] = useState('');
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [copies, setCopies] = useState(12);

  const previewSvgRef = useRef<SVGSVGElement | null>(null);
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  useEffect(() => {
    if (previewSvgRef.current && selectedProduct?.barcode) {
      try {
        JsBarcode(previewSvgRef.current, selectedProduct.barcode, {
          format: 'CODE128',
          lineColor: '#09090b',
          width: 2.2,
          height: 60,
          displayValue: true,
          fontSize: 14,
          font: 'monospace',
          textMargin: 6,
        });
      } catch (err) {
        console.error('Barcode render error:', err);
      }
    }
  }, [selectedProduct?.barcode]);

  const handleTestScan = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = testScanInput.trim();
    if (!clean) return;

    const normInput = clean.replace(/[^a-zA-Z0-9]/g, '');
    const matched = products.find(
      (p) => p.barcode === clean || (normInput && p.barcode.replace(/[^a-zA-Z0-9]/g, '') === normInput)
    );

    if (matched) {
      playBarcodeBeep();
      setScanResult(`سەرکەوتوو بوو! جیهاز کاڵای "${matched.name}" ناساند (نرخ: ${formatPrice(matched.sellPrice, currency)} - ماوە: ${matched.stock})`);
      setSelectedProductId(matched.id);
    } else {
      setScanResult(`ئاگاداری: بارکۆدی ${clean} لە لیستی مارکێت نییە.`);
    }
    setTestScanInput('');
  };

  const handlePrint = () => {
    window.print();
  };

  const normQuery = normalizeSearchText(searchQuery);
  const cleanSearchBarcode = searchQuery.replace(/[^a-zA-Z0-9]/g, '');

  const filteredProducts = products.filter((p) => {
    if (!normQuery) return true;
    const normName = normalizeSearchText(p.name);
    const normBarcode = normalizeSearchText(p.barcode);
    const cleanProdBarcode = p.barcode.replace(/[^a-zA-Z0-9]/g, '');

    return (
      normName.includes(normQuery) ||
      normBarcode.includes(normQuery) ||
      (cleanSearchBarcode && cleanProdBarcode.includes(cleanSearchBarcode))
    );
  });

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-y-auto space-y-6 bg-stone-950 text-stone-100">
      
      {/* Top Test Scanner Tool */}
      <div className="bg-stone-900/95 p-5 rounded-2xl border border-emerald-900/30 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center">
              <ScanLine className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">تاقیکردنەوەی جیهازی بارکۆد (Scanner Test)</h3>
              <p className="text-xs text-stone-400">جیهازی بارکۆدە دەستییەکە لێبدە تا دڵنیابیت دەیناسێتەوە</p>
            </div>
          </div>

          <button
            onClick={() => setShowCamera(!showCamera)}
            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 border border-stone-700 transition-colors"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>تاقیکردنەوە بە کامێرا</span>
          </button>
        </div>

        <form onSubmit={handleTestScan} className="flex gap-2">
          <input
            type="text"
            value={testScanInput}
            onChange={(e) => setTestScanInput(e.target.value)}
            placeholder="لێرە لە جیهاز بدە، یان ژمارەی بارکۆد بنووسە..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-stone-700 bg-stone-950 font-mono text-emerald-400 text-sm focus:outline-none focus:border-emerald-500 shadow-inner"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-colors"
          >
            پشکنین
          </button>
        </form>

        {scanResult && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold">
            {scanResult}
          </div>
        )}
      </div>

      {/* Main Grid: Select Product on Left, Barcode Sheet on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Product selector column */}
        <div className="bg-stone-900/95 rounded-2xl border border-emerald-900/30 shadow-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-stone-800 bg-stone-950">
            <h4 className="font-bold text-xs text-stone-300 mb-2">کاڵایەک دیاری بکە بۆ دروستکردن و چاپی لەزگە:</h4>
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="گەڕان بەپێی ناو یان بارکۆد..."
                className="w-full pr-8 pl-3 py-1.5 text-xs rounded-lg border border-stone-700 bg-stone-950 text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 shadow-inner"
              />
            </div>
          </div>

          <div className="p-2 overflow-y-auto max-h-[480px] divide-y divide-stone-800">
            {filteredProducts.map((prod) => (
              <button
                key={prod.id}
                onClick={() => setSelectedProductId(prod.id)}
                className={`w-full text-right p-2.5 rounded-xl transition-all flex items-center justify-between gap-2 ${
                  selectedProduct?.id === prod.id
                    ? 'bg-emerald-950 border border-emerald-600/70 text-emerald-300 font-bold'
                    : 'hover:bg-stone-800/60 text-stone-300'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-xs truncate text-white">{prod.name}</p>
                  <p className="text-[10px] text-emerald-400 font-mono mt-0.5">{prod.barcode}</p>
                </div>
                <div className="text-left shrink-0">
                  <span className="text-xs text-emerald-400 font-bold block">
                    {formatPrice(prod.sellPrice, currency)}
                  </span>
                  <span className="text-[10px] text-stone-400">ماوە: {prod.stock}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Barcode Sticker Generator & Print Area (2 cols) */}
        <div className="lg:col-span-2 bg-stone-900/95 rounded-2xl border border-emerald-900/30 shadow-2xl p-6 flex flex-col space-y-5">
          
          {selectedProduct ? (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
                <div>
                  <h3 className="font-black text-white text-lg">{selectedProduct.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-stone-400 mt-1">
                    <span>جۆر: {selectedProduct.category}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">
                      نرخ: {formatPrice(selectedProduct.sellPrice, currency)}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-white">
                      ماوە لە عەمبار: {selectedProduct.stock} دانە
                    </span>
                  </div>
                </div>

                {/* Print button */}
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>چاپکردنی لەزگەکان</span>
                </button>
              </div>

              {/* Single Large Barcode preview */}
              <div className="border border-stone-800 rounded-2xl p-5 bg-stone-950 flex flex-col items-center justify-center">
                <div className="bg-white p-4 rounded-xl shadow-xs max-w-sm w-full flex justify-center">
                  <svg ref={previewSvgRef} className="w-full h-auto"></svg>
                </div>

                {/* Copies configuration */}
                <div className="mt-4 flex items-center gap-2 text-xs">
                  <span className="text-stone-300 font-medium">ژمارەی لەزگە بۆ پەڕەی چاپ:</span>
                  {[6, 12, 24, 36].map((num) => (
                    <button
                      key={num}
                      onClick={() => setCopies(num)}
                      className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                        copies === num
                          ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                          : 'bg-stone-800 border border-stone-700 text-stone-300 hover:bg-stone-700'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sheet Grid Preview */}
              <div>
                <h4 className="text-xs font-bold text-stone-300 mb-2">
                  پێشبینینی پەڕەی لەزگەکان ({copies} دانە):
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-stone-950 rounded-xl border border-dashed border-stone-800 max-h-72 overflow-y-auto">
                  {Array.from({ length: copies }).map((_, idx) => (
                    <div
                      key={idx}
                      className="bg-white text-stone-950 p-2.5 rounded-lg shadow-xs text-center flex flex-col items-center justify-between"
                    >
                      <p className="text-[11px] font-bold text-stone-900 truncate w-full">
                        {selectedProduct.name}
                      </p>
                      <p className="text-xs font-black text-emerald-700 my-1">
                        {formatPrice(selectedProduct.sellPrice, currency)}
                      </p>
                      <div className="w-full bg-stone-100 rounded py-1 font-mono text-[9px] font-bold text-stone-800 tracking-wider">
                        ||| {selectedProduct.barcode} |||
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-stone-500">هیچ کاڵایەک هەڵنەبژێردراوە</div>
          )}

        </div>

      </div>

      {showCamera && (
        <CameraScannerModal
          onScanSuccess={(code) => {
            setTestScanInput(code);
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}

    </div>
  );
};

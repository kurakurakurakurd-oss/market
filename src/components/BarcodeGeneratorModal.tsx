import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Printer, X, Download, Tag, Check } from 'lucide-react';
import { Product, Currency } from '../types';
import { formatPrice } from '../utils/formatters';

interface BarcodeGeneratorModalProps {
  product: Product;
  currency: Currency;
  onClose: () => void;
}

export const BarcodeGeneratorModal: React.FC<BarcodeGeneratorModalProps> = ({
  product,
  currency,
  onClose,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [printCopies, setPrintCopies] = React.useState<number>(12);
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (svgRef.current && product.barcode) {
      try {
        JsBarcode(svgRef.current, product.barcode, {
          format: 'CODE128',
          lineColor: '#1c1917',
          width: 2,
          height: 55,
          displayValue: true,
          fontSize: 14,
          font: 'monospace',
          textMargin: 4,
          background: 'transparent',
        });
      } catch (err) {
        console.error('Failed to generate barcode', err);
      }
    }
  }, [product.barcode]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(product.barcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 print:p-0 print:bg-white print:static">
      <div className="bg-stone-900 rounded-2xl shadow-2xl max-w-xl w-full border border-emerald-800/40 overflow-hidden print:border-0 print:shadow-none print:w-full print:max-w-none text-stone-100">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 print:hidden bg-stone-950">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700/60 text-emerald-400 flex items-center justify-center font-bold">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">چاپکردن و دروستکردنی لەزگەی بارکۆد</h2>
              <p className="text-xs text-stone-400">لەزگە بۆ لێدان لەسەر کاڵا یان ڕەفەی مارکێت</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 print:p-0">
          <div className="border border-stone-800 rounded-xl p-5 bg-stone-950 flex flex-col items-center justify-center text-center print:hidden">
            <span className="text-xs font-semibold text-stone-400 mb-1">{product.category}</span>
            <h3 className="font-bold text-white text-lg mb-1">{product.name}</h3>
            <div className="text-emerald-400 font-extrabold text-xl mb-3">
              {formatPrice(product.sellPrice, currency)}
            </div>

            <div className="bg-white p-3 rounded-lg border border-stone-700 shadow-xs flex justify-center w-full max-w-xs">
              <svg ref={svgRef} className="w-full h-auto"></svg>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyBarcode}
                className="text-xs inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-200 hover:bg-stone-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5 text-stone-400" />}
                {copied ? 'بارکۆد کۆپی کرا' : 'کۆپیکردنی ژمارەی بارکۆد'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between print:hidden">
            <label className="text-sm font-medium text-stone-300">
              ژمارەی کۆپی لەزگە بۆ چاپ:
            </label>
            <div className="flex items-center gap-2">
              {[6, 12, 24, 48].map((count) => (
                <button
                  key={count}
                  onClick={() => setPrintCopies(count)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                    printCopies === count
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  {count} دانە
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-stone-800 pt-4 print:border-0 print:pt-0">
            <h4 className="text-xs font-semibold text-stone-400 mb-3 print:hidden">
              شێوازی چاپکردنی لەزگەکان ({printCopies} دانە لەسەر پەڕە):
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 print:grid-cols-3 print:gap-4 max-h-60 overflow-y-auto print:max-h-none print:overflow-visible p-1">
              {Array.from({ length: printCopies }).map((_, idx) => (
                <div
                  key={idx}
                  className="border border-dashed border-stone-400 rounded-lg p-2.5 bg-white text-stone-900 text-center flex flex-col items-center justify-between"
                >
                  <p className="text-[11px] font-bold text-stone-800 truncate w-full">
                    {product.name}
                  </p>
                  <div className="text-[13px] font-black text-emerald-700 my-0.5">
                    {formatPrice(product.sellPrice, currency)}
                  </div>
                  <div className="font-mono text-[10px] tracking-widest text-stone-800 bg-stone-100 px-2 py-0.5 rounded w-full font-bold">
                    ||| {product.barcode} |||
                  </div>
                  <span className="text-[9px] text-stone-600 mt-0.5">مارکێت</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-stone-800 bg-stone-950 flex items-center justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-stone-400 hover:bg-stone-800 font-medium text-sm transition-colors"
          >
            داخستن
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm flex items-center gap-2 shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-colors"
          >
            <Printer className="w-4 h-4" />
            چاپکردنی لەزگەکان (Print)
          </button>
        </div>

      </div>
    </div>
  );
};

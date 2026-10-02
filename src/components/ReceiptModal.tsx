import React from 'react';
import { Printer, CheckCircle, X, Download } from 'lucide-react';
import { SaleRecord, Currency } from '../types';
import { formatPrice, formatDate } from '../utils/formatters';

interface ReceiptModalProps {
  sale: SaleRecord;
  currency: Currency;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  currency,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static">
      <div className="bg-stone-900 rounded-2xl shadow-2xl max-w-sm w-full border border-emerald-900/40 overflow-hidden print:border-0 print:shadow-none print:w-full print:max-w-none">
        
        {/* Header - Not printed */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-800 bg-stone-950 print:hidden">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>فرۆشتنەکە بە سەرکەوتوویی تەواو بوو</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Canvas (Formatted as real thermal POS slip - paper styled) */}
        <div className="m-4 bg-white rounded-xl p-5 font-mono text-xs text-stone-900 space-y-4 shadow-inner print:m-0 print:p-4 print:text-black">
          {/* Market header */}
          <div className="text-center space-y-1 border-b border-dashed border-stone-300 pb-3">
            <h2 className="font-bold text-xl text-stone-900 font-sans tracking-wider">pedros</h2>
            <p className="text-[10px] text-stone-500">تەلەفۆن: 0750 123 4567</p>
          </div>

          {/* Receipt meta */}
          <div className="space-y-1 text-[11px] text-stone-600 border-b border-dashed border-stone-300 pb-3">
            <div className="flex justify-between">
              <span>ژمارەی وەسڵ:</span>
              <span className="font-bold text-stone-900">{sale.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>بەروار و کات:</span>
              <span>{formatDate(sale.timestamp)}</span>
            </div>
            <div className="flex justify-between">
              <span>شێوازی پارەدان:</span>
              <span>نەختینە (کاش)</span>
            </div>
          </div>

          {/* Items breakdown */}
          <div className="space-y-2 border-b border-dashed border-stone-300 pb-3">
            <div className="flex justify-between font-bold text-[11px] text-stone-700 pb-1 border-b border-stone-200">
              <span>کاڵا (دانە × نرخ)</span>
              <span>کۆ</span>
            </div>

            {sale.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-baseline text-[11px]">
                <div className="truncate max-w-[200px]">
                  <p className="font-sans font-semibold text-stone-900">{item.productName}</p>
                  <p className="text-[10px] text-stone-500">
                    {item.quantity} × {formatPrice(item.unitPrice, currency)}
                  </p>
                </div>
                <div className="font-bold text-stone-900">
                  {formatPrice(item.totalPrice, currency)}
                </div>
              </div>
            ))}
          </div>

          {/* Summary calculations */}
          <div className="space-y-1.5 text-xs pt-1">
            <div className="flex justify-between text-stone-600">
              <span>کۆی پێش داشکاندن:</span>
              <span>{formatPrice(sale.subtotal, currency)}</span>
            </div>

            {sale.discount > 0 && (
              <div className="flex justify-between text-rose-600 font-medium">
                <span>داشکاندن:</span>
                <span>-{formatPrice(sale.discount, currency)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-black text-stone-900 pt-1.5 border-t border-stone-300">
              <span>کۆی گشتی:</span>
              <span className="text-emerald-700">{formatPrice(sale.totalAmount, currency)}</span>
            </div>
            <div className="flex justify-between text-stone-600 pt-1">
              <span>پارەی دراو:</span>
              <span>{formatPrice(sale.paidAmount, currency)}</span>
            </div>
            <div className="flex justify-between text-stone-700 font-bold">
              <span>پارەی گەڕاوە (بەقیە):</span>
              <span>{formatPrice(sale.changeAmount, currency)}</span>
            </div>
          </div>

          {/* Receipt Footer note */}
          <div className="text-center pt-3 border-t border-dashed border-stone-300 space-y-1">
            <p className="font-sans text-[11px] font-semibold text-stone-700">سوپاس بۆ سەردانەکەت!</p>
            <p className="text-[10px] text-stone-500">کاڵای فرۆشراو بە وەسڵ لە ماوەی ٢٤ کاتژمێردا دەگۆڕدرێتەوە</p>
            <div className="text-[9px] tracking-widest text-stone-400 pt-1">
              * * * {sale.receiptNumber} * * *
            </div>
          </div>
        </div>

        {/* Modal Actions - Not printed */}
        <div className="px-5 py-3.5 border-t border-stone-800 bg-stone-950 flex items-center justify-between gap-2 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800 text-xs font-semibold transition-colors"
          >
            وەسڵی نوێ
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-colors"
          >
            <Printer className="w-4 h-4" />
            چاپکردنی وەسڵ (Print)
          </button>
        </div>

      </div>
    </div>
  );
};

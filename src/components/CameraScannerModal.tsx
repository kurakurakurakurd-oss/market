import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, AlertCircle, RefreshCw } from 'lucide-react';
import { playBarcodeBeep } from '../utils/audio';

interface CameraScannerModalProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  onScanSuccess,
  onClose,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'camera-barcode-reader';

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      try {
        setIsInitializing(true);
        setError(null);

        const html5QrCode = new Html5Qrcode(readerElementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });

        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.333,
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (!isMounted) return;
            playBarcodeBeep();
            setLastScanned(decodedText);
            onScanSuccess(decodedText);
          },
          () => {
            // scan failure callback (silent on frame miss)
          }
        );

        if (isMounted) {
          setIsInitializing(false);
        }
      } catch (err) {
        console.error('Camera barcode scanner error:', err);
        if (isMounted) {
          setError('نەتوانرا دەست بە کامێرا بگات. تکایە دڵنیابەرەوە لە ڕێگەپێدانی کامێرا (Camera Permission) یان بارکۆدەکە بە دەست بنووسە.');
          setIsInitializing(false);
        }
      }
    };

    const timeout = setTimeout(startScanner, 200);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current
            .stop()
            .then(() => scannerRef.current?.clear())
            .catch(() => {});
        } else {
          scannerRef.current.clear();
        }
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-stone-900 rounded-2xl shadow-2xl max-w-md w-full border border-emerald-900/40 overflow-hidden text-stone-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800 bg-stone-950">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">خوێندنەوەی بارکۆد بە کامێرا</h3>
              <p className="text-xs text-stone-400">بارکۆدی کاڵاکە بخەرە بەردەم کامێراکە</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center">
          <div className="relative w-full max-w-[320px] aspect-[4/3] bg-stone-950 rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-stone-800">
            <div id={readerElementId} className="w-full h-full" />
            
            {isInitializing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-950/90 text-white z-10 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                <span className="text-xs text-stone-300">کردنەوەی کامێرا...</span>
              </div>
            )}

            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-36 border-2 border-emerald-400/80 rounded-lg relative shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400"></div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400"></div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400"></div>
                <div className="w-full h-0.5 bg-emerald-400/60 absolute top-1/2 -translate-y-1/2 animate-pulse"></div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-3 w-full p-3 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {lastScanned && (
            <div className="mt-3 w-full p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs text-center font-mono font-bold">
              دوایین بارکۆد خوێندراوە: {lastScanned}
            </div>
          )}

          <div className="mt-4 text-center">
            <p className="text-xs text-stone-400">
              ئەگەر جیهازی بارکۆد خوێنی دەستی (Scanner Gun) هەیە، پێویست ناکات کامێرا بکەیتەوە، تەنها بارکۆد لە کاڵاکە بدە و بە خۆکار دەخرێتە سەر سەبەتەکە.
            </p>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-stone-800 bg-stone-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-colors border border-stone-700"
          >
            تەواو / داخستن
          </button>
        </div>
      </div>
    </div>
  );
};

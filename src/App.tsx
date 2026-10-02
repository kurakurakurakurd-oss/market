import React, { useState, useEffect, useCallback } from 'react';
import { Product, SaleRecord, ActiveTab, Currency, InwardEntryRecord, CashierShift } from './types';
import { INITIAL_PRODUCTS } from './data/initialProducts';
import { Navbar } from './components/Navbar';
import { PosTerminal } from './components/PosTerminal';
import { InventoryManager } from './components/InventoryManager';
import { SalesReport } from './components/SalesReport';
import { BarcodeCenter } from './components/BarcodeCenter';
import { ItemEntrySection } from './components/ItemEntrySection';
import { ReceiptModal } from './components/ReceiptModal';
import { useBarcodeScanner } from './hooks/useBarcodeScanner';
import { playBarcodeBeep } from './utils/audio';

export default function App() {
  // Load products from localStorage or fallback to initial list
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('market_pos_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading products from storage:', e);
    }
    return INITIAL_PRODUCTS;
  });

  // Load inward stock receiving history
  const [inwardHistory, setInwardHistory] = useState<InwardEntryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('market_pos_inward_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading inward history from storage:', e);
    }
    return [
      {
        id: 'inward-sample-1',
        productId: 'prod-1',
        productName: 'چای مەحموود - کەرەکەر (٥٠٠ گم)',
        barcode: '6291100234501',
        quantityAdded: 24,
        buyPrice: 4000,
        sellPrice: 5000,
        totalCost: 96000,
        supplierName: 'کۆمپانیای بازرگانی گشتی',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        isNewProduct: false,
      },
      {
        id: 'inward-sample-2',
        productId: 'prod-2',
        productName: 'برنجی کوردی کوردی (پێنج کیلۆیی)',
        barcode: '8690123456789',
        quantityAdded: 15,
        buyPrice: 9500,
        sellPrice: 11500,
        totalCost: 142500,
        supplierName: 'عەمباری دانەوێڵە',
        timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
        isNewProduct: false,
      },
    ];
  });

  // Current active cashier shift: 'day' | 'night'
  const [currentShift, setCurrentShift] = useState<CashierShift>(() => {
    try {
      const saved = localStorage.getItem('market_pos_current_shift');
      if (saved === 'day' || saved === 'night') return saved;
    } catch {
      // ignore
    }
    const hour = new Date().getHours();
    return hour >= 8 && hour < 16 ? 'day' : 'night';
  });

  // Save current shift
  useEffect(() => {
    try {
      localStorage.setItem('market_pos_current_shift', currentShift);
    } catch {
      // ignore
    }
  }, [currentShift]);

  // Load sales history from localStorage
  const [sales, setSales] = useState<SaleRecord[]>(() => {
    try {
      const saved = localStorage.getItem('market_pos_sales');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading sales from storage:', e);
    }
    return [
      {
        id: 'sale-day-1',
        receiptNumber: 'REC-102941',
        shift: 'day',
        items: [
          {
            productId: 'prod-1',
            productName: 'چای مەحموود - کەرەکەر (٥٠٠ گم)',
            barcode: '6291100234501',
            quantity: 3,
            unitPrice: 5000,
            costPrice: 4000,
            totalPrice: 15000,
            totalProfit: 3000,
          },
          {
            productId: 'prod-5',
            productName: 'پێپسی قتوو (٣٣٠ مل)',
            barcode: '012000000133',
            quantity: 6,
            unitPrice: 500,
            costPrice: 400,
            totalPrice: 3000,
            totalProfit: 600,
          },
        ],
        subtotal: 18000,
        discount: 0,
        totalAmount: 18000,
        totalProfit: 3600,
        paidAmount: 20000,
        changeAmount: 2000,
        paymentMethod: 'cash',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'sale-day-2',
        receiptNumber: 'REC-102942',
        shift: 'day',
        items: [
          {
            productId: 'prod-3',
            productName: 'ڕۆنی گوڵەبەرۆژەی زێرین (١ لیتر)',
            barcode: '6210001239874',
            quantity: 2,
            unitPrice: 4000,
            costPrice: 3200,
            totalPrice: 8000,
            totalProfit: 1600,
          },
          {
            productId: 'prod-4',
            productName: 'شەکری سپی ئەڵترا (١ کیلۆ)',
            barcode: '5901234123457',
            quantity: 4,
            unitPrice: 1250,
            costPrice: 950,
            totalPrice: 5000,
            totalProfit: 1200,
          },
        ],
        subtotal: 13000,
        discount: 500,
        totalAmount: 12500,
        totalProfit: 2300,
        paidAmount: 15000,
        changeAmount: 2500,
        paymentMethod: 'cash',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'sale-night-1',
        receiptNumber: 'REC-204811',
        shift: 'night',
        items: [
          {
            productId: 'prod-2',
            productName: 'برنجی کوردی کوردی (پێنج کیلۆیی)',
            barcode: '8690123456789',
            quantity: 2,
            unitPrice: 11500,
            costPrice: 9500,
            totalPrice: 23000,
            totalProfit: 4000,
          },
          {
            productId: 'prod-6',
            productName: 'دۆشاوی تەماتەی بەلەدنا (٨٠٠ گم)',
            barcode: '6281002345129',
            quantity: 3,
            unitPrice: 1500,
            costPrice: 1100,
            totalPrice: 4500,
            totalProfit: 1200,
          },
        ],
        subtotal: 27500,
        discount: 0,
        totalAmount: 27500,
        totalProfit: 5200,
        paidAmount: 30000,
        changeAmount: 2500,
        paymentMethod: 'cash',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
      },
    ];
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [currency, setCurrency] = useState<Currency>('IQD');
  const [activeReceipt, setActiveReceipt] = useState<SaleRecord | null>(null);

  // Save products to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('market_pos_products', JSON.stringify(products));
    } catch (e) {
      console.error('Failed to save products to localStorage', e);
    }
  }, [products]);

  // Save sales to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('market_pos_sales', JSON.stringify(sales));
    } catch (e) {
      console.error('Failed to save sales to localStorage', e);
    }
  }, [sales]);

  // Save inward history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('market_pos_inward_history', JSON.stringify(inwardHistory));
    } catch (e) {
      console.error('Failed to save inward history to localStorage', e);
    }
  }, [inwardHistory]);

  // Global Hardware Barcode Scanner listener
  const handleGlobalBarcodeScan = useCallback(
    (barcode: string) => {
      // Find product
      const found = products.find(
        (p) => p.barcode === barcode || p.barcode.endsWith(barcode) || barcode.endsWith(p.barcode)
      );

      if (found) {
        playBarcodeBeep();
        // If cashier is not in entry or barcode tab, redirect to POS tab
        if (activeTab !== 'pos' && activeTab !== 'entry' && activeTab !== 'barcodes') {
          setActiveTab('pos');
        }
      }
    },
    [products, activeTab]
  );

  useBarcodeScanner({
    onScan: handleGlobalBarcodeScan,
    enabled: true,
  });

  // Complete checkout handler
  const handleCompleteSale = (sale: SaleRecord, updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    setSales((prev) => [sale, ...prev]);
    setActiveReceipt(sale);
  };

  // Product CRUD
  const handleAddProduct = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  const handleUpdateProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleRestock = (productId: string, quantityToAdd: number, newBuyPrice?: number, newSellPrice?: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          stock: p.stock + quantityToAdd,
          buyPrice: newBuyPrice !== undefined && newBuyPrice > 0 ? newBuyPrice : p.buyPrice,
          sellPrice: newSellPrice !== undefined && newSellPrice > 0 ? newSellPrice : p.sellPrice,
        };
      })
    );
  };

  const handleAddInwardRecord = (record: InwardEntryRecord) => {
    setInwardHistory((prev) => [record, ...prev]);
  };

  const handleUpdateProductBarcode = (productId: string, newBarcode: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, barcode: newBarcode } : p))
    );
  };

  const handleResetSampleData = () => {
    setProducts(INITIAL_PRODUCTS);
    localStorage.removeItem('market_pos_products');
    localStorage.removeItem('market_pos_sales');
    localStorage.removeItem('market_pos_inward_history');
    setSales([]);
    setInwardHistory([]);
  };

  return (
    <div className="flex flex-col h-screen bg-stone-950 text-stone-100 font-['Vazirmatn',system-ui,sans-serif] overflow-hidden select-none">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        setCurrency={setCurrency}
        products={products}
        sales={sales}
        onResetSampleData={handleResetSampleData}
      />

      {/* Main Screen Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {activeTab === 'pos' && (
          <PosTerminal
            products={products}
            sales={sales}
            currency={currency}
            currentShift={currentShift}
            onShiftChange={setCurrentShift}
            onCompleteSale={handleCompleteSale}
            onViewReceipt={(sale) => setActiveReceipt(sale)}
          />
        )}

        {/* Dedicated Item Entry & Inward Goods Section */}
        {activeTab === 'entry' && (
          <ItemEntrySection
            products={products}
            currency={currency}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onRestock={handleRestock}
            inwardHistory={inwardHistory}
            onAddInwardRecord={handleAddInwardRecord}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryManager
            products={products}
            currency={currency}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onRestock={(id, qty) => handleRestock(id, qty)}
          />
        )}

        {activeTab === 'sales' && (
          <SalesReport
            sales={sales}
            currency={currency}
            onViewReceipt={(sale) => setActiveReceipt(sale)}
          />
        )}

        {activeTab === 'barcodes' && (
          <BarcodeCenter
            products={products}
            currency={currency}
            onUpdateProductBarcode={handleUpdateProductBarcode}
          />
        )}
      </main>

      {/* Receipt Preview & Print Modal */}
      {activeReceipt && (
        <ReceiptModal
          sale={activeReceipt}
          currency={currency}
          onClose={() => setActiveReceipt(null)}
        />
      )}

    </div>
  );
}

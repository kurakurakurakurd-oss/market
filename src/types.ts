export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: string;
  buyPrice: number; // Cost / کڕین
  sellPrice: number; // Sale / فرۆشتن
  stock: number; // Remaining stock / چەند ماوە
  soldCount: number; // Total sold / چەند فرۆشراوە
  minStockAlert: number; // Alert threshold
  unit: string; // دانە، پاکەت، کیلۆ، کارتۆن
  imageUrl?: string;
  createdAt: string;
  expiryDate?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  totalPrice: number;
  totalProfit: number;
}

export type CashierShift = 'day' | 'night';

export interface SaleRecord {
  id: string;
  receiptNumber: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  totalProfit: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: 'cash' | 'card' | 'debt';
  customerName?: string;
  timestamp: string;
  shift?: CashierShift;
}

export interface InwardEntryRecord {
  id: string;
  productId: string;
  productName: string;
  barcode: string;
  quantityAdded: number;
  buyPrice: number;
  sellPrice: number;
  totalCost: number;
  supplierName?: string;
  timestamp: string;
  isNewProduct: boolean;
}

export type ActiveTab = 'pos' | 'entry' | 'inventory' | 'sales' | 'barcodes';
export type Currency = 'IQD' | 'USD';

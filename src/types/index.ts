export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  price: number;
  costPrice?: number;
  gstRate: number;
  hsnCode: string;
  stock: number;
  imeiNumbers?: string[];
  sku?: string;
  variant?: string;
  rackLocation?: string;
  ean?: string;
  isDualImei?: boolean;
  minThreshold?: number;
  imageUrl?: string;
  margin?: number;
  roiBadge?: string;
  statusTag?: string;
  series?: string;
}

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string;
}

export interface BillItem {
  productId?: string;
  name: string;
  model?: string;
  imei?: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  total: number;
}

export interface Bill {
  id: string;
  invoiceNumber: string;
  date: string;
  customer: Customer;
  items: BillItem[];
  subTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  totalTax: number;
  grandTotal: number;
  paymentMode: string;
  notes?: string;
}

export interface ShopInfo {
  name: string;
  gstin: string;
  phone: string;
  address: string;
}

export interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
  shop: {
    name: string;
    gstin: string;
    phone: string;
  };
}

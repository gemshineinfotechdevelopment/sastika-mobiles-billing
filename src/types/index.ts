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

export interface CategoryItem {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  hsnCode?: string;
  defaultRack?: string;
  isDualImei?: boolean;
  itemCount?: number;
  createdAt?: string;
}

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string;
  tier?: 'VIP MEMBER' | 'REGULAR' | 'KHATA RISK';
  khataBalance?: number;
  khataStatus?: 'settled' | 'pending' | 'risk';
  dueText?: string;
  lifetimeSales?: number;
  billsCount?: number;
  lastBillDate?: string;
  loyaltyPoints?: number;
  avatarBg?: string;
  initials?: string;
  ledger?: CustomerLedgerItem[];
}

export interface CustomerLedgerItem {
  date: string;
  billNumber?: string;
  type: string;
  amount: number;
  paymentMode?: string;
  notes?: string;
  balanceAfter?: number;
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

export interface EmiScheduleItem {
  installmentNo: number;
  dueDate: string;
  amount: number;
  status: 'PENDING' | 'PAID';
}

export interface EmiDetails {
  isEmi: boolean;
  modelName?: string;
  downPayment: number;
  principalAmount: number;
  interestRate: number; // In %
  interestAmount: number;
  tenureMonths: number;
  serviceCharge?: number;
  monthlyEmi: number;
  totalFinancedAmount: number;
  firstDueDate?: string;
  emiSchedule?: EmiScheduleItem[];
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
  time?: string;
  counter?: string;
  customerType?: 'REGULAR' | 'MEMBER' | 'COUNTER POS' | 'CUSTOMER';
  status?: 'PAID' | 'PARTIAL' | 'DRAFT' | 'CANCELLED';
  paidAmount?: number;
  balanceDue?: number;
  dueDate?: string;
  tenderMode?: string;
  itemSummary?: string;
  subSummary?: string;
  isVerified?: boolean;
  isCancelled?: boolean;
  voidReason?: string;
  warningNote?: string;
  stockRestoredText?: string;
  emiDetails?: EmiDetails;
  createdAt?: string;
  updatedAt?: string;
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

export interface Supplier {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  gstin: string;
  contactPerson?: string;
  category?: string;
  totalPurchases?: number;
  balanceDue?: number;
}

export interface PurchaseBillItem {
  name: string;
  category?: string;
  quantity: number;
  unitCost: number;
  gstRate: number;
  taxableAmount: number;
  totalAmount: number;
  imeiNumbers?: string[];
  isBarcoded?: boolean;
}

export interface PurchaseBill {
  id: string;
  supplierInvoiceNumber: string;
  date: string;
  supplier: {
    name: string;
    address: string;
    phone: string;
    gstin: string;
  };
  itemsSummary: string;
  unitsCount: number;
  imeiLoggedCount?: number;
  isBarcoded?: boolean;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  dueNotice?: string;
  paymentStatus: 'PAID FULL' | 'PARTIAL DUE' | 'UNPAID';
  stockSyncStatus: 'Verified' | 'Pending';
  taxAuditStatus?: string;
  items?: PurchaseBillItem[];
}

export interface ZReportProductItem {
  productId: string;
  name: string;
  model?: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  grossAmount: number;
  discountAmount: number;
  netWorthAmount: number;
  unitCost: number;
  totalCost: number;
  profit: number;
}

export interface ZReportBillSummary {
  id: string;
  invoiceNumber: string;
  time: string;
  customerName: string;
  customerPhone?: string;
  itemsCount: number;
  itemsSummary: string;
  paymentMode: string;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  status: string;
}

export interface ZReportData {
  reportDate: string;
  terminal: string;
  totalInvoices: number;
  firstInvoice?: string;
  lastInvoice?: string;
  grossSales: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  taxableTurnover: number;
  cgstTotal: number;
  sgstTotal: number;
  totalTax: number;
  totalItemsCount: number;
  discountsTotal: number;
  netSales: number;
  breakdown: {
    cashSales: number;
    upiSales: number;
    cardSales: number;
    khataCreditSales: number;
    netCollected: number;
  };
  voids: {
    count: number;
    totalAmount: number;
  };
  productsSold: ZReportProductItem[];
  billsList: ZReportBillSummary[];
  generatedAt: string;
}


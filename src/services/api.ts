import type {
  Bill,
  Customer,
  HealthResponse,
  Product,
  ShopInfo,
  Supplier,
  PurchaseBill,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = {
  // Check backend connection health
  async checkHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Backend health check failed');
    return res.json();
  },

  // Get shop details
  async getShopInfo(): Promise<ShopInfo> {
    const res = await fetch(`${API_BASE}/shop-info`);
    if (!res.ok) throw new Error('Failed to fetch shop info');
    return res.json();
  },

  // Products / Inventory
  async getProducts(
    search?: string,
    category?: string,
    lowStock?: boolean
  ): Promise<{ products: Product[]; count: number }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (lowStock) params.append('lowStock', 'true');

    const res = await fetch(`${API_BASE}/products?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  async addProduct(product: Partial<Product>): Promise<{ success: boolean; product: Product }> {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!res.ok) throw new Error('Failed to add product');
    return res.json();
  },

  async updateProduct(
    id: string,
    updates: Partial<Product>
  ): Promise<{ success: boolean; product: Product }> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update product');
    return res.json();
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete product');
    return res.json();
  },

  async adjustStock(
    id: string,
    delta?: number,
    newStock?: number
  ): Promise<{ success: boolean; product: Product }> {
    const res = await fetch(`${API_BASE}/products/${id}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta, newStock }),
    });
    if (!res.ok) throw new Error('Failed to adjust stock');
    return res.json();
  },

  // Customers
  async getCustomers(
    search?: string,
    tier?: string,
    khataStatus?: string
  ): Promise<{ customers: Customer[]; count: number }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (tier) params.append('tier', tier);
    if (khataStatus) params.append('khataStatus', khataStatus);

    const res = await fetch(`${API_BASE}/customers?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch customers');
    return res.json();
  },

  async addCustomer(customer: Customer): Promise<{ success: boolean; customer: Customer }> {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer),
    });
    if (!res.ok) throw new Error('Failed to save customer');
    return res.json();
  },

  async collectCustomerPayment(
    customerId: string,
    data: { amount: number; paymentMode?: string; notes?: string; billNumber?: string }
  ): Promise<{ success: boolean; newBalance: number; customer: Customer }> {
    const res = await fetch(`${API_BASE}/customers/${customerId}/collect-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to record customer payment');
    return res.json();
  },

  // Bills / Invoices
  async getBills(
    search?: string,
    status?: string,
    paymentMode?: string
  ): Promise<{ bills: Bill[]; count: number }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (paymentMode) params.append('paymentMode', paymentMode);

    const res = await fetch(`${API_BASE}/bills?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch bills');
    return res.json();
  },

  async createBill(billData: {
    customer: Customer;
    items: Partial<Bill['items'][0]>[];
    paymentMode: string;
    tenderMode?: string;
    paidAmount?: number;
    balanceDue?: number;
    notes?: string;
  }): Promise<{ success: boolean; bill: Bill }> {
    const res = await fetch(`${API_BASE}/bills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(billData),
    });
    if (!res.ok) throw new Error('Failed to generate bill');
    return res.json();
  },

  async voidBill(
    id: string,
    reason: string
  ): Promise<{ success: boolean; message: string; bill: Bill }> {
    const res = await fetch(`${API_BASE}/bills/${id}/void`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to void invoice');
    return res.json();
  },

  async getZReport(date?: string): Promise<Record<string, unknown>> {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    const res = await fetch(`${API_BASE}/bills/reports/z-report?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to generate Daily Z-Report');
    return res.json();
  },

  // Purchases & Inward Stock
  async getPurchases(
    search?: string,
    paymentStatus?: string,
    stockSyncStatus?: string
  ): Promise<{ purchases: PurchaseBill[]; count: number }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (paymentStatus) params.append('paymentStatus', paymentStatus);
    if (stockSyncStatus) params.append('stockSyncStatus', stockSyncStatus);

    const res = await fetch(`${API_BASE}/purchases?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch purchases');
    return res.json();
  },

  async createPurchase(
    purchaseData: Partial<PurchaseBill>
  ): Promise<{ success: boolean; purchase: PurchaseBill }> {
    const res = await fetch(`${API_BASE}/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchaseData),
    });
    if (!res.ok) throw new Error('Failed to record purchase bill');
    return res.json();
  },

  async settlePurchasePayment(
    purchaseId: string,
    amount: number,
    paymentMode?: string
  ): Promise<{ success: boolean; purchase: PurchaseBill }> {
    const res = await fetch(`${API_BASE}/purchases/${purchaseId}/settle-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, paymentMode }),
    });
    if (!res.ok) throw new Error('Failed to settle purchase payment');
    return res.json();
  },

  // Suppliers
  async getSuppliers(search?: string): Promise<{ suppliers: Supplier[]; count: number }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const res = await fetch(`${API_BASE}/suppliers?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch suppliers');
    return res.json();
  },

  async addSupplier(
    supplier: Partial<Supplier>
  ): Promise<{ success: boolean; supplier: Supplier }> {
    const res = await fetch(`${API_BASE}/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supplier),
    });
    if (!res.ok) throw new Error('Failed to save supplier');
    return res.json();
  },

  async settleSupplier(
    supplierId: string,
    amount: number
  ): Promise<{ success: boolean; supplier: Supplier }> {
    const res = await fetch(`${API_BASE}/suppliers/${supplierId}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) throw new Error('Failed to settle supplier dues');
    return res.json();
  },

  // Reports & Analytics
  async getReportsAnalytics(): Promise<Record<string, unknown>> {
    const res = await fetch(`${API_BASE}/reports/analytics`);
    if (!res.ok) throw new Error('Failed to fetch business analytics');
    return res.json();
  },

  // Settings
  async getSettings(): Promise<{ success: boolean; settings: Record<string, unknown> }> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(
    settings: Record<string, unknown>
  ): Promise<{ success: boolean; settings: Record<string, unknown> }> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  // Auth & Admin User
  async getCurrentUser(): Promise<{
    success: boolean;
    user: { username: string; name: string; role: string; shopName?: string };
  }> {
    const res = await fetch(`${API_BASE}/auth/me`);
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return res.json();
  },

  async changePassword(
    newPassword: string,
    confirmPassword: string,
    username = 'officetest'
  ): Promise<{
    success: boolean;
    message: string;
    user: { username: string; name: string; role: string };
  }> {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, newPassword, confirmPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update password');
    }
    return data;
  },

  // Cloudinary Image Upload
  async uploadImage(
    file: File,
    folder = 'sastika_mobiles/products'
  ): Promise<{ success: boolean; url: string; publicId: string }> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);

    const res = await fetch(`${API_BASE}/upload/image`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload image to Cloudinary');
    return res.json();
  },
};

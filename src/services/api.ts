import type {
  Bill,
  Customer,
  HealthResponse,
  Product,
  ShopInfo,
  Supplier,
  PurchaseBill,
  CategoryItem,
  ZReportData,
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
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || 'Failed to save customer');
    }
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
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || 'Failed to record customer payment');
    }
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
  }): Promise<{ success: boolean; bill: Bill; message?: string }> {
    const res = await fetch(`${API_BASE}/bills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(billData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || 'Failed to generate bill');
    }
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

  async updateBill(
    id: string,
    updateData: Partial<Bill>
  ): Promise<{ success: boolean; message: string; bill: Bill }> {
    const res = await fetch(`${API_BASE}/bills/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || 'Failed to update invoice');
    }
    return res.json();
  },

  async deleteBill(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/bills/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || 'Failed to delete invoice');
    }
    return res.json();
  },

  async getZReport(date?: string): Promise<{ success: boolean } & ZReportData> {
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

  // Categories
  async getCategories(): Promise<{ success: boolean; categories: CategoryItem[]; count: number }> {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (res.ok) {
        const data = await res.json();
        // Cache in localStorage for offline resiliency
        if (data && data.categories) {
          localStorage.setItem('sastika_categories_cache', JSON.stringify(data.categories));
        }
        return data;
      }
    } catch (err) {
      console.warn('API getCategories error, falling back to cache:', err);
    }

    // Offline / LocalStorage fallback
    const cached = localStorage.getItem('sastika_categories_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return { success: true, categories: parsed, count: parsed.length };
      } catch {
        // continue to default
      }
    }

    const defaultList: CategoryItem[] = [
      { name: 'Smartphones', hsnCode: '85171300', defaultRack: 'Rack A1', isDualImei: true },
      { name: 'Fast Chargers', hsnCode: '85044090', defaultRack: 'Rack C1', isDualImei: false },
      { name: 'TWS Earbuds & Neckbands', hsnCode: '85183000', defaultRack: 'Rack B1', isDualImei: false },
      { name: 'Screen Protectors', hsnCode: '70071900', defaultRack: 'Rack Front-Spindle', isDualImei: false },
      { name: 'Smartwatches', hsnCode: '85176290', defaultRack: 'Rack D1', isDualImei: false },
      { name: 'Accessories', hsnCode: '85177090', defaultRack: 'Rack E1', isDualImei: false },
    ];
    return { success: true, categories: defaultList, count: defaultList.length };
  },

  async addCategory(categoryData: {
    name: string;
    description?: string;
    hsnCode?: string;
    defaultRack?: string;
    isDualImei?: boolean;
  }): Promise<{ success: boolean; message: string; category: CategoryItem }> {
    const trimmedName = categoryData.name.trim();
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (err) {
      console.warn('API addCategory offline fallback:', err);
    }

    // Offline / LocalStorage fallback
    const cached = localStorage.getItem('sastika_categories_cache');
    let list: CategoryItem[] = [];
    if (cached) {
      try { list = JSON.parse(cached); } catch { list = []; }
    }
    const newCat: CategoryItem = {
      name: trimmedName,
      description: categoryData.description || '',
      hsnCode: categoryData.hsnCode || '85171300',
      defaultRack: categoryData.defaultRack || 'Rack A1',
      isDualImei: Boolean(categoryData.isDualImei),
      createdAt: new Date().toISOString(),
    };
    if (!list.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      list.push(newCat);
      localStorage.setItem('sastika_categories_cache', JSON.stringify(list));
    }
    return { success: true, message: 'Category added locally', category: newCat };
  },

  async deleteCategory(idOrName: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(idOrName)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete category');
    return res.json();
  },
};

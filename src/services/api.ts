import type { Bill, Customer, HealthResponse, Product, ShopInfo } from '../types';

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
  async getProducts(search?: string, category?: string): Promise<{ products: Product[]; count: number }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    
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

  // Customers
  async getCustomers(search?: string): Promise<{ customers: Customer[]; count: number }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

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

  // Bills / Invoices
  async getBills(search?: string): Promise<{ bills: Bill[]; count: number }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const res = await fetch(`${API_BASE}/bills?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch bills');
    return res.json();
  },

  async createBill(billData: {
    customer: Customer;
    items: Partial<Bill['items'][0]>[];
    paymentMode: string;
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
};

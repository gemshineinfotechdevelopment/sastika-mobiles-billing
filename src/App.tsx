import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { InvoiceGenerator } from './components/InvoiceGenerator';
import { RecentBills } from './components/RecentBills';
import { InventoryView } from './components/InventoryView';
import { InvoiceModal } from './components/InvoiceModal';
import { api } from './services/api';
import type { Bill, HealthResponse, Product } from './types';
import { TrendingUp, FileCheck, Boxes, AlertCircle } from 'lucide-react';
import './App.css';

export function App() {
  const [activeTab, setActiveTab] = useState<'billing' | 'invoices' | 'inventory'>('billing');
  const [serverHealth, setServerHealth] = useState<HealthResponse | null>(null);
  const [serverLoading, setServerLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  // Check health and load initial data
  const loadServerHealth = async () => {
    setServerLoading(true);
    try {
      const health = await api.checkHealth();
      setServerHealth(health);
    } catch {
      setServerHealth(null);
    } finally {
      setServerLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [prodsRes, billsRes] = await Promise.all([
        api.getProducts(),
        api.getBills(),
      ]);
      setProducts(prodsRes.products || []);
      setBills(billsRes.bills || []);
    } catch (err) {
      console.warn('Initial data load failed (backend might not be running yet):', err);
    }
  };

  useEffect(() => {
    loadServerHealth();
    loadData();
  }, []);

  const handleInvoiceCreated = (newBill: Bill) => {
    setBills((prev) => [newBill, ...prev]);
    setSelectedBill(newBill);
    // Reload products to get updated stock
    api.getProducts().then((res) => setProducts(res.products || []));
  };

  // Quick stats calculation
  const totalSales = bills.reduce((acc, b) => acc + (b.grandTotal || 0), 0);
  const totalUnitsInStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const lowStockCount = products.filter((p) => p.stock <= 5).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        serverHealth={serverHealth}
        serverLoading={serverLoading}
        onRefreshHealth={() => {
          loadServerHealth();
          loadData();
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Server Disconnected Banner */}
        {!serverHealth && !serverLoading && (
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between text-amber-800 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-amber-900">Backend Server is Not Running</p>
                <p className="text-amber-700">
                  Run <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">npm run dev:all</code> in your terminal to start both the Vite Frontend and Node.js Backend concurrently.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                loadServerHealth();
                loadData();
              }}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-xs flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Billed</p>
              <p className="text-lg font-black text-slate-900 font-mono">
                ₹{totalSales.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-xs flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Invoices Generated</p>
              <p className="text-lg font-black text-slate-900 font-mono">{bills.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-xs flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Handsets & Items in Stock</p>
              <p className="text-lg font-black text-slate-900 font-mono">{totalUnitsInStock} units</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-xs flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Low Stock Handsets</p>
              <p className="text-lg font-black text-slate-900 font-mono">{lowStockCount} items</p>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'billing' && (
          <InvoiceGenerator
            products={products}
            onInvoiceCreated={handleInvoiceCreated}
          />
        )}

        {activeTab === 'invoices' && (
          <RecentBills
            bills={bills}
            onSelectBill={(bill) => setSelectedBill(bill)}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            products={products}
            onProductAdded={loadData}
          />
        )}
      </main>

      {/* Invoice Modal for Preview & Printing */}
      {selectedBill && (
        <InvoiceModal
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400 no-print">
        <p>Sastika Mobiles Billing Software • Built with React, Vite, Tailwind CSS & Node.js Express</p>
      </footer>
    </div>
  );
}

export default App;

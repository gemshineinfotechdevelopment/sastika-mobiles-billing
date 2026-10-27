import { useState, useEffect } from 'react';
import { MainLayout } from './components/MainLayout';
import type { NavTab } from './components/Sidebar';
import {
  DashboardPage,
  BillingPage,
  ProductsPage,
  SalesPage,
  CustomersPage,
  PurchasesPage,
  ReportsPage,
  SettingsPage,
} from './pages';
import { InvoiceModal } from './components/InvoiceModal';
import { AddProductModal } from './components/modals/AddProductModal';
import { AddCustomerModal } from './components/modals/AddCustomerModal';
import { api } from './services/api';
import type { Bill, Customer, HealthResponse, Product } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AlertCircle, X } from 'lucide-react';
import './App.css';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    try {
      const saved = localStorage.getItem('sastika_active_tab');
      if (
        saved &&
        [
          'dashboard',
          'billing',
          'products',
          'sales',
          'customers',
          'purchases',
          'reports',
          'settings',
        ].includes(saved)
      ) {
        return saved as NavTab;
      }
    } catch {
      // fallback
    }
    return 'dashboard';
  });

  useEffect(() => {
    try {
      localStorage.setItem('sastika_active_tab', activeTab);
    } catch {
      // ignore
    }
  }, [activeTab]);
  const [serverHealth, setServerHealth] = useState<HealthResponse | null>(null);
  const [serverLoading, setServerLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [customerRefreshKey, setCustomerRefreshKey] = useState(0);
  const [lastAddedCustomer, setLastAddedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dismissOfflineBanner, setDismissOfflineBanner] = useState(false);

  // Check health and load live data from database
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
      console.warn('Initial data load notice:', err);
    }
  };

  useEffect(() => {
    loadServerHealth();
    loadData();
  }, []);

  // Reload fresh data from database on every tab change
  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Keyboard shortcut listener: F2 triggers "New Bill", F4 triggers "Add Product", Alt+C triggers "Add Customer"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('billing');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setShowAddProductModal(true);
      } else if ((e.altKey && (e.key === 'c' || e.key === 'C')) || e.key === 'F3') {
        e.preventDefault();
        setShowAddCustomerModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCustomerAdded = (customer: Customer) => {
    setLastAddedCustomer(customer);
    setCustomerRefreshKey((prev) => prev + 1);
  };

  const handleInvoiceCreated = (newBill: Bill) => {
    setSelectedBill(newBill);
    // Instantly prepend to state so Sales & Bills and Dashboard show it with 0ms delay
    setBills((prev) => [
      newBill,
      ...prev.filter(
        (b) => b.id !== newBill.id && b.invoiceNumber !== newBill.invoiceNumber
      ),
    ]);
    // Reload directly from database to ensure full synchronization
    loadData();
  };

  const handleSearchSubmit = (query: string) => {
    if (!query.trim()) return;
    if (query.toLowerCase().startsWith('inv-') || !isNaN(Number(query))) {
      setActiveTab('sales');
    } else {
      setActiveTab('products');
    }
  };

  return (
    <>
      {/* Unified Main Layout with Sidebar, Navbar, and Footer components */}
      <MainLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        serverHealth={serverHealth}
        serverLoading={serverLoading}
        onRefreshHealth={() => {
          loadServerHealth();
          loadData();
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
      >
        {/* Server Disconnected Banner */}
        {!serverHealth && !serverLoading && !dismissOfflineBanner && (
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 text-xs shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-amber-900">Backend Server is Offline</p>
                <p className="text-amber-700">
                  Running with local dashboard memory. Run <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">npm run dev:all</code> to launch express backend concurrently.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => {
                  loadServerHealth();
                  loadData();
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
              >
                Retry Server
              </button>
              <button
                onClick={() => setDismissOfflineBanner(true)}
                className="p-1.5 text-amber-600 hover:text-amber-900 hover:bg-amber-100/70 rounded-lg transition-colors cursor-pointer"
                title="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Every Web Page runs from src/pages/ */}
        {activeTab === 'dashboard' && (
          <ErrorBoundary key="dashboard" fallbackMessage="Dashboard failed to load">
            <DashboardPage
              bills={bills}
              products={products}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenAddProduct={() => setShowAddProductModal(true)}
              onOpenAddCustomer={() => setShowAddCustomerModal(true)}
              onViewBill={(bill) => setSelectedBill(bill)}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'billing' && (
          <ErrorBoundary key="billing" fallbackMessage="Billing page failed to load">
            <BillingPage
              products={products}
              bills={bills}
              onInvoiceCreated={handleInvoiceCreated}
              onOpenAddCustomer={() => setShowAddCustomerModal(true)}
              lastAddedCustomer={lastAddedCustomer}
              refreshTrigger={customerRefreshKey}
              onViewBill={(bill) => setSelectedBill(bill)}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'products' && (
          <ErrorBoundary key="products" fallbackMessage="Products page failed to load">
            <ProductsPage
              products={products}
              onProductAdded={loadData}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'sales' && (
          <ErrorBoundary key="sales" fallbackMessage="Sales page failed to load">
            <SalesPage
              bills={bills}
              onSelectBill={(bill) => setSelectedBill(bill)}
              onNewBill={() => setActiveTab('billing')}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'customers' && (
          <ErrorBoundary key="customers" fallbackMessage="Customers page failed to load">
            <CustomersPage
              onOpenAddCustomer={() => setShowAddCustomerModal(true)}
              refreshTrigger={customerRefreshKey}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'purchases' && (
          <ErrorBoundary key="purchases" fallbackMessage="Purchases page failed to load">
            <PurchasesPage />
          </ErrorBoundary>
        )}

        {activeTab === 'reports' && (
          <ErrorBoundary key="reports" fallbackMessage="Reports page failed to load">
            <ReportsPage
              bills={bills}
              products={products}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'settings' && (
          <ErrorBoundary key="settings" fallbackMessage="Settings page failed to load">
            <SettingsPage />
          </ErrorBoundary>
        )}
      </MainLayout>

      {/* Invoice Modal for Viewing & Printing */}
      {selectedBill && (
        <InvoiceModal
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
        />
      )}

      {/* Reusable Add Product Modal */}
      <AddProductModal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        onProductAdded={loadData}
      />

      {/* Reusable Add Customer Modal */}
      <AddCustomerModal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        onCustomerAdded={handleCustomerAdded}
      />
    </>
  );
}

export default App;

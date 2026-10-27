import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Trash2,
  User,
  UserPlus,
  Edit2,
  Tag,
  Printer,
  X,
  Receipt,
  ArrowLeft,
  CreditCard,
  IndianRupee,
  QrCode,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import type { Bill, BillItem, Customer, Product } from '../types';
import { api } from '../services/api';
import type { NavTab } from '../components/Sidebar';

interface BillingPageProps {
  products: Product[];
  bills?: Bill[];
  onInvoiceCreated: (bill: Bill) => void;
  onOpenAddCustomer?: () => void;
  lastAddedCustomer?: Customer | null;
  refreshTrigger?: number;
  onViewBill?: (bill: Bill) => void;
  onNavigateTab?: (tab: NavTab) => void;
}

interface PosProduct {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  price: number;
  stock: number;
  hsn: string;
  gstRate: number;
  type: 'IMEI TRACKED' | 'BARCODE';
  icon?: 'phone' | 'charger' | 'audio' | 'watch' | 'glass';
  imeiList?: string[];
}

const BILLING_SESSION_STORAGE_KEY = 'sastika_pos_billing_session';

interface BillingDraftSession {
  cartItems: BillItem[];
  selectedCustomer: Customer;
  discount: number;
  discountLabel: string;
  paymentMode: 'UPI' | 'Cash' | 'Card' | 'Credit';
  invoiceNotes: string;
  viewMode: 'catalog' | 'bill';
  savedAt: number;
}

const loadSavedBillingSession = (): Partial<BillingDraftSession> => {
  try {
    const raw = localStorage.getItem(BILLING_SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read billing session from localStorage:', err);
  }
  return {};
};

export const BillingPage: React.FC<BillingPageProps> = ({
  products: serverProducts,
  bills = [],
  onInvoiceCreated,
  onOpenAddCustomer,
  lastAddedCustomer,
  refreshTrigger,
  onViewBill,
  onNavigateTab,
}) => {
  const [showRecentBillsModal, setShowRecentBillsModal] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const billScanInputRef = useRef<HTMLInputElement>(null);

  const initialDraftRef = useRef(loadSavedBillingSession());
  const initialDraft = initialDraftRef.current;

  // View state: 'catalog' | 'bill'
  const [viewMode, setViewMode] = useState<'catalog' | 'bill'>(() => {
    if (initialDraft.viewMode) return initialDraft.viewMode;
    if (initialDraft.cartItems && initialDraft.cartItems.length > 0) return 'bill';
    return 'catalog';
  });

  // Live products state synced with MongoDB
  const [liveProducts, setLiveProducts] = useState<Product[]>(serverProducts || []);

  useEffect(() => {
    if (serverProducts && serverProducts.length > 0) {
      setLiveProducts(serverProducts);
    }
  }, [serverProducts]);

  // Fetch live products directly from MongoDB on mount to guarantee up-to-date catalog
  useEffect(() => {
    api.getProducts()
      .then((res) => {
        if (res && res.products) {
          setLiveProducts(res.products);
        }
      })
      .catch((err) => console.warn('Could not load live products for billing:', err));
  }, []);

  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Live POS product catalog derived 100% dynamically from MongoDB Products
  const mergedCatalog: PosProduct[] = React.useMemo(() => {
    return (liveProducts || []).map((sp) => {
      const cat = sp.category || 'Accessories';
      const c = cat.toLowerCase();
      let icon: PosProduct['icon'] = 'phone';
      if (c.includes('charger') || c.includes('cable') || c.includes('adapter')) {
        icon = 'charger';
      } else if (c.includes('audio') || c.includes('earbud') || c.includes('headphone') || c.includes('neckband')) {
        icon = 'audio';
      } else if (c.includes('glass') || c.includes('tempered') || c.includes('screen')) {
        icon = 'glass';
      } else if (c.includes('watch')) {
        icon = 'watch';
      }

      return {
        id: sp.id,
        name: sp.name,
        subtitle: `${sp.model || sp.variant || sp.brand || ''} • HSN: ${sp.hsnCode || '8517'}`,
        category: cat,
        price: sp.price,
        stock: sp.stock,
        hsn: sp.hsnCode || '8517',
        gstRate: sp.gstRate || 18,
        type: sp.imeiNumbers && sp.imeiNumbers.length > 0 ? ('IMEI TRACKED' as const) : ('BARCODE' as const),
        imeiList: sp.imeiNumbers,
        icon,
      };
    });
  }, [liveProducts]);

  // Customer state: loaded from MongoDB database
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(() => {
    if (
      initialDraft.selectedCustomer &&
      initialDraft.selectedCustomer.name &&
      initialDraft.selectedCustomer.name !== 'Walk-in Customer'
    ) {
      return initialDraft.selectedCustomer;
    }
    return {
      name: '',
      phone: '',
      email: '',
      address: '',
      gstin: '',
      tier: 'REGULAR',
    };
  });
  const [showExtraCustomerFields, setShowExtraCustomerFields] = useState(false);

  useEffect(() => {
    api
      .getCustomers()
      .then((res) => {
        if (res && res.customers && res.customers.length > 0) {
          setCustomerList(res.customers);
          if (lastAddedCustomer) {
            setSelectedCustomer(lastAddedCustomer);
          }
        }
      })
      .catch((err) => console.warn('Could not load customers for billing:', err));
  }, [refreshTrigger, lastAddedCustomer]);

  // Active invoice items (restored from persistent session)
  const [cartItems, setCartItems] = useState<BillItem[]>(() => {
    return Array.isArray(initialDraft.cartItems) ? initialDraft.cartItems : [];
  });

  // Financial Discount & Payment Mode (restored from persistent session)
  const [discount, setDiscount] = useState<number>(() => {
    return typeof initialDraft.discount === 'number' ? initialDraft.discount : 0;
  });
  const [discountLabel, setDiscountLabel] = useState<string>(() => {
    return initialDraft.discountLabel || 'Store Discount';
  });
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Cash' | 'Card' | 'Credit'>(() => {
    return initialDraft.paymentMode || 'UPI';
  });
  const [invoiceNotes, setInvoiceNotes] = useState<string>(() => {
    return initialDraft.invoiceNotes || 'Counter POS Sale';
  });
  const [submitting, setSubmitting] = useState(false);

  // Persist Billing Session across page refreshes, tab switching, and browser restart
  useEffect(() => {
    try {
      const sessionData: BillingDraftSession = {
        cartItems,
        selectedCustomer,
        discount,
        discountLabel,
        paymentMode,
        invoiceNotes,
        viewMode,
        savedAt: Date.now(),
      };
      localStorage.setItem(BILLING_SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    } catch (err) {
      console.warn('Failed to save billing session:', err);
    }
  }, [
    cartItems,
    selectedCustomer,
    discount,
    discountLabel,
    paymentMode,
    invoiceNotes,
    viewMode,
  ]);

  // Synchronize across multiple browser tabs automatically
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === BILLING_SESSION_STORAGE_KEY) {
        if (!e.newValue) {
          setCartItems([]);
          setDiscount(0);
          setSelectedCustomer({ name: '', phone: '', email: '', address: '', gstin: '', tier: 'REGULAR' });
          return;
        }
        try {
          const parsed: BillingDraftSession = JSON.parse(e.newValue);
          if (Array.isArray(parsed.cartItems)) setCartItems(parsed.cartItems);
          if (parsed.selectedCustomer) setSelectedCustomer(parsed.selectedCustomer);
          if (typeof parsed.discount === 'number') setDiscount(parsed.discount);
          if (parsed.discountLabel) setDiscountLabel(parsed.discountLabel);
          if (parsed.paymentMode) setPaymentMode(parsed.paymentMode);
          if (parsed.invoiceNotes) setInvoiceNotes(parsed.invoiceNotes);
          if (parsed.viewMode) setViewMode(parsed.viewMode);
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // IMEI Edit Modal State
  const [editingImeiIndex, setEditingImeiIndex] = useState<number | null>(null);
  const [tempImei, setTempImei] = useState('');

  // Bill page quick-search state
  const [billSearchQuery, setBillSearchQuery] = useState('');
  const [showBillSuggestions, setShowBillSuggestions] = useState(false);

  // Hotkey listener: F2 (New Bill), F3 (Search), Alt+C (Customer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setViewMode('bill');
        setTimeout(() => billScanInputRef.current?.focus(), 80);
      }
      if (e.key === 'F3') {
        e.preventDefault();
        if (viewMode === 'bill') {
          billScanInputRef.current?.focus();
        } else {
          scanInputRef.current?.focus();
        }
      }
      if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        if (onOpenAddCustomer) onOpenAddCustomer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, onOpenAddCustomer]);

  // Recalculate item financials with reverse GST
  const calculateItemFinancials = (qty: number, unitPrice: number, gstRate: number = 18) => {
    const total = qty * unitPrice;
    const taxable = total / (1 + gstRate / 100);
    const tax = total - taxable;
    return {
      quantity: qty,
      unitPrice,
      total,
      taxableAmount: Number(taxable.toFixed(2)),
      cgst: Number((tax / 2).toFixed(2)),
      sgst: Number((tax / 2).toFixed(2)),
      gstRate,
    };
  };

  // Add product to cart
  const handleAddToCart = (product: PosProduct, openBillView = true) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.name === product.name);
      if (existingIdx !== -1) {
        const updated = [...prev];
        const currentItem = updated[existingIdx];
        const newQty = currentItem.quantity + 1;
        const financials = calculateItemFinancials(newQty, currentItem.unitPrice, currentItem.gstRate);
        updated[existingIdx] = { ...currentItem, ...financials };
        return updated;
      }

      // Fresh add
      const imeiToAssign = product.imeiList && product.imeiList.length > 0 ? product.imeiList[0] : '';
      const financials = calculateItemFinancials(1, product.price, product.gstRate);
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          model: product.subtitle,
          imei: imeiToAssign,
          ...financials,
        },
      ];
    });

    if (openBillView) {
      setViewMode('bill');
      setTimeout(() => billScanInputRef.current?.focus(), 80);
    }
  };

  // Quantity updates
  const handleUpdateQty = (index: number, delta: number) => {
    setCartItems((prev) => {
      const copy = [...prev];
      const target = copy[index];
      const newQty = target.quantity + delta;
      if (newQty <= 0) {
        return copy.filter((_, i) => i !== index);
      }
      const financials = calculateItemFinancials(newQty, target.unitPrice, target.gstRate);
      copy[index] = { ...target, ...financials };
      return copy;
    });
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Scan or search submission on catalog page
  const handleCatalogScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    const matchedByImei = mergedCatalog.find((p) =>
      p.imeiList?.some((im) => im.toLowerCase() === query)
    );
    if (matchedByImei) {
      handleAddToCart(matchedByImei, true);
      setSearchQuery('');
      return;
    }

    const matchedByName = mergedCatalog.find(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.subtitle.toLowerCase().includes(query)
    );
    if (matchedByName) {
      handleAddToCart(matchedByName, true);
      setSearchQuery('');
      return;
    }

    alert(`No matching product found for: "${searchQuery}"`);
  };

  // Scan or search submission on New Bill page
  const handleBillScanSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = billSearchQuery.trim().toLowerCase();
    if (!query) return;

    const matchedByImei = mergedCatalog.find((p) =>
      p.imeiList?.some((im) => im.toLowerCase() === query)
    );
    if (matchedByImei) {
      handleAddToCart(matchedByImei, false);
      setBillSearchQuery('');
      setShowBillSuggestions(false);
      return;
    }

    const matchedByName = mergedCatalog.find(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.subtitle.toLowerCase().includes(query)
    );
    if (matchedByName) {
      handleAddToCart(matchedByName, false);
      setBillSearchQuery('');
      setShowBillSuggestions(false);
      return;
    }

    alert(`No matching product found for: "${billSearchQuery}"`);
  };

  // Filter products for New Bill search autocomplete
  const billSuggestions = mergedCatalog
    .filter((item) => {
      const q = billSearchQuery.toLowerCase().trim();
      if (!q) return false;
      return (
        item.name.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.imeiList?.some((im) => im.toLowerCase().includes(q))
      );
    })
    .slice(0, 6);

  // Financial calculations
  const rawSubtotal = cartItems.reduce((acc, item) => acc + item.total, 0);
  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const netPayable = Math.max(0, rawSubtotal - discount);

  // Reverse GST for the net total (18% GST standard)
  const taxableValue = Number((netPayable / 1.18).toFixed(2));
  const totalTax = Number((netPayable - taxableValue).toFixed(2));
  const cgst = Number((totalTax / 2).toFixed(2));
  const sgst = Number((totalTax / 2).toFixed(2));

  // Generate & Print Invoice
  const handleGenerateInvoice = async () => {
    if (cartItems.length === 0) {
      alert('Cart is empty. Please add items to create a bill.');
      return;
    }

    const custName = (selectedCustomer?.name || '').trim();
    const custPhone = (selectedCustomer?.phone || '').trim();

    if (!custName) {
      alert('Please enter Customer Name to proceed with billing.');
      return;
    }

    if (!custPhone) {
      alert('Please enter Customer Mobile Number to maintain customer records.');
      return;
    }

    setSubmitting(true);
    try {
      const billData = {
        customer: {
          id: selectedCustomer?.id || '',
          name: custName,
          phone: custPhone,
          email: selectedCustomer?.email || '',
          address: selectedCustomer?.address || '',
          gstin: selectedCustomer?.gstin || '',
          tier: selectedCustomer?.tier || 'REGULAR',
        },
        items: cartItems.map((item) => ({
          productId: item.productId || '',
          name: item.name,
          model: item.model || '',
          imei: item.imei || '',
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          gstRate: Number(item.gstRate) || 18,
          taxableAmount: Number(item.taxableAmount) || 0,
          total: Number(item.total) || 0,
        })),
        paymentMode,
        tenderMode: paymentMode,
        paidAmount: paymentMode === 'Credit' ? 0 : netPayable,
        balanceDue: paymentMode === 'Credit' ? netPayable : 0,
        notes: discount > 0 ? `${discountLabel}: -₹${discount}` : invoiceNotes,
      };

      const res = await api.createBill(billData);
      if (res && res.success && res.bill) {
        localStorage.removeItem(BILLING_SESSION_STORAGE_KEY);
        onInvoiceCreated(res.bill);
        setCartItems([]);
        setDiscount(0);
        setSelectedCustomer({ name: '', phone: '', email: '', address: '', gstin: '', tier: 'REGULAR' });
        setViewMode('catalog');
        // Refresh local products to reflect decremented stock
        api.getProducts().then((pRes) => {
          if (pRes && pRes.products) setLiveProducts(pRes.products);
        });
        // Also refresh customers list
        api.getCustomers().then((cRes) => {
          if (cRes && cRes.customers) setCustomerList(cRes.customers);
        });
      } else {
        throw new Error(res?.message || 'Server did not return bill data');
      }
    } catch (err: any) {
      console.warn('Backend invoice creation notice:', err);
      // Fallback local bill if network disconnected
      const localBill: Bill = {
        id: `INV-${Date.now().toString().slice(-6)}`,
        invoiceNumber: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customer: {
          id: selectedCustomer?.id || '',
          name: custName,
          phone: custPhone,
          email: selectedCustomer?.email || '',
          address: selectedCustomer?.address || '',
          gstin: selectedCustomer?.gstin || '',
          tier: selectedCustomer?.tier || 'REGULAR',
        },
        items: cartItems,
        subTotal: taxableValue,
        cgstTotal: cgst,
        sgstTotal: sgst,
        totalTax: totalTax,
        grandTotal: netPayable,
        paymentMode,
        tenderMode: paymentMode,
        status: paymentMode === 'Credit' ? 'PARTIAL' : 'PAID',
        paidAmount: paymentMode === 'Credit' ? 0 : netPayable,
        balanceDue: paymentMode === 'Credit' ? netPayable : 0,
        notes: discount > 0 ? `${discountLabel}: -₹${discount}` : invoiceNotes,
      };
      localStorage.removeItem(BILLING_SESSION_STORAGE_KEY);
      onInvoiceCreated(localBill);
      setCartItems([]);
      setDiscount(0);
      setSelectedCustomer({ name: '', phone: '', email: '', address: '', gstin: '', tier: 'REGULAR' });
      setViewMode('catalog');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter products by category and search for Catalog view
  const filteredCatalog = mergedCatalog.filter((item) => {
    const matchCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    const matchSearch =
      searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Dynamic categories extracted directly from live MongoDB database products
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    (liveProducts || []).forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [liveProducts]);


  // =========================================================================
  // VIEW 1: DEDICATED NEW BILL PAGE (FULL PAGE VIEW)
  // =========================================================================
  if (viewMode === 'bill') {
    return (
      <div className="space-y-6 animate-in fade-in duration-150">
        {/* Top Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setViewMode('catalog')}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200"
              title="Return to Product Catalog"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  New Tax Invoice
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider border border-blue-200/60">
                  Active POS Bill
                </span>
                {cartItems.length > 0 && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/80"
                    title="Bill session is auto-saved and restored across browser refresh and tab switching"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Session Protected ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                <span>Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span>•</span>
                <span>Invoice: Auto-generated</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (cartItems.length === 0 || window.confirm('Clear all current invoice items and start fresh?')) {
                  localStorage.removeItem(BILLING_SESSION_STORAGE_KEY);
                  setCartItems([]);
                  setDiscount(0);
                  setSelectedCustomer({ name: '', phone: '', email: '', address: '', gstin: '', tier: 'REGULAR' });
                  setTimeout(() => billScanInputRef.current?.focus(), 50);
                }
              }}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Reset Bill
            </button>
            {bills.length > 0 && (
              <button
                type="button"
                onClick={() => setShowRecentBillsModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 rounded-xl transition-colors cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Recent Bills ({bills.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setViewMode('catalog')}
              className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              + Browse Catalog
            </button>
          </div>
        </div>

        {/* Section 1: Customer Details (Every customer data is maintained) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900">Customer Details</h2>
                  {selectedCustomer.id || customerList.some((c) => c.phone === selectedCustomer.phone && selectedCustomer.phone) ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ Registered Customer
                    </span>
                  ) : selectedCustomer.name.trim() ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      ➕ New Customer (Auto-saved)
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] text-slate-500">Every customer's data is maintained and tracked across sales</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {customerList.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedCustomer.name && customerList.some((c) => c.name === selectedCustomer.name) ? selectedCustomer.name : ''}
                    onChange={(e) => {
                      const match = customerList.find((c) => c.name === e.target.value);
                      if (match) setSelectedCustomer(match);
                    }}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-blue-500 cursor-pointer"
                  >
                    <option value="">Search / Pick Registered Customer...</option>
                    {customerList.map((c) => (
                      <option key={c.id || c.phone || c.name} value={c.name}>
                        {c.name} — {c.phone} {c.khataBalance ? `(Due: ₹${c.khataBalance})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {onOpenAddCustomer && (
                <button
                  type="button"
                  onClick={onOpenAddCustomer}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  title="Open Customer Registration Modal"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ New Customer</span>
                </button>
              )}

              {(selectedCustomer.name || selectedCustomer.phone) && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedCustomer({
                      name: '',
                      phone: '',
                      email: '',
                      address: '',
                      gstin: '',
                      tier: 'REGULAR',
                    })
                  }
                  className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  title="Clear Customer Fields"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Customer Input Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={selectedCustomer.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    const matched = customerList.find(
                      (c) => c.name.toLowerCase() === val.toLowerCase().trim()
                    );
                    if (matched) {
                      setSelectedCustomer(matched);
                    } else {
                      setSelectedCustomer((prev) => ({ ...prev, name: val }));
                    }
                  }}
                  placeholder="Enter customer name..."
                  className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={selectedCustomer.phone}
                  onChange={(e) => {
                    const val = e.target.value;
                    const matched = customerList.find((c) => c.phone && c.phone.trim() === val.trim());
                    if (matched) {
                      setSelectedCustomer(matched);
                    } else {
                      setSelectedCustomer((prev) => ({ ...prev, phone: val }));
                    }
                  }}
                  placeholder="e.g. 9840123456"
                  className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          {/* Customer details badges or matched indicators */}
          {selectedCustomer.name && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
              <div className="flex items-center gap-2 flex-wrap">
                {selectedCustomer.tier && (
                  <span className="px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-700">
                    Tier: {selectedCustomer.tier}
                  </span>
                )}
                {typeof selectedCustomer.khataBalance === 'number' && selectedCustomer.khataBalance > 0 && (
                  <span className="px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Khata Due: ₹{selectedCustomer.khataBalance.toLocaleString('en-IN')}
                  </span>
                )}
                {typeof selectedCustomer.lifetimeSales === 'number' && selectedCustomer.lifetimeSales > 0 && (
                  <span className="text-slate-500">
                    Lifetime Purchases: ₹{selectedCustomer.lifetimeSales.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowExtraCustomerFields((prev) => !prev)}
                className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer flex items-center gap-1 text-[11px]"
              >
                <span>{showExtraCustomerFields ? 'Hide' : '+ Add'} Address / GSTIN</span>
                {showExtraCustomerFields ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          )}

          {/* Optional Additional Fields (Address, GSTIN, Email) */}
          {showExtraCustomerFields && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">GSTIN (Optional)</label>
                <input
                  type="text"
                  value={selectedCustomer.gstin || ''}
                  onChange={(e) => setSelectedCustomer((prev) => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                  placeholder="33AAAAA0000A1Z5"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono uppercase focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={selectedCustomer.email || ''}
                  onChange={(e) => setSelectedCustomer((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="customer@example.com"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Address (Optional)</label>
                <input
                  type="text"
                  value={selectedCustomer.address || ''}
                  onChange={(e) => setSelectedCustomer((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="City, Area, Pincode"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Quick Search Product for Bill */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-3">
          <form onSubmit={handleBillScanSubmit} className="relative">
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <Search className="w-5 h-5" />
              </div>
              <div className="relative flex-1">
                <input
                  ref={billScanInputRef}
                  type="text"
                  value={billSearchQuery}
                  onChange={(e) => {
                    setBillSearchQuery(e.target.value);
                    setShowBillSuggestions(true);
                  }}
                  onFocus={() => setShowBillSuggestions(true)}
                  placeholder="Search product name, brand, or model..."
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200/80 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
                {billSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setBillSearchQuery('');
                      setShowBillSuggestions(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer shrink-0"
              >
                + Add Item
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {showBillSuggestions && billSuggestions.length > 0 && (
              <div className="absolute left-10 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 z-30 overflow-hidden divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {billSuggestions.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => {
                      handleAddToCart(product, false);
                      setBillSearchQuery('');
                      setShowBillSuggestions(false);
                    }}
                    className="p-3 hover:bg-blue-50/70 transition-colors cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{product.name}</p>
                      <p className="text-[11px] text-slate-500">{product.subtitle}</p>
                      {product.imeiList && product.imeiList.length > 0 && (
                        <span className="inline-block mt-0.5 text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/60">
                          IMEI: {product.imeiList[0]}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-slate-900 font-sans">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                      <span className="block text-[10px] text-emerald-600 font-bold">
                        Stock: {product.stock}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>

        {/* Section 3: Professional Invoice Items Table (Full Width) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">Invoice Items ({totalItemsCount})</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Taxable: ₹{taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">ITEM DESCRIPTION</th>
                  <th className="py-3 px-3">IMEI / SERIAL</th>
                  <th className="py-3 px-3 text-right">UNIT PRICE</th>
                  <th className="py-3 px-3 text-center">QUANTITY</th>
                  <th className="py-3 px-3 text-right">TAXABLE</th>
                  <th className="py-3 px-3 text-center">GST %</th>
                  <th className="py-3 px-4 text-right">TOTAL (₹)</th>
                  <th className="py-3 px-3 text-center w-16">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cartItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-600 text-sm">Your invoice is empty</p>
                        <p className="text-xs text-slate-400">
                          Search products above or browse catalog to add items.
                        </p>
                        <button
                          type="button"
                          onClick={() => setViewMode('catalog')}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 transition-colors cursor-pointer text-xs"
                        >
                          + Browse Products Catalog
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  cartItems.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 text-xs sm:text-sm">{item.name}</p>
                        <p className="text-[11px] text-slate-500">{item.model}</p>
                      </td>
                      <td className="py-3.5 px-3">
                        {item.imei ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                              {item.imei}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingImeiIndex(index);
                                setTempImei(item.imei || '');
                              }}
                              className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer p-0.5"
                              title="Edit IMEI"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Not tracked</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-semibold text-slate-800">
                        ₹{(item.unitPrice ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(index, -1)}
                            className="px-2.5 py-1 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-3 font-bold text-slate-900 text-xs">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(index, 1)}
                            className="px-2.5 py-1 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-slate-600">
                        ₹{(item.taxableAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {item.gstRate || 18}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 font-mono text-sm whitespace-nowrap">
                        ₹{(item.total ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Item Cards View (md:hidden) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {cartItems.length === 0 ? (
              <div className="py-10 text-center text-slate-400 px-4">
                <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700 text-xs">Your invoice is empty</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Search products or add items from catalog
                </p>
                <button
                  type="button"
                  onClick={() => setViewMode('catalog')}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 font-bold rounded-lg text-xs"
                >
                  + Browse Catalog
                </button>
              </div>
            ) : (
              cartItems.map((item, index) => (
                <div key={index} className="p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 text-xs leading-snug">{item.name}</p>
                      <p className="text-[10px] text-slate-500">{item.model}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {item.imei && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                        IMEI: {item.imei}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingImeiIndex(index);
                          setTempImei(item.imei || '');
                        }}
                        className="text-slate-400 hover:text-blue-600 p-0.5"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    {/* Stepper */}
                    <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(index, -1)}
                        className="px-2.5 py-1 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="px-3 font-bold text-slate-900 text-xs">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(index, 1)}
                        className="px-2.5 py-1 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">
                        ₹{(item.unitPrice ?? 0).toLocaleString('en-IN')} each
                      </span>
                      <span className="font-black text-sm text-slate-900 font-sans">
                        ₹{(item.total ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 4: Payment, Discount & Invoice Financials Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Payment & Notes */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { mode: 'UPI' as const, label: 'UPI / QR', icon: QrCode },
                  { mode: 'Cash' as const, label: 'Cash (₹)', icon: IndianRupee },
                  { mode: 'Card' as const, label: 'Card / POS', icon: CreditCard },
                  { mode: 'Credit' as const, label: 'Credit / Due', icon: Tag },
                ].map(({ mode, label, icon: Icon }) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      paymentMode === mode
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Store Discount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    max={rawSubtotal}
                    value={discount === 0 ? '' : discount}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value) || 0);
                      setDiscount(val);
                      setDiscountLabel(val > 0 ? 'Discount' : 'No Discount');
                    }}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-blue-600 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Bill Remarks / Notes
                </label>
                <input
                  type="text"
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  placeholder="e.g. Counter sale, warranty exchange..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-blue-600 bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Invoice Calculation Card */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
              Invoice Summary
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal ({totalItemsCount} items)</span>
                <span className="font-mono font-semibold text-slate-900">
                  ₹{rawSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Taxable Amount</span>
                <span className="font-mono text-slate-800">
                  ₹{taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>CGST (9%)</span>
                <span className="font-mono text-slate-800">
                  ₹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>SGST (9%)</span>
                <span className="font-mono text-slate-800">
                  ₹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-rose-600 font-semibold">
                  <span>Discount</span>
                  <span className="font-mono">-₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Grand Total
                  </p>
                  <p className="text-[10px] text-slate-400">Inclusive of all taxes</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-black text-blue-600 font-sans tracking-tight">
                    ₹{netPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Print and Save Action */}
            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleGenerateInvoice}
                disabled={submitting || cartItems.length === 0}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 text-sm"
              >
                <Printer className="w-4 h-4" />
                <span>{submitting ? 'Generating Invoice...' : 'Generate & Print Tax Invoice'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* IMEI Edit Modal */}
        {editingImeiIndex !== null && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">Assign / Edit Device IMEI</h4>
                <button
                  type="button"
                  onClick={() => setEditingImeiIndex(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  15-Digit Hardware IMEI Number
                </label>
                <input
                  type="text"
                  value={tempImei}
                  onChange={(e) => setTempImei(e.target.value)}
                  placeholder="e.g. 864219058129381"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono focus:outline-blue-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingImeiIndex(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCartItems((prev) => {
                      const copy = [...prev];
                      copy[editingImeiIndex] = { ...copy[editingImeiIndex], imei: tempImei };
                      return copy;
                    });
                    setEditingImeiIndex(null);
                  }}
                  className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg cursor-pointer"
                >
                  Save IMEI
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: PRODUCT CATALOG VIEW (CLEAN FULL-WIDTH 12 COLS - NO RIGHT BILL FORM)
  // =========================================================================
  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 1. Header with Title & Action Button to Open New Bill Page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Billing POS & Products
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Select items to bill or click 'New Bill' to open the invoice page
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {bills.length > 0 && (
            <button
              type="button"
              onClick={() => setShowRecentBillsModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200/90 shadow-2xs transition-all cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-blue-600" />
              <span>Recent Bills ({bills.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setViewMode('bill');
              setTimeout(() => billScanInputRef.current?.focus(), 80);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm shadow-blue-600/20 transition-all cursor-pointer active:scale-98"
          >
            <Receipt className="w-4 h-4" />
            <span>New Bill</span>
            <span className="bg-blue-700/80 text-blue-100 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide ml-0.5">
              F2
            </span>
            {cartItems.length > 0 && (
              <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} (₹{netPayable.toLocaleString('en-IN')})
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Top Product Search */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-2xs">
        <form onSubmit={handleCatalogScanSubmit} className="flex items-center gap-2">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Search className="w-5 h-5" />
          </div>
          <input
            ref={scanInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name, brand, or model..."
            className="w-full px-4 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200/80 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      {/* 3. Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 4. Full-Width 12-Column Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredCatalog.map((product) => {
          const isOutOfStock = (product.stock ?? 0) <= 0;
          return (
            <div
              key={product.id}
              className={`bg-white rounded-2xl border border-slate-200/90 p-4 transition-all hover:shadow-md hover:border-blue-300 flex flex-col justify-between group ${
                isOutOfStock ? 'opacity-60' : ''
              }`}
            >
              <div>
                {/* Top Badge: Category & Stock */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {product.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isOutOfStock
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {isOutOfStock ? 'Out of stock' : `${product.stock} in stock`}
                  </span>
                </div>

                {/* Product Name & Subtitle */}
                <h3 className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
                  {product.name}
                </h3>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-1 font-medium">
                  {product.subtitle}
                </p>

                {product.type === 'IMEI TRACKED' && (
                  <span className="inline-block mt-2 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                    IMEI Tracked
                  </span>
                )}
              </div>

              {/* Price & Add to Bill Button */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <div>
                  <span className="font-extrabold text-base text-slate-900 font-sans tracking-tight">
                    ₹{(product.price ?? 0).toLocaleString('en-IN')}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-medium">
                    Incl. 18% GST
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => handleAddToCart(product, true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-xs transition-transform active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Bill This</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCatalog.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80">
          <p className="text-slate-500 font-medium text-sm">No products found matching your search</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="mt-2 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Floating Bottom Bar if draft items exist */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 left-3 sm:left-auto z-40 animate-in slide-in-from-bottom-4">
          <button
            type="button"
            onClick={() => {
              setViewMode('bill');
              setTimeout(() => billScanInputRef.current?.focus(), 80);
            }}
            className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3 px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-slate-800 transition-all cursor-pointer font-bold text-xs sm:text-sm border border-slate-700 active:scale-98"
          >
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              <span>Bill ({cartItems.length} items)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-emerald-400">
                ₹{netPayable.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] sm:text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-lg">
                View &rarr;
              </span>
            </div>
          </button>
        </div>
      )}
      {/* 5. Recent Invoices Counter Sales Section */}
      {bills.length > 0 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-sm text-slate-900">Recent Invoices Generated</h2>
              <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
                Live Counter Sales
              </span>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('sales')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>View All in Sales &amp; Bills →</span>
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {bills.slice(0, 5).map((bill) => (
              <div
                key={bill.id}
                className="py-2.5 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-blue-600 text-xs">{bill.invoiceNumber}</span>
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {bill.customer?.name || 'Customer'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {bill.date} {bill.time ? `• ${bill.time}` : ''} • {bill.paymentMode || 'Cash'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold font-sans text-slate-900">
                    ₹{(bill.grandTotal || 0).toLocaleString('en-IN')}
                  </span>
                  {onViewBill && (
                    <button
                      type="button"
                      onClick={() => onViewBill(bill)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] cursor-pointer"
                    >
                      View / Print
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Bills Modal Dialog */}
      {showRecentBillsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Recent Counter Invoices ({bills.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRecentBillsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1 text-xs divide-y divide-slate-100">
              {bills.slice(0, 15).map((b) => (
                <div key={b.id} className="pt-2 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-blue-600">{b.invoiceNumber}</span>
                    <p className="font-bold text-slate-900">{b.customer?.name || 'Customer'}</p>
                    <p className="text-[10px] text-slate-400">
                      {b.date} {b.time ? `• ${b.time}` : ''} • {b.paymentMode || 'Cash'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-sans text-slate-900 text-sm">
                      ₹{(b.grandTotal || 0).toLocaleString('en-IN')}
                    </span>
                    {onViewBill && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowRecentBillsModal(false);
                          onViewBill(b);
                        }}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg text-[11px] cursor-pointer"
                      >
                        Print
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-slate-500">Stored in MongoDB database</span>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => {
                    setShowRecentBillsModal(false);
                    onNavigateTab('sales');
                  }}
                  className="font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Go to Full Sales &amp; Bills Page →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

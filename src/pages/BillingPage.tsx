import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Calendar,
  Smartphone,
  Sparkles,
  Clock,
  Phone,
  Check,
  Percent,
} from 'lucide-react';
import type { Bill, BillItem, Customer, Product, EmiDetails, EmiScheduleItem } from '../types';
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
  discountAmount?: number | '';
  discountPercent?: number | '';
  discountLabel: string;
  paymentMode: 'UPI' | 'Cash' | 'Card' | 'Credit';
  invoiceNotes: string;
  viewMode: 'catalog' | 'bill';
  isEmiEnabled?: boolean;
  emiDownPayment?: number | '';
  emiInterestRate?: number | '';
  emiTenureMonths?: number;
  emiServiceCharge?: number | '';
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

  // Customer searchable picker state (Name or Phone number live filter)
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Close customer dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter / Shortlist registered customers by customer name OR mobile number
  const filteredCustomerList = useMemo(() => {
    const q = customerSearchQuery.trim().toLowerCase();
    if (!q) return customerList;
    const cleanQ = q.replace(/\D/g, '');
    return customerList.filter((c) => {
      const nameMatch = (c.name || '').toLowerCase().includes(q);
      const phoneRaw = (c.phone || '').toLowerCase();
      const phoneDigits = (c.phone || '').replace(/\D/g, '');
      const phoneMatch =
        phoneRaw.includes(q) || (cleanQ.length > 0 && phoneDigits.includes(cleanQ));
      return nameMatch || phoneMatch;
    });
  }, [customerList, customerSearchQuery]);

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

  // Financial Discount & Special Percentage Discount (restored from persistent session)
  const [discountAmount, setDiscountAmount] = useState<number | ''>(() => {
    if (typeof initialDraft.discountAmount === 'number' || initialDraft.discountAmount === '') {
      return initialDraft.discountAmount;
    }
    return typeof initialDraft.discount === 'number' && initialDraft.discount > 0 ? initialDraft.discount : '';
  });
  const [discountPercent, setDiscountPercent] = useState<number | ''>(() => {
    return typeof initialDraft.discountPercent === 'number' ? initialDraft.discountPercent : '';
  });
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Cash' | 'Card' | 'Credit'>(() => {
    return initialDraft.paymentMode || 'UPI';
  });
  const [invoiceNotes, setInvoiceNotes] = useState<string>(() => {
    return initialDraft.invoiceNotes || 'Counter POS Sale';
  });
  const [submitting, setSubmitting] = useState(false);

  // Credit & Phone EMI Installment state (Active specifically when paymentMode === 'Credit')
  const [isEmiEnabled, setIsEmiEnabled] = useState<boolean>(() => {
    return typeof initialDraft.isEmiEnabled === 'boolean' ? initialDraft.isEmiEnabled : true;
  });
  const [emiDownPayment, setEmiDownPayment] = useState<number | ''>(() => {
    return initialDraft.emiDownPayment !== undefined ? initialDraft.emiDownPayment : '';
  });
  const [emiInterestRate, setEmiInterestRate] = useState<number | ''>(() => {
    return initialDraft.emiInterestRate !== undefined ? initialDraft.emiInterestRate : 5;
  });
  const [emiTenureMonths, setEmiTenureMonths] = useState<number>(() => {
    return typeof initialDraft.emiTenureMonths === 'number' ? initialDraft.emiTenureMonths : 6;
  });
  const [emiServiceCharge, setEmiServiceCharge] = useState<number | ''>(() => {
    return initialDraft.emiServiceCharge !== undefined ? initialDraft.emiServiceCharge : '';
  });
  const [customTenureInput, setCustomTenureInput] = useState<string>('');
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);

  // Financial calculations
  const rawSubtotal = cartItems.reduce((acc, item) => acc + item.total, 0);
  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Discount calculations (Flat Store Discount ₹ + Special Discount % with decimal support)
  const flatDiscountNum = Math.max(0, typeof discountAmount === 'number' ? discountAmount : Number(discountAmount) || 0);
  const discountPercentNum = Math.max(0, typeof discountPercent === 'number' ? discountPercent : Number(discountPercent) || 0);
  const percentDiscountAmount = Number(((rawSubtotal * discountPercentNum) / 100).toFixed(2));
  const totalDiscount = Math.min(rawSubtotal, Number((flatDiscountNum + percentDiscountAmount).toFixed(2)));

  const discountLabelText = useMemo(() => {
    if (flatDiscountNum > 0 && discountPercentNum > 0) {
      return `Store Discount (₹${flatDiscountNum}) + Special Discount (${discountPercentNum}%)`;
    }
    if (discountPercentNum > 0) {
      return `Special Discount (${discountPercentNum}%)`;
    }
    if (flatDiscountNum > 0) {
      return 'Store Discount';
    }
    return 'Discount';
  }, [flatDiscountNum, discountPercentNum]);

  const netPayable = Math.max(0, Number((rawSubtotal - totalDiscount).toFixed(2)));

  // Persist Billing Session across page refreshes, tab switching, and browser restart
  useEffect(() => {
    try {
      const sessionData: BillingDraftSession = {
        cartItems,
        selectedCustomer,
        discount: totalDiscount,
        discountAmount,
        discountPercent,
        discountLabel: discountLabelText,
        paymentMode,
        invoiceNotes,
        viewMode,
        isEmiEnabled,
        emiDownPayment,
        emiInterestRate,
        emiTenureMonths,
        emiServiceCharge,
        savedAt: Date.now(),
      };
      localStorage.setItem(BILLING_SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    } catch (err) {
      console.warn('Failed to save billing session:', err);
    }
  }, [
    cartItems,
    selectedCustomer,
    discountAmount,
    discountPercent,
    totalDiscount,
    discountLabelText,
    paymentMode,
    invoiceNotes,
    viewMode,
    isEmiEnabled,
    emiDownPayment,
    emiInterestRate,
    emiTenureMonths,
    emiServiceCharge,
  ]);

  // Synchronize across multiple browser tabs automatically
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === BILLING_SESSION_STORAGE_KEY) {
        if (!e.newValue) {
          setCartItems([]);
          setDiscountAmount('');
          setDiscountPercent('');
          setSelectedCustomer({ name: '', phone: '', email: '', address: '', gstin: '', tier: 'REGULAR' });
          return;
        }
        try {
          const parsed: BillingDraftSession = JSON.parse(e.newValue);
          if (Array.isArray(parsed.cartItems)) setCartItems(parsed.cartItems);
          if (parsed.selectedCustomer) setSelectedCustomer(parsed.selectedCustomer);
          if (parsed.discountAmount !== undefined) setDiscountAmount(parsed.discountAmount);
          if (parsed.discountPercent !== undefined) setDiscountPercent(parsed.discountPercent);
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

  // Reverse GST for the net total (18% GST standard)
  const taxableValue = Number((netPayable / 1.18).toFixed(2));
  const totalTax = Number((netPayable - taxableValue).toFixed(2));
  const cgst = Number((totalTax / 2).toFixed(2));
  const sgst = Number((totalTax / 2).toFixed(2));

  // Detect primary phone / mobile item in cart to customize EMI model & recommended tenure
  const primaryPhoneItem = useMemo(() => {
    return (
      cartItems.find(
        (it) =>
          it.imei ||
          (it.model && it.model.trim()) ||
          /phone|galaxy|redmi|realme|vivo|oppo|oneplus|apple|iphone|iqoo|motorola|nord|pixel/i.test(it.name)
      ) || cartItems[0]
    );
  }, [cartItems]);

  const detectedModelName = primaryPhoneItem?.model || primaryPhoneItem?.name || 'Mobile Phone';

  // Smart tenure recommendation when cart phone changes
  useEffect(() => {
    if (primaryPhoneItem?.unitPrice && initialDraft.emiTenureMonths === undefined) {
      const p = primaryPhoneItem.unitPrice;
      if (p >= 45000) {
        setEmiTenureMonths(12);
      } else if (p >= 15000) {
        setEmiTenureMonths(6);
      } else {
        setEmiTenureMonths(3);
      }
    }
  }, [primaryPhoneItem?.name, primaryPhoneItem?.unitPrice]);

  // EMI Financial Calculations (Active strictly when paymentMode === 'Credit' && isEmiEnabled)
  const isCreditEmi = paymentMode === 'Credit' && isEmiEnabled;
  const downPaymentNum = isCreditEmi
    ? Math.min(netPayable, Math.max(0, typeof emiDownPayment === 'number' ? emiDownPayment : Number(emiDownPayment) || 0))
    : 0;
  const principalDue = Math.max(0, netPayable - downPaymentNum);
  const interestRateNum = isCreditEmi
    ? Math.max(0, typeof emiInterestRate === 'number' ? emiInterestRate : Number(emiInterestRate) || 0)
    : 0;
  const interestAmount = Number(((principalDue * interestRateNum) / 100).toFixed(2));
  const serviceChargeNum = isCreditEmi
    ? Math.max(0, typeof emiServiceCharge === 'number' ? emiServiceCharge : Number(emiServiceCharge) || 0)
    : 0;
  const totalFinancedAmount = Number((principalDue + interestAmount + serviceChargeNum).toFixed(2));
  const tenureMonthsNum = Math.max(1, emiTenureMonths || 6);
  const monthlyEmi = Number((totalFinancedAmount / tenureMonthsNum).toFixed(2));

  // Auto compute first due date (30 days from today)
  const firstDueDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  }, []);

  // Compute monthly EMI installment schedule
  const emiSchedule = useMemo(() => {
    const schedule = [];
    const baseDate = new Date();
    for (let i = 1; i <= tenureMonthsNum; i++) {
      const dueDateObj = new Date(baseDate);
      dueDateObj.setMonth(dueDateObj.getMonth() + i);
      schedule.push({
        installmentNo: i,
        dueDate: dueDateObj.toISOString().slice(0, 10),
        amount: monthlyEmi,
        status: 'PENDING' as const,
      });
    }
    return schedule;
  }, [tenureMonthsNum, monthlyEmi]);

  const finalGrandTotal = isCreditEmi ? netPayable + interestAmount + serviceChargeNum : netPayable;
  const finalPaidAmount = isCreditEmi ? downPaymentNum : paymentMode === 'Credit' ? 0 : netPayable;
  const finalBalanceDue = isCreditEmi ? totalFinancedAmount : paymentMode === 'Credit' ? netPayable : 0;

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

    if (custPhone.replace(/\D/g, '').length !== 10) {
      alert('Please enter a valid 10-digit Customer Mobile Number.');
      return;
    }

    setSubmitting(true);
    try {
      const emiPayload: EmiDetails | undefined = isCreditEmi
        ? {
            isEmi: true,
            modelName: detectedModelName,
            downPayment: downPaymentNum,
            principalAmount: principalDue,
            interestRate: interestRateNum,
            interestAmount,
            tenureMonths: tenureMonthsNum,
            serviceCharge: serviceChargeNum,
            monthlyEmi,
            totalFinancedAmount,
            firstDueDate,
            emiSchedule,
          }
        : undefined;

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
        paidAmount: finalPaidAmount,
        balanceDue: finalBalanceDue,
        dueDate: isCreditEmi ? firstDueDate : '',
        status: finalBalanceDue > 0 ? 'PARTIAL' : 'PAID',
        emiDetails: emiPayload,
        discount: totalDiscount,
        discountPercent: discountPercentNum > 0 ? discountPercentNum : 0,
        notes: isCreditEmi
          ? `Phone EMI (${detectedModelName}): ₹${downPaymentNum.toLocaleString('en-IN')} Initial Paid | ₹${principalDue.toLocaleString('en-IN')} Financed @ ${interestRateNum}% Int (${tenureMonthsNum}M @ ₹${monthlyEmi.toLocaleString('en-IN')}/mo)`
          : totalDiscount > 0
          ? `${discountLabelText}: -₹${totalDiscount.toFixed(2)}`
          : invoiceNotes,
      };

      const res = await api.createBill(billData);
      if (res && res.success && res.bill) {
        localStorage.removeItem(BILLING_SESSION_STORAGE_KEY);
        onInvoiceCreated(res.bill);
        setCartItems([]);
        setDiscountAmount('');
        setDiscountPercent('');
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
        grandTotal: finalGrandTotal,
        paymentMode,
        tenderMode: paymentMode,
        status: finalBalanceDue > 0 ? 'PARTIAL' : 'PAID',
        paidAmount: finalPaidAmount,
        balanceDue: finalBalanceDue,
        dueDate: isCreditEmi ? firstDueDate : '',
        emiDetails: isCreditEmi
          ? {
              isEmi: true,
              modelName: detectedModelName,
              downPayment: downPaymentNum,
              principalAmount: principalDue,
              interestRate: interestRateNum,
              interestAmount,
              tenureMonths: tenureMonthsNum,
              serviceCharge: serviceChargeNum,
              monthlyEmi,
              totalFinancedAmount,
              firstDueDate,
              emiSchedule,
            }
          : undefined,
        discount: totalDiscount,
        discountPercent: discountPercentNum > 0 ? discountPercentNum : 0,
        notes: isCreditEmi
          ? `Phone EMI (${detectedModelName}): ₹${downPaymentNum.toLocaleString('en-IN')} Initial Paid | ₹${principalDue.toLocaleString('en-IN')} Financed @ ${interestRateNum}% Int (${tenureMonthsNum}M @ ₹${monthlyEmi.toLocaleString('en-IN')}/mo)`
          : totalDiscount > 0
          ? `${discountLabelText}: -₹${totalDiscount.toFixed(2)}`
          : invoiceNotes,
      };
      localStorage.removeItem(BILLING_SESSION_STORAGE_KEY);
      onInvoiceCreated(localBill);
      setCartItems([]);
      setDiscountAmount('');
      setDiscountPercent('');
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

  // EMI Repayment Schedule Preview Modal (shared across VIEW 1 New Bill & VIEW 2 Catalog)
  const renderEmiScheduleModal = () => {
    if (!showScheduleModal) return null;
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-amber-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  EMI Repayment Schedule ({tenureMonthsNum} Months)
                </h3>
                <p className="text-[11px] text-slate-500">
                  {detectedModelName} • ₹{monthlyEmi.toLocaleString('en-IN')}/month
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowScheduleModal(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-semibold">Total Financed</span>
              <span className="font-black text-slate-900 font-mono">₹{totalFinancedAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-semibold">Monthly EMI</span>
              <span className="font-black text-blue-700 font-mono">₹{monthlyEmi.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-semibold">Interest Rate</span>
              <span className="font-black text-amber-700 font-mono">{interestRateNum}% Flat</span>
            </div>
          </div>

          <div className="p-4 overflow-y-auto space-y-2 flex-1 text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase">
                  <th className="pb-2 text-center w-12">#</th>
                  <th className="pb-2">Due Date</th>
                  <th className="pb-2 text-right">Installment Amount</th>
                  <th className="pb-2 text-center w-24">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {emiSchedule.map((item: EmiScheduleItem) => (
                  <tr key={item.installmentNo} className="hover:bg-slate-50/70">
                    <td className="py-2.5 text-center font-bold text-slate-700">
                      M{item.installmentNo}
                    </td>
                    <td className="py-2.5 text-slate-800 font-medium">
                      {item.dueDate}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                      ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Pending
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">Installments collected via Customers Ledger</span>
            <button
              type="button"
              onClick={() => setShowScheduleModal(false)}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
            >
              Close Schedule
            </button>
          </div>
        </div>
      </div>
    );
  };


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
                  setDiscountAmount('');
                  setDiscountPercent('');
                  setSelectedCustomer({ name: '', phone: '', email: '', address: '', gstin: '', tier: 'REGULAR' });
                  setCustomerSearchQuery('');
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

            {/* Quick Actions & Searchable Customer Combobox */}
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              {/* Interactive Search / Pick Customer Combobox */}
              <div className="relative w-full sm:w-auto" ref={customerDropdownRef}>
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={customerSearchQuery}
                    onChange={(e) => {
                      setCustomerSearchQuery(e.target.value);
                      setIsCustomerDropdownOpen(true);
                    }}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    placeholder={
                      selectedCustomer.name
                        ? `${selectedCustomer.name} (${selectedCustomer.phone || 'No phone'})`
                        : 'Search / Pick customer (Name or Mobile)...'
                    }
                    className={`w-full sm:w-80 pl-8.5 pr-8 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border rounded-xl text-xs font-semibold text-slate-800 transition-all shadow-2xs ${
                      isCustomerDropdownOpen
                        ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white'
                        : selectedCustomer.name && (selectedCustomer.id || customerList.some((c) => c.phone === selectedCustomer.phone && selectedCustomer.phone))
                        ? 'border-emerald-300 bg-emerald-50/40 text-emerald-900'
                        : 'border-slate-200'
                    }`}
                  />
                  {customerSearchQuery ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCustomerSearchQuery('');
                      }}
                      className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsCustomerDropdownOpen((prev) => !prev)}
                      className="absolute right-2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Toggle customer list"
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-150 ${
                          isCustomerDropdownOpen ? 'rotate-180 text-blue-600' : ''
                        }`}
                      />
                    </button>
                  )}
                </div>

                {/* Dropdown Menu - Shortlisted by Name or Phone */}
                {isCustomerDropdownOpen && (
                  <div className="absolute left-0 right-0 sm:right-auto sm:left-0 mt-1.5 w-full sm:w-96 max-h-80 overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-3 bg-slate-50/90 sticky top-0 z-10 border-b border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-bold text-slate-700">
                          {customerSearchQuery
                            ? `Shortlisted Customers (${filteredCustomerList.length})`
                            : `All Registered Customers (${customerList.length})`}
                        </span>
                      </div>
                      {customerSearchQuery && (
                        <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                          "{customerSearchQuery}"
                        </span>
                      )}
                    </div>

                    {filteredCustomerList.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {filteredCustomerList.map((c) => {
                          const isSelected =
                            (selectedCustomer.id && c.id && selectedCustomer.id === c.id) ||
                            (selectedCustomer.phone && c.phone && selectedCustomer.phone === c.phone) ||
                            (selectedCustomer.name && c.name && selectedCustomer.name.toLowerCase() === c.name.toLowerCase());
                          return (
                            <button
                              key={c.id || c.phone || c.name}
                              type="button"
                              onClick={() => {
                                setSelectedCustomer(c);
                                setCustomerSearchQuery('');
                                setIsCustomerDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                                isSelected ? 'bg-blue-50/90 text-blue-900 font-medium' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-slate-900 truncate">
                                    {c.name}
                                  </span>
                                  {c.tier && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-slate-100 text-slate-600">
                                      {c.tier}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-mono">
                                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{c.phone || 'No phone'}</span>
                                  {c.address && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate max-w-[120px] text-slate-400">{c.address}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                {typeof c.khataBalance === 'number' && c.khataBalance > 0 ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 block font-mono">
                                    Due: ₹{c.khataBalance.toLocaleString('en-IN')}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium text-emerald-600 block">
                                    No Due
                                  </span>
                                )}
                                {isSelected && (
                                  <span className="text-[10px] font-bold text-blue-600 flex items-center justify-end gap-1 mt-0.5">
                                    <Check className="w-3 h-3" /> Selected
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center space-y-2">
                        <p className="text-xs text-slate-600 font-medium">
                          No registered customer matching <span className="font-bold text-slate-900">"{customerSearchQuery}"</span>
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Type customer details directly in the fields below or click to register.
                        </p>
                        {onOpenAddCustomer && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomerDropdownOpen(false);
                              onOpenAddCustomer();
                            }}
                            className="mt-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>+ Register New Customer</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

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
                  onClick={() => {
                    setSelectedCustomer({
                      name: '',
                      phone: '',
                      email: '',
                      address: '',
                      gstin: '',
                      tier: 'REGULAR',
                    });
                    setCustomerSearchQuery('');
                  }}
                  className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  title="Clear Customer Fields"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Customer Input Fields with Autocomplete Datalist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="registered-customer-names"
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
                <datalist id="registered-customer-names">
                  {customerList.map((c) => (
                    <option key={`name-${c.id || c.phone || c.name}`} value={c.name}>
                      {c.phone} {c.khataBalance ? `(Due: ₹${c.khataBalance})` : ''}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  maxLength={10}
                  list="registered-customer-phones"
                  value={selectedCustomer.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    const matched = customerList.find((c) => c.phone && c.phone.trim() === val.trim());
                    if (matched) {
                      setSelectedCustomer(matched);
                    } else {
                      setSelectedCustomer((prev) => ({ ...prev, phone: val }));
                    }
                  }}
                  placeholder="e.g. 9840123456 (10 digits)"
                  className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <datalist id="registered-customer-phones">
                  {customerList.map((c) => (
                    <option key={`phone-${c.id || c.phone || c.name}`} value={c.phone}>
                      {c.name} {c.khataBalance ? `(Due: ₹${c.khataBalance})` : ''}
                    </option>
                  ))}
                </datalist>
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
                    <div className="inline-flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(index, -1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="px-3.5 font-bold text-slate-900 text-xs min-w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(index, 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
                        aria-label="Increase quantity"
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

            {/* Credit / EMI Installment Option - ONLY visible when paymentMode === 'Credit' */}
            {paymentMode === 'Credit' && (
              <div className="p-4 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-amber-50/80 rounded-2xl border border-amber-200/90 shadow-2xs space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Header with EMI Toggle */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-amber-200/60">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                          Phone EMI &amp; Credit Installment Option
                        </h4>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                          Credit Sale
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Setup initial down payment, interest rate % and tenure months for <strong className="text-slate-900">{detectedModelName}</strong>
                      </p>
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-2 cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={isEmiEnabled}
                      onChange={(e) => setIsEmiEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600 relative"></div>
                    <span className="text-xs font-bold text-slate-800">
                      {isEmiEnabled ? 'EMI Plan Active' : 'Full Due'}
                    </span>
                  </label>
                </div>

                {isEmiEnabled ? (
                  <div className="space-y-3.5 pt-1">
                    {/* Device Model Banner */}
                    <div className="bg-white/90 border border-amber-200/70 rounded-xl px-3.5 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-xs text-slate-600 font-medium">Billed Device:</span>
                        <strong className="text-xs font-bold text-slate-900">{detectedModelName}</strong>
                      </div>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                        Phone Value: ₹{netPayable.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Row 1: Initial Cost (Down Payment) & Interest Rate */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Initial Down Payment */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <span>Initial Down Payment (₹)</span>
                            <span className="text-rose-600">*</span>
                          </label>
                          <span className="text-[10px] font-semibold text-emerald-700">
                            Paid Today at Counter
                          </span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            max={netPayable}
                            value={emiDownPayment === '' ? '' : emiDownPayment}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : Number(e.target.value);
                              setEmiDownPayment(val);
                            }}
                            placeholder="e.g. 7000"
                            className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-amber-600 bg-white"
                          />
                        </div>
                        {/* Down payment presets */}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <button
                            type="button"
                            onClick={() => setEmiDownPayment(0)}
                            className="px-2 py-0.5 text-[10px] font-semibold text-slate-600 bg-white hover:bg-amber-100/50 border border-slate-200 rounded cursor-pointer"
                          >
                            ₹0 (Zero Down)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEmiDownPayment(Math.round(netPayable * 0.25))}
                            className="px-2 py-0.5 text-[10px] font-semibold text-slate-600 bg-white hover:bg-amber-100/50 border border-slate-200 rounded cursor-pointer"
                          >
                            25% (₹{Math.round(netPayable * 0.25).toLocaleString('en-IN')})
                          </button>
                          <button
                            type="button"
                            onClick={() => setEmiDownPayment(Math.round(netPayable * 0.3))}
                            className="px-2 py-0.5 text-[10px] font-semibold text-slate-600 bg-white hover:bg-amber-100/50 border border-slate-200 rounded cursor-pointer"
                          >
                            30% (₹{Math.round(netPayable * 0.3).toLocaleString('en-IN')})
                          </button>
                          <button
                            type="button"
                            onClick={() => setEmiDownPayment(Math.round(netPayable * 0.5))}
                            className="px-2 py-0.5 text-[10px] font-semibold text-slate-600 bg-white hover:bg-amber-100/50 border border-slate-200 rounded cursor-pointer"
                          >
                            50%
                          </button>
                        </div>
                      </div>

                      {/* Interest Rate on Balance */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <span>Interest Rate (%)</span>
                          </label>
                          <span className="text-[10px] font-semibold text-amber-700">
                            + ₹{interestAmount.toLocaleString('en-IN')} Interest
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={emiInterestRate === '' ? '' : emiInterestRate}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : Number(e.target.value);
                              setEmiInterestRate(val);
                            }}
                            placeholder="e.g. 5"
                            className="w-full px-3 py-2 pr-7 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-amber-600 bg-white"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                            %
                          </span>
                        </div>
                        {/* Interest presets */}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {[0, 2, 3, 5, 8, 10].map((rate) => (
                            <button
                              key={rate}
                              type="button"
                              onClick={() => setEmiInterestRate(rate)}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded border cursor-pointer ${
                                emiInterestRate === rate
                                  ? 'bg-amber-600 text-white border-amber-600'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-100/50'
                              }`}
                            >
                              {rate === 0 ? '0% Int' : `${rate}%`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Installment Duration (Tenure Months) & Optional Service Charges */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Installment Months */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Installment Duration (Tenure)
                        </label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[3, 6, 9, 10, 12, 18, 24].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setEmiTenureMonths(m);
                                setCustomTenureInput('');
                              }}
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                                emiTenureMonths === m && !customTenureInput
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {m}M
                            </button>
                          ))}
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              max="60"
                              placeholder="Other"
                              value={customTenureInput}
                              onChange={(e) => {
                                setCustomTenureInput(e.target.value);
                                const num = parseInt(e.target.value, 10);
                                if (num > 0) setEmiTenureMonths(num);
                              }}
                              className="w-14 px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-center bg-white focus:outline-blue-600"
                            />
                            <span className="text-[10px] text-slate-500 font-semibold">Mo</span>
                          </div>
                        </div>
                      </div>

                      {/* Optional Service / Processing Charge */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-800">
                            Service / File Fee (Optional ₹)
                          </label>
                          <span className="text-[10px] text-slate-500">Documentation</span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={emiServiceCharge === '' ? '' : emiServiceCharge}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : Number(e.target.value);
                              setEmiServiceCharge(val);
                            }}
                            placeholder="0 (Free)"
                            className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-amber-600 bg-white"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {[0, 250, 500, 999].map((fee) => (
                            <button
                              key={fee}
                              type="button"
                              onClick={() => setEmiServiceCharge(fee === 0 ? '' : fee)}
                              className="px-2 py-0.5 text-[10px] font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded cursor-pointer"
                            >
                              {fee === 0 ? '₹0' : `₹${fee}`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Live EMI Calculation Summary Card */}
                    <div className="bg-white rounded-xl p-3 border border-amber-200 shadow-2xs space-y-2.5">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center divide-x divide-slate-100">
                        <div className="p-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Down Payment</p>
                          <p className="text-xs sm:text-sm font-extrabold text-emerald-700 font-mono mt-0.5">
                            ₹{downPaymentNum.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className="p-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Principal Financed</p>
                          <p className="text-xs sm:text-sm font-extrabold text-slate-800 font-mono mt-0.5">
                            ₹{principalDue.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className="p-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Interest + Fee</p>
                          <p className="text-xs sm:text-sm font-extrabold text-amber-700 font-mono mt-0.5">
                            +₹{(interestAmount + serviceChargeNum).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className="p-1 bg-amber-50/60 rounded-lg">
                          <p className="text-[10px] font-black text-amber-800 uppercase tracking-tight">Monthly EMI</p>
                          <p className="text-sm sm:text-base font-black text-blue-700 font-mono">
                            ₹{monthlyEmi.toLocaleString('en-IN')}<span className="text-[10px] font-normal text-slate-500">/mo</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>Tenure: <strong>{tenureMonthsNum} Months</strong> • 1st Due: <strong>{firstDueDate}</strong></span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowScheduleModal(true)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>View {tenureMonthsNum}-Month Schedule</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2 text-xs text-amber-800 bg-amber-100/50 rounded-lg">
                    Full amount ₹{netPayable.toLocaleString('en-IN')} will be recorded as standard lump-sum Khata Credit Due without monthly EMI breakdown.
                  </div>
                )}
              </div>
            )}

            {/* Section 4: Discounts (Flat ₹ & Special % with decimal support) & Bill Remarks */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  <span>Invoice Discounts &amp; Special Concession</span>
                </span>
                {totalDiscount > 0 && (
                  <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 font-mono">
                    Total: -₹{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Flat Store Discount in Rupees */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Store Discount (₹ Flat)
                    </label>
                    <span className="text-[10px] text-slate-400">Rupees</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      max={rawSubtotal}
                      step="any"
                      value={discountAmount === '' ? '' : discountAmount}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
                        setDiscountAmount(val);
                      }}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-blue-600 bg-slate-50/50"
                    />
                  </div>
                  {/* Quick rupee chips */}
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {[50, 100, 200, 500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDiscountAmount(amt)}
                        className={`px-1.5 py-0.5 text-[10px] rounded border font-mono cursor-pointer transition-colors ${
                          discountAmount === amt
                            ? 'bg-blue-600 text-white border-blue-600 font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                    {discountAmount !== '' && (
                      <button
                        type="button"
                        onClick={() => setDiscountAmount('')}
                        className="px-1.5 py-0.5 text-[10px] rounded border border-slate-200 text-slate-400 hover:text-slate-600 bg-white cursor-pointer"
                        title="Clear flat discount"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Special Discount in Percentage (Decimals Allowed) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <Percent className="w-3 h-3 text-purple-600" />
                      <span>Special Discount (% Percentage)</span>
                    </label>
                    {discountPercentNum > 0 && (
                      <span className="text-[10px] font-bold text-rose-600 font-mono">
                        = -₹{percentDiscountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={discountPercent === '' ? '' : discountPercent}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Math.min(100, Math.max(0, Number(e.target.value)));
                        setDiscountPercent(val);
                      }}
                      placeholder="e.g. 5 or 2.5"
                      className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-blue-600 bg-slate-50/50"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs pointer-events-none">
                      %
                    </span>
                  </div>
                  {/* Quick percentage chips (decimal supported) */}
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {[2, 3, 5, 7.5, 10].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setDiscountPercent(pct)}
                        className={`px-1.5 py-0.5 text-[10px] rounded border font-mono cursor-pointer transition-colors ${
                          discountPercent === pct
                            ? 'bg-purple-600 text-white border-purple-600 font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                    {discountPercent !== '' && (
                      <button
                        type="button"
                        onClick={() => setDiscountPercent('')}
                        className="px-1.5 py-0.5 text-[10px] rounded border border-slate-200 text-slate-400 hover:text-slate-600 bg-white cursor-pointer"
                        title="Clear percentage discount"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Bill Remarks / Notes */}
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
              {totalDiscount > 0 && (
                <div className="bg-rose-50/80 p-2 rounded-xl border border-rose-200/60 space-y-0.5">
                  <div className="flex items-center justify-between text-rose-700 font-bold">
                    <span>Discount Applied</span>
                    <span className="font-mono">-₹{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10.5px] text-rose-600">
                    <span>Breakdown:</span>
                    <span className="font-mono">
                      {flatDiscountNum > 0 && `Flat: ₹${flatDiscountNum.toLocaleString('en-IN')}`}
                      {flatDiscountNum > 0 && discountPercentNum > 0 && ' + '}
                      {discountPercentNum > 0 && `${discountPercentNum}%: ₹${percentDiscountAmount.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                </div>
              )}

              {/* If Credit with EMI active, display EMI breakdown items */}
              {isCreditEmi && (
                <div className="border-t border-dashed border-amber-200 pt-2 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-emerald-700 font-semibold">
                    <span>Initial Down Payment (Paid Today)</span>
                    <span className="font-mono">-₹{downPaymentNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Principal Balance Due</span>
                    <span className="font-mono">₹{principalDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {interestRateNum > 0 && (
                    <div className="flex items-center justify-between text-amber-800">
                      <span>Interest ({interestRateNum}%)</span>
                      <span className="font-mono">+₹{interestAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {serviceChargeNum > 0 && (
                    <div className="flex items-center justify-between text-amber-800">
                      <span>Service / Documentation Fee</span>
                      <span className="font-mono">+₹{serviceChargeNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between font-bold text-blue-700 bg-blue-50/70 p-1.5 rounded-lg border border-blue-100">
                    <span>Monthly EMI ({tenureMonthsNum} Months)</span>
                    <span className="font-mono">₹{monthlyEmi.toLocaleString('en-IN', { minimumFractionDigits: 2 })} / mo</span>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    {isCreditEmi ? 'Total Customer Cost' : 'Grand Total'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {isCreditEmi
                      ? `₹${downPaymentNum.toLocaleString('en-IN')} initial + ₹${totalFinancedAmount.toLocaleString('en-IN')} financed`
                      : 'Inclusive of all taxes'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-black text-blue-600 font-sans tracking-tight">
                    ₹{finalGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 text-xs sm:text-sm"
              >
                <Printer className="w-4 h-4" />
                <span>
                  {submitting
                    ? 'Generating Invoice...'
                    : isCreditEmi
                    ? `Create EMI Invoice (₹${downPaymentNum.toLocaleString('en-IN')} Paid + ₹${totalFinancedAmount.toLocaleString('en-IN')} Due)`
                    : 'Generate & Print Tax Invoice'}
                </span>
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

        {/* EMI Repayment Schedule Preview Modal */}
        {renderEmiScheduleModal()}
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

      {/* Mobile Floating Bottom Bar for Active Cart */}
      {cartItems.length > 0 && (
        <div className="lg:hidden fixed bottom-[max(4.25rem,calc(env(safe-area-inset-bottom)+3.75rem))] left-3 right-3 z-30 animate-in slide-in-from-bottom-2 duration-200">
          <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3 shadow-2xl flex items-center justify-between border border-slate-700/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xs shadow-xs">
                {cartItems.length}
              </div>
              <div>
                <p className="text-xs font-bold leading-tight font-sans">
                  ₹{netPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-slate-300">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in bill
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setViewMode('bill');
                setTimeout(() => billScanInputRef.current?.focus(), 80);
              }}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <span>View Bill</span>
              <Receipt className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* EMI Repayment Schedule Preview Modal */}
      {renderEmiScheduleModal()}
    </div>
  );
};

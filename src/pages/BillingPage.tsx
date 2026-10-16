import React, { useState, useEffect, useRef } from 'react';
import {
  Scan,
  Plus,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Edit2,
  Tag,
  Printer,
  Clock,
  Smartphone,
  Headphones,
  Watch,
  Shield,
  X,
} from 'lucide-react';
import type { Bill, BillItem, Customer, Product } from '../types';
import { api } from '../services/api';

interface BillingPageProps {
  products: Product[];
  onInvoiceCreated: (bill: Bill) => void;
  onOpenAddCustomer?: () => void;
}

interface PosProduct {
  id: string;
  name: string;
  subtitle: string;
  category: 'Smartphones' | 'Chargers & Cables' | 'Audio & Earbuds' | 'Cases & Covers' | 'Tempered Glass';
  price: number;
  stock: number;
  hsn: string;
  gstRate: number;
  type: 'IMEI TRACKED' | 'BARCODE';
  image?: string;
  icon?: 'phone' | 'charger' | 'audio' | 'watch' | 'glass';
  imeiList?: string[];
}

export const BillingPage: React.FC<BillingPageProps> = ({
  products: serverProducts,
  onInvoiceCreated,
  onOpenAddCustomer,
}) => {
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Default product catalog matching screenshot
  const defaultCatalog: PosProduct[] = [
    {
      id: 'pos-1',
      name: 'Redmi Note 13 5G',
      subtitle: '8GB/256GB - Prism Gold • HSN: 8517',
      category: 'Smartphones',
      price: 17999,
      stock: 8,
      hsn: '8517',
      gstRate: 18,
      type: 'IMEI TRACKED',
      image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300&auto=format&fit=crop&q=80',
      imeiList: ['864219058129381', '864219058129382', '864219058129383'],
    },
    {
      id: 'pos-2',
      name: 'Samsung Galaxy M34 5G',
      subtitle: '6GB/128GB - Waterfall Blue • HSN: 8517',
      category: 'Smartphones',
      price: 14499,
      stock: 8,
      hsn: '8517',
      gstRate: 18,
      type: 'IMEI TRACKED',
      image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=300&auto=format&fit=crop&q=80',
      imeiList: ['359124089123456', '359124089123457'],
    },
    {
      id: 'pos-3',
      name: 'Apple 20W USB-C Power Adapter',
      subtitle: 'Original Box Pack • HSN: 8504',
      category: 'Chargers & Cables',
      price: 1899,
      stock: 18,
      hsn: '8504',
      gstRate: 18,
      type: 'BARCODE',
      image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&auto=format&fit=crop&q=80',
    },
    {
      id: 'pos-4',
      name: 'boAt Rockerz 255 Pro+ Neckband',
      subtitle: 'Active Black • Fast Charge • BT 5.2',
      category: 'Audio & Earbuds',
      price: 1299,
      stock: 12,
      hsn: '8518',
      gstRate: 18,
      type: 'BARCODE',
      icon: 'audio',
    },
    {
      id: 'pos-5',
      name: 'Noise ColorFit Pulse 2 Max',
      subtitle: '1.85" Display • BT Calling • Jet Black',
      category: 'Cases & Covers',
      price: 1599,
      stock: 7,
      hsn: '8517',
      gstRate: 18,
      type: 'BARCODE',
      icon: 'watch',
    },
    {
      id: 'pos-6',
      name: 'Super D 9H Tempered Glass',
      subtitle: 'Universal Edge-to-Edge Guard',
      category: 'Tempered Glass',
      price: 199,
      stock: 45,
      hsn: '7007',
      gstRate: 18,
      type: 'BARCODE',
      icon: 'glass',
    },
  ];

  // Merge server products if any
  const mergedCatalog: PosProduct[] = [
    ...defaultCatalog,
    ...serverProducts
      .filter((sp) => !defaultCatalog.some((dp) => dp.name.toLowerCase() === sp.name.toLowerCase()))
      .map((sp) => ({
        id: sp.id,
        name: sp.name,
        subtitle: `${sp.model || sp.category} • HSN: ${sp.hsnCode || '8517'}`,
        category: (sp.category === 'Audio' ? 'Audio & Earbuds' : sp.category === 'Accessories' ? 'Chargers & Cables' : 'Smartphones') as any,
        price: sp.price,
        stock: sp.stock,
        hsn: sp.hsnCode || '8517',
        gstRate: sp.gstRate || 18,
        type: sp.imeiNumbers && sp.imeiNumbers.length > 0 ? ('IMEI TRACKED' as const) : ('BARCODE' as const),
        imeiList: sp.imeiNumbers,
        icon: 'phone' as const,
      })),
  ];

  // Customer state: default to Registered Customer "Suresh Kumar" as in screenshot
  const [customerMode, setCustomerMode] = useState<'walkin' | 'registered'>('registered');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>({
    name: 'Suresh Kumar',
    phone: '+91 98481 23456',
    address: 'Bazaar Street, Madurai',
  });

  // Active invoice items matching screenshot:
  // 1. Redmi Note 13 5G (Prism Gold, IMEI: 864219058129381, 1 qty, 17,999)
  // 2. Apple 20W USB-C Adapter (Box pack, 1 qty, 1,899)
  // 3. Super D Matte Tempered Glass (2 qty, 398)
  const [cartItems, setCartItems] = useState<BillItem[]>([
    {
      productId: 'pos-1',
      name: 'Redmi Note 13 5G',
      model: 'Prism Gold (6GB/256GB)',
      imei: '864219058129381',
      quantity: 1,
      unitPrice: 17999,
      gstRate: 18,
      taxableAmount: 15253.39,
      cgst: 1372.8,
      sgst: 1372.8,
      total: 17999,
    },
    {
      productId: 'pos-3',
      name: 'Apple 20W USB-C Adapter',
      model: 'HSN: 8504 • Box Pack',
      quantity: 1,
      unitPrice: 1899,
      gstRate: 18,
      taxableAmount: 1609.32,
      cgst: 144.84,
      sgst: 144.84,
      total: 1899,
    },
    {
      productId: 'pos-6',
      name: 'Super D Matte Tempered Glass',
      model: 'Universal Edge Guard (₹199 each)',
      quantity: 2,
      unitPrice: 199,
      gstRate: 18,
      taxableAmount: 337.29,
      cgst: 30.35,
      sgst: 30.35,
      total: 398,
    },
  ]);

  // Financial Discount & Payment Mode
  const [discount, setDiscount] = useState<number>(500); // Festival offer -₹500 as in screenshot
  const [discountLabel, setDiscountLabel] = useState('Shop Discount (Festival Offer)');
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Cash' | 'Card' | 'Credit'>('UPI');
  const [submitting, setSubmitting] = useState(false);

  // IMEI Edit Modal State
  const [editingImeiIndex, setEditingImeiIndex] = useState<number | null>(null);
  const [tempImei, setTempImei] = useState('');

  // Auto-scan hotkey listener F3 and Alt+C
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        scanInputRef.current?.focus();
      }
      if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        if (onOpenAddCustomer) onOpenAddCustomer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenAddCustomer]);

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
  const handleAddToCart = (product: PosProduct) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.name === product.name);
      if (existingIdx !== -1) {
        // Increment quantity
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

  // Handle Barcode/IMEI Scanner Input
  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    // Check if query matches IMEI
    const matchedByImei = mergedCatalog.find((p) =>
      p.imeiList?.some((im) => im.toLowerCase() === query)
    );
    if (matchedByImei) {
      handleAddToCart(matchedByImei);
      setSearchQuery('');
      return;
    }

    // Check by name or model
    const matchedByName = mergedCatalog.find(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.subtitle.toLowerCase().includes(query)
    );
    if (matchedByName) {
      handleAddToCart(matchedByName);
      setSearchQuery('');
      return;
    }

    alert(`No matching product or IMEI found for: "${searchQuery}"`);
  };

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

    setSubmitting(true);
    try {
      const billData = {
        customer:
          customerMode === 'registered'
            ? selectedCustomer
            : { name: 'Walk-in Customer', phone: 'Cash Counter' },
        items: cartItems,
        paymentMode,
        notes: discount > 0 ? `${discountLabel}: -₹${discount}` : 'Counter POS Sale',
      };

      const res = await api.createBill(billData);
      if (res.success && res.bill) {
        onInvoiceCreated(res.bill);
      }
    } catch (err) {
      console.warn('Backend offline, generating local bill preview:', err);
      // Fallback local bill so user can print instantly
      const localBill: Bill = {
        id: `INV-2024-${Math.floor(1043 + Math.random() * 50)}`,
        invoiceNumber: `INV-2024-1043`,
        date: new Date().toISOString(),
        customer:
          customerMode === 'registered'
            ? selectedCustomer
            : { name: 'Walk-in Customer', phone: 'Counter Sale' },
        items: cartItems,
        subTotal: taxableValue,
        cgstTotal: cgst,
        sgstTotal: sgst,
        totalTax: totalTax,
        grandTotal: netPayable,
        paymentMode,
        notes: 'Thanks for shopping at Sastika Mobiles!',
      };
      onInvoiceCreated(localBill);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter products by category and search
  const filteredCatalog = mergedCatalog.filter((item) => {
    const matchCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    const matchSearch =
      searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const categories = [
    'All',
    'Smartphones',
    'Chargers & Cables',
    'Audio & Earbuds',
    'Cases & Covers',
    'Tempered Glass',
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* =========================================================================
          LEFT SECTION (Span 7 on lg): Search Bar, Category Filters & Product Grid
          ========================================================================= */}
      <div className="lg:col-span-7 space-y-4">
        {/* Top Scanner & Search Bar */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs">
          <form onSubmit={handleScanSubmit} className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <Scan className="w-5 h-5" />
            </div>

            <input
              ref={scanInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Scan Barcode / Enter IMEI / Search Phone Model (e.g. Y..."
              className="flex-1 text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
            />

            {/* Auto-Scan Status Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-semibold shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Auto-Scan Mode Active</span>
            </div>

            {/* F3 Shortcut Pill */}
            <div className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 font-mono text-[11px] font-bold shrink-0 border border-slate-200/60">
              F3
            </div>
          </form>
        </div>

        {/* Category Pills Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'bg-white hover:bg-slate-100/80 text-slate-600 border border-slate-200/80'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Products Grid (3 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCatalog.map((product) => {
            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top: Stock Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      Stock: {product.stock}
                    </span>
                  </div>

                  {/* Card Visual / Thumbnail */}
                  <div className="w-full h-28 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden relative mb-3 group-hover:scale-101 transition-transform">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        {product.icon === 'audio' && <Headphones className="w-6 h-6" />}
                        {product.icon === 'watch' && <Watch className="w-6 h-6 text-emerald-600" />}
                        {product.icon === 'glass' && <Shield className="w-6 h-6 text-slate-600" />}
                        {product.icon === 'phone' && <Smartphone className="w-6 h-6 text-blue-600" />}
                        {!product.icon && <Smartphone className="w-6 h-6 text-blue-600" />}
                      </div>
                    )}

                    {/* Badge: IMEI TRACKED or BARCODE */}
                    <span
                      className={`absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                        product.type === 'IMEI TRACKED'
                          ? 'bg-blue-600/90 text-white'
                          : 'bg-slate-900/80 text-white'
                      }`}
                    >
                      {product.type}
                    </span>
                  </div>

                  {/* Titles & Specs */}
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-medium">
                    {product.subtitle}
                  </p>
                </div>

                {/* Price & Add Button */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                  <div>
                    <span className="font-extrabold text-sm sm:text-base text-slate-900 font-sans tracking-tight">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium">
                      Incl. 18% GST
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddToCart(product)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-transform active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          RIGHT SECTION (Span 5 on lg): Active Counter Bill & Checkout Panel
          ========================================================================= */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden sticky top-20">
        {/* Header Strip with Invoice # and Auto-Generated Badge */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight">
              Invoice #INV-2024-1043
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider border border-blue-200/60">
              AUTO-GENERATED
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>24 Oct 2024, 02:45 PM</span>
          </div>
        </div>

        {/* Customer Selector Mode (Walk-in vs Registered Customer) */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setCustomerMode('walkin')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                customerMode === 'walkin'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Walk-in Customer (Quick Sale)</span>
            </button>
            <button
              type="button"
              onClick={() => setCustomerMode('registered')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                customerMode === 'registered'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Registered Customer</span>
            </button>
          </div>

          {/* Active Customer Profile Box (when Registered Customer is selected) */}
          {customerMode === 'registered' ? (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  {selectedCustomer.name.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'SK'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={selectedCustomer.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        if (name === 'Vignesh R') {
                          setSelectedCustomer({ name: 'Vignesh R', phone: '+91 98401 23456' });
                        } else if (name === 'Deepak Kumar') {
                          setSelectedCustomer({ name: 'Deepak Kumar', phone: '+91 97890 88211' });
                        } else {
                          setSelectedCustomer({ name: 'Suresh Kumar', phone: '+91 98481 23456' });
                        }
                      }}
                      className="font-bold text-xs text-slate-900 bg-transparent border-0 cursor-pointer p-0 focus:ring-0 focus:outline-none"
                    >
                      <option value="Suresh Kumar">Suresh Kumar</option>
                      <option value="Vignesh R">Vignesh R</option>
                      <option value="Deepak Kumar">Deepak Kumar</option>
                    </select>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      Regular
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Phone: {selectedCustomer.phone}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onOpenAddCustomer) onOpenAddCustomer();
                }}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add New Customer (Alt+C)</span>
              </button>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 flex items-center justify-between">
              <span>Standard Retail Counter Sale (No GSTIN recorded)</span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                Quick POS
              </span>
            </div>
          )}
        </div>

        {/* Items Table Headers & Rows */}
        <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500 sticky top-0 bg-slate-50 z-10">
                <th className="py-2.5 px-4">ITEM / SERIAL</th>
                <th className="py-2.5 px-2 text-center">QTY</th>
                <th className="py-2.5 px-3 text-right">RATE (₹)</th>
                <th className="py-2.5 px-3 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cartItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No items in invoice. Click "+ Add" on any product.
                  </td>
                </tr>
              ) : (
                cartItems.map((item, index) => {
                  return (
                    <tr key={index} className="hover:bg-slate-50/60 transition-colors">
                      {/* Item details */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 leading-tight">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-slate-500 leading-tight">
                          {item.model}
                        </p>
                        {item.imei && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60 flex items-center gap-1">
                              IMEI: {item.imei}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingImeiIndex(index);
                                setTempImei(item.imei || '');
                              }}
                              className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                              title="Edit IMEI"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Quantity pill counter */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(index, -1)}
                            className="px-2 py-0.5 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2 font-bold text-slate-900 text-xs">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(index, 1)}
                            className="px-2 py-0.5 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Rate */}
                      <td className="py-3 px-3 text-right font-black text-slate-900 font-mono whitespace-nowrap">
                        ₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Action Trash */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bill Financials Summary Strip */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span>Subtotal ({totalItemsCount} items)</span>
            <span className="font-mono font-semibold text-slate-900">
              ₹{rawSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Discount Row */}
          <div
            onClick={() => {
              if (discount > 0) {
                setDiscount(0);
                setDiscountLabel('No Discount');
              } else {
                setDiscount(500);
                setDiscountLabel('Shop Discount (Festival Offer)');
              }
            }}
            className="flex items-center justify-between text-emerald-700 font-semibold cursor-pointer hover:opacity-80 transition-opacity"
            title="Click to toggle festival discount"
          >
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              {discountLabel}
            </span>
            <span className="font-mono">
              -₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-500">
            <span>Taxable Value</span>
            <span className="font-mono">
              ₹{taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-500">
            <span>CGST @ 9%</span>
            <span className="font-mono">
              ₹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-500">
            <span>SGST @ 9%</span>
            <span className="font-mono">
              ₹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* NET TOTAL PAYABLE BOX */}
          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                NET TOTAL PAYABLE
              </p>
              <p className="text-[11px] font-semibold text-emerald-700">
                Taxes Fully Computed
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-blue-600 font-sans tracking-tight">
                ₹{netPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Mode Selector & Generate Button */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          {/* Payment Method Tabs */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['UPI', 'Cash', 'Card', 'Credit'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    paymentMode === mode
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action Button: Generate & Print Invoice */}
          <button
            type="button"
            onClick={handleGenerateInvoice}
            disabled={submitting || cartItems.length === 0}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
          >
            <Printer className="w-4 h-4" />
            <span>Generate & Print Invoice</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MODAL: Edit Specific Item IMEI
          ========================================================================= */}
      {editingImeiIndex !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm">Assign / Edit Device IMEI</h4>
              <button
                type="button"
                onClick={() => setEditingImeiIndex(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
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
};

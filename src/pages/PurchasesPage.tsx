import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Plus,
  CreditCard,
  FileText,
  Building2,
  X,
  Phone,
  Trash2,
  CheckCircle2,
  Truck,
  Save,
  ArrowLeft,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import type { PurchaseBill, Supplier, Product } from '../types';
import { api } from '../services/api';
import { InwardSlipModal } from '../components/modals/InwardSlipModal';
import { SettleSupplierPaymentModal } from '../components/modals/SettleSupplierPaymentModal';

interface NewItemRow {
  name: string;
  category: string;
  quantity: number;
  unitCost: number;
  gstRate: number;
  imeis: string[];
}

export const PurchasesPage: React.FC = () => {
  // Navigation tabs: 'bills' | 'new-entry' | 'suppliers'
  const [activeSubTab, setActiveSubTab] = useState<'bills' | 'new-entry' | 'suppliers'>('bills');

  const [bills, setBills] = useState<PurchaseBill[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [_loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'due' | 'paid'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Selected bill modals
  const [selectedBillForSlip, setSelectedBillForSlip] = useState<PurchaseBill | null>(null);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<PurchaseBill | null>(null);

  // Success message toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Form State for "New Purchase Entry" Tab (100% Database Driven)
  // -------------------------------------------------------------
  const [isNewSupplierMode, setIsNewSupplierMode] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');
  const [newSupplierGstin, setNewSupplierGstin] = useState('');

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [billDate, setBillDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paidAmount, setPaidAmount] = useState<number | ''>(0);
  const [paymentMode, setPaymentMode] = useState('Bank Transfer (NEFT/RTGS)');
  const [stockSyncStatus, setStockSyncStatus] = useState<'Verified' | 'Pending'>('Verified');
  const [savingBill, setSavingBill] = useState(false);

  // Initial clean item row
  const [entryItems, setEntryItems] = useState<NewItemRow[]>([
    {
      name: '',
      category: 'Smartphones',
      quantity: 1,
      unitCost: 0,
      gstRate: 18,
      imeis: [],
    },
  ]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch live purchases, suppliers, and products from database
  const fetchPurchasesData = async () => {
    setLoading(true);
    try {
      const [purchasesRes, suppliersRes, productsRes] = await Promise.all([
        api.getPurchases(),
        api.getSuppliers(),
        api.getProducts().catch(() => ({ products: [] })),
      ]);
      setBills(purchasesRes.purchases || []);
      setSuppliers(suppliersRes.suppliers || []);
      setProducts(productsRes.products || []);

      if (suppliersRes.suppliers?.length && !selectedSupplierId) {
        setSelectedSupplierId(suppliersRes.suppliers[0].id);
      }
    } catch (err) {
      console.warn('Failed to load purchases from database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchasesData();
  }, []);

  // Filter bills
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        b.id.toLowerCase().includes(q) ||
        b.supplierInvoiceNumber.toLowerCase().includes(q) ||
        b.supplier.name.toLowerCase().includes(q) ||
        (b.itemsSummary || '').toLowerCase().includes(q);

      const isDue = (b.balanceDue || 0) > 0;
      let matchTab = true;
      if (statusTab === 'due') {
        matchTab = isDue;
      } else if (statusTab === 'paid') {
        matchTab = !isDue;
      }

      return matchSearch && matchTab;
    });
  }, [bills, searchTerm, statusTab]);

  // Pagination
  const totalItems = filteredBills.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedBills = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBills.slice(start, start + pageSize);
  }, [filteredBills, currentPage, pageSize]);

  // Quick stats
  const totalPurchases = useMemo(() => {
    return bills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
  }, [bills]);

  const totalDue = useMemo(() => {
    return bills.reduce((acc, b) => acc + (b.balanceDue || 0), 0);
  }, [bills]);

  // -------------------------------------------------------------
  // Calculations for New Purchase Bill Entry
  // -------------------------------------------------------------
  const subtotal = useMemo(() => {
    return entryItems.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitCost) || 0), 0);
  }, [entryItems]);

  const totalTax = useMemo(() => {
    return entryItems.reduce(
      (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitCost) || 0) * ((Number(it.gstRate) || 0) / 100),
      0
    );
  }, [entryItems]);

  const grandTotal = Math.round(subtotal + totalTax);
  const numericPaid = typeof paidAmount === 'number' ? paidAmount : 0;
  const balanceDue = Math.max(0, grandTotal - numericPaid);

  // Settlement callback
  const handlePaymentSettled = async (billId: string, amount: number) => {
    try {
      await api.settlePurchasePayment(billId, amount);
      await fetchPurchasesData();
      showToast(`Settled ₹${amount.toLocaleString('en-IN')} payment successfully!`);
    } catch (err) {
      console.warn('API settle purchase notice:', err);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // -------------------------------------------------------------
  // Add / Modify item rows in New Purchase Tab
  // -------------------------------------------------------------
  const handleAddItemRow = () => {
    setEntryItems((prev) => [
      ...prev,
      {
        name: '',
        category: 'Accessories',
        quantity: 1,
        unitCost: 0,
        gstRate: 18,
        imeis: [],
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (entryItems.length === 1) {
      setEntryItems([
        {
          name: '',
          category: 'Accessories',
          quantity: 1,
          unitCost: 0,
          gstRate: 18,
          imeis: [],
        },
      ]);
      return;
    }
    setEntryItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemFieldChange = (index: number, field: keyof NewItemRow, value: any) => {
    setEntryItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Autofill product details when picked from existing MongoDB products
  const handleProductSelect = (index: number, productName: string) => {
    const matched = products.find((p) => p.name.trim().toLowerCase() === productName.trim().toLowerCase());
    setEntryItems((prev) => {
      const copy = [...prev];
      if (matched) {
        copy[index] = {
          ...copy[index],
          name: matched.name,
          category: matched.category || copy[index].category,
          unitCost: matched.costPrice || Math.round(matched.price * 0.8),
          gstRate: matched.gstRate ?? 18,
        };
      } else {
        copy[index] = { ...copy[index], name: productName };
      }
      return copy;
    });
  };

  // Submit New Purchase Bill directly to MongoDB Backend
  const handleSubmitPurchaseBill = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoiceNumber.trim()) {
      alert('Please enter the Supplier Invoice Number.');
      return;
    }

    let supplierPayload: { id?: string; name: string; phone: string; address: string; gstin: string };
    if (isNewSupplierMode) {
      if (!newSupplierName.trim()) {
        alert('Please enter the Supplier Name.');
        return;
      }
      supplierPayload = {
        name: newSupplierName.trim(),
        phone: newSupplierPhone.trim(),
        address: newSupplierAddress.trim(),
        gstin: newSupplierGstin.trim(),
      };
    } else {
      const existing = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];
      if (!existing) {
        alert('Please select or add a supplier.');
        return;
      }
      supplierPayload = {
        id: existing.id,
        name: existing.name,
        phone: existing.phone || '',
        address: existing.address || '',
        gstin: existing.gstin || '',
      };
    }

    const validItems = entryItems.filter((i) => i.name.trim().length > 0);
    if (!validItems.length) {
      alert('Please add at least one item with a valid product name.');
      return;
    }

    setSavingBill(true);
    try {
      const totalUnits = validItems.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
      const totalImeis = validItems.reduce((acc, it) => acc + (it.imeis?.length || 0), 0);

      const itemsSummary = validItems.map((it) => `${it.quantity}x ${it.name}`).join(', ');

      const payload = {
        supplierInvoiceNumber: invoiceNumber.trim(),
        date: billDate,
        supplier: supplierPayload,
        itemsSummary,
        unitsCount: totalUnits,
        imeiLoggedCount: totalImeis > 0 ? totalImeis : undefined,
        isBarcoded: totalImeis === 0,
        totalAmount: grandTotal,
        paidAmount: numericPaid,
        balanceDue,
        dueNotice: balanceDue > 0 ? `Payable due` : 'Settled',
        paymentStatus: balanceDue === 0 ? ('PAID FULL' as const) : numericPaid > 0 ? ('PARTIAL DUE' as const) : ('UNPAID' as const),
        stockSyncStatus,
        items: validItems.map((it) => ({
          name: it.name.trim(),
          category: it.category,
          quantity: Number(it.quantity) || 1,
          unitCost: Number(it.unitCost) || 0,
          gstRate: Number(it.gstRate) || 18,
          taxableAmount: (Number(it.quantity) || 1) * (Number(it.unitCost) || 0),
          totalAmount:
            (Number(it.quantity) || 1) * (Number(it.unitCost) || 0) * (1 + (Number(it.gstRate) || 18) / 100),
          imeiNumbers: it.imeis || [],
        })),
      };

      const res = await api.createPurchase(payload);

      if (res.success || res.purchase) {
        showToast(`Purchase bill ${invoiceNumber} successfully stored in database and stock synced!`);
        // Reset form
        setInvoiceNumber('');
        setPaidAmount(0);
        setEntryItems([
          {
            name: '',
            category: 'Smartphones',
            quantity: 1,
            unitCost: 0,
            gstRate: 18,
            imeis: [],
          },
        ]);
        setIsNewSupplierMode(false);
        // Refresh live data from MongoDB
        await fetchPurchasesData();
        // Switch back to bills list
        setActiveSubTab('bills');
      }
    } catch (err: any) {
      alert(`Error saving purchase to database: ${err.message || 'Server error'}`);
    } finally {
      setSavingBill(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-lg animate-in slide-in-from-top-2 duration-200 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-80">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ─── 1. Header with Live Stats & Tab Navigation ────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Purchases &amp; Inward Stock
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              MongoDB Synced
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Total Inward:{' '}
            <strong className="text-slate-900 font-bold font-sans">
              ₹{totalPurchases.toLocaleString('en-IN')}
            </strong>{' '}
            • Supplier Dues:{' '}
            <strong className="text-rose-600 font-bold font-sans">
              ₹{totalDue.toLocaleString('en-IN')}
            </strong>
          </p>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/80 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('bills')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'bills'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Inward Bills ({bills.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('new-entry')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'new-entry'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-700 hover:bg-blue-50'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New Purchase Entry</span>
          </button>

          <button
            onClick={() => setActiveSubTab('suppliers')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'suppliers'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Suppliers ({suppliers.length})</span>
          </button>
        </div>
      </div>

      {/* ─── TAB 1: NEW PURCHASE ENTRY (Full-page New Tab) ────────────────────────── */}
      {activeSubTab === 'new-entry' && (
        <form onSubmit={handleSubmitPurchaseBill} className="space-y-5 animate-in fade-in duration-200">
          {/* Top Banner / Breadcrumb */}
          <div className="flex items-center justify-between p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-slate-900">
                  New Purchase Consignment Entry
                </h2>
                <p className="text-[11px] text-slate-500">
                  Fill supplier bill details. Stock and supplier ledger will update automatically in the database upon saving.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveSubTab('bills')}
              className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Bills</span>
            </button>
          </div>

          {/* Section 1: Supplier & Invoice Information */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Supplier &amp; Invoice Header</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewSupplierMode(!isNewSupplierMode)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                {isNewSupplierMode ? '← Choose Existing Supplier' : '+ Add New Supplier'}
              </button>
            </div>

            {isNewSupplierMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Supplier Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
                    placeholder="e.g. Metro Mobile Wholesale"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={newSupplierPhone}
                    onChange={(e) => setNewSupplierPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Supplier GSTIN</label>
                  <input
                    type="text"
                    value={newSupplierGstin}
                    onChange={(e) => setNewSupplierGstin(e.target.value)}
                    placeholder="33AAAAA0000A1Z5"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono uppercase text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Address / Location</label>
                  <input
                    type="text"
                    value={newSupplierAddress}
                    onChange={(e) => setNewSupplierAddress(e.target.value)}
                    placeholder="Wholesale Market, Chennai"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Select Supplier from Database <span className="text-rose-500">*</span>
                  </label>
                  {suppliers.length === 0 ? (
                    <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                      <span>No suppliers found in database.</span>
                      <button
                        type="button"
                        onClick={() => setIsNewSupplierMode(true)}
                        className="font-bold underline cursor-pointer"
                      >
                        Create one now
                      </button>
                    </div>
                  ) : (
                    <select
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.phone ? `(${s.phone})` : ''} - {s.address || 'Vendor'}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Supplier Invoice # <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="e.g. INV-2026-891"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Invoice / Inward Date</label>
                  <input
                    type="date"
                    required
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Items Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Purchased Items &amp; Inventory Quantities</h3>
                <p className="text-[11px] text-slate-500">
                  Select an existing product to autofill rates, or enter a new product name to auto-register into inventory.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddItemRow}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Row</span>
              </button>
            </div>

            {/* Datalist for fast product autocomplete from MongoDB products */}
            <datalist id="db-products-list">
              {products.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.category} | Current Cost: ₹{p.costPrice || Math.round(p.price * 0.8)}
                </option>
              ))}
            </datalist>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Product / Item Name</th>
                    <th className="py-2.5 px-3 w-36">Category</th>
                    <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                    <th className="py-2.5 px-3 w-28 text-right">Unit Cost (₹)</th>
                    <th className="py-2.5 px-3 w-24 text-center">GST %</th>
                    <th className="py-2.5 px-3 w-28 text-right">Taxable</th>
                    <th className="py-2.5 px-3 w-32 text-right">Total (₹)</th>
                    <th className="py-2.5 px-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entryItems.map((item, idx) => {
                    const taxable = (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);
                    const lineTotal = taxable * (1 + (Number(item.gstRate) || 0) / 100);

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            required
                            list="db-products-list"
                            value={item.name}
                            onChange={(e) => handleProductSelect(idx, e.target.value)}
                            placeholder="Type or pick product..."
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={item.category}
                            onChange={(e) => handleItemFieldChange(idx, 'category', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
                          >
                            <option value="Smartphones">Smartphones</option>
                            <option value="Screen Protectors">Screen Protectors</option>
                            <option value="Fast Chargers">Fast Chargers</option>
                            <option value="TWS Earbuds">TWS Earbuds</option>
                            <option value="Cables & Adapters">Cables &amp; Adapters</option>
                            <option value="Accessories">Accessories</option>
                            <option value="Spare Parts">Spare Parts</option>
                            <option value="General">General</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={(e) => handleItemFieldChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full text-center px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={item.unitCost}
                            onChange={(e) => handleItemFieldChange(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                            className="w-full text-right px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={item.gstRate}
                            onChange={(e) => handleItemFieldChange(idx, 'gstRate', parseInt(e.target.value) || 18)}
                            className="w-full text-center px-1.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-700">
                          ₹{taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          ₹{Math.round(lineTotal).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="p-1 text-slate-300 hover:text-rose-600 rounded cursor-pointer transition-colors"
                            title="Remove row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Summary & Payment Settlement */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Payment Details */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                Settlement &amp; Verification
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Amount Paid (₹)</label>
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="flex gap-1.5 mt-1">
                    <button
                      type="button"
                      onClick={() => setPaidAmount(grandTotal)}
                      className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      Pay Full
                    </button>
                    <span className="text-[10px] text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => setPaidAmount(0)}
                      className="text-[10px] text-slate-500 font-bold hover:underline cursor-pointer"
                    >
                      Pay Later
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI / QR Code">UPI / QR Code</option>
                    <option value="Cash">Cash in Drawer</option>
                    <option value="Cheque">Bank Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Stock Sync Status</label>
                  <select
                    value={stockSyncStatus}
                    onChange={(e) => setStockSyncStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="Verified">Verified &amp; Inwarded</option>
                    <option value="Pending">Pending Physical Count</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bill Financial Totals */}
            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/90 flex flex-col justify-between space-y-3">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Subtotal:</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Input GST (CGST + SGST):</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm">
                  <span className="font-black text-slate-900">Grand Total:</span>
                  <span className="font-black font-sans text-blue-700 text-base">
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-1">
                  <span className="text-slate-500">Balance Due:</span>
                  <span className={`font-black font-sans ${balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ₹{balanceDue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingBill}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all disabled:opacity-50"
                >
                  {savingBill ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save &amp; Sync to Database</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ─── TAB 2: INWARD BILLS LIST (Existing Table View) ────────────────────────── */}
      {activeSubTab === 'bills' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Search & Tab Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by supplier name, invoice #, or products in database..."
                className="w-full pl-9 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
              {(['all', 'due', 'paid'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setStatusTab(tab);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                    statusTab === tab
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab === 'due' ? 'Payment Due' : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Clean Purchases Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Items Summary</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedBills.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Truck className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
                        <p className="font-semibold text-slate-600">No purchase bills found in database</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Click "+ New Purchase Entry" above to record your first supplier bill.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedBills.map((bill) => {
                      const isDue = (bill.balanceDue || 0) > 0;
                      return (
                        <tr key={bill.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{bill.supplier.name}</span>
                            {bill.supplier.phone && (
                              <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-300" />
                                {bill.supplier.phone}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-blue-600">
                            {bill.supplierInvoiceNumber}
                          </td>
                          <td className="py-3 px-4 max-w-[240px] truncate text-slate-600">
                            {bill.itemsSummary}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 font-sans whitespace-nowrap">
                            ₹{(bill.totalAmount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right font-sans whitespace-nowrap">
                            {isDue ? (
                              <span className="font-black text-rose-600">
                                ₹{(bill.balanceDue || 0).toLocaleString('en-IN')}
                              </span>
                            ) : (
                              <span className="font-semibold text-emerald-600 text-[11px]">Paid</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {isDue && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedBillForPayment(bill)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer shadow-2xs"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  <span>Settle</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setSelectedBillForSlip(bill)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold cursor-pointer"
                              >
                                <FileText className="w-3 h-3 text-slate-400" />
                                <span>Slip</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block sm:hidden divide-y divide-slate-100">
              {paginatedBills.map((bill) => {
                const isDue = (bill.balanceDue || 0) > 0;
                return (
                  <div key={bill.id} className="p-3.5 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="font-mono font-bold text-xs text-blue-600 block">
                          {bill.supplierInvoiceNumber}
                        </span>
                        <h4 className="font-bold text-slate-900 text-xs mt-0.5">{bill.supplier.name}</h4>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-black text-sm text-slate-900 font-sans block">
                          ₹{(bill.totalAmount || 0).toLocaleString('en-IN')}
                        </span>
                        {isDue && (
                          <span className="text-[10px] text-rose-600 font-bold block">
                            Due: ₹{(bill.balanceDue || 0).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-50">
                      <button
                        type="button"
                        onClick={() => setSelectedBillForSlip(bill)}
                        className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                      >
                        <FileText className="w-3 h-3 text-slate-400" />
                        <span>Slip</span>
                      </button>
                      {isDue && (
                        <button
                          type="button"
                          onClick={() => setSelectedBillForPayment(bill)}
                          className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Settle</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing {Math.min(totalItems, (currentPage - 1) * pageSize + 1)}-
                  {Math.min(totalItems, currentPage * pageSize)} of {totalItems} purchase bills
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 border border-slate-200 rounded-lg disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="px-2 font-bold text-slate-800">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 border border-slate-200 rounded-lg disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 3: SUPPLIERS DIRECTORY ───────────────────────────────────────── */}
      {activeSubTab === 'suppliers' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
            <div>
              <h2 className="font-bold text-sm text-slate-900">Authorized Suppliers &amp; Vendors</h2>
              <p className="text-[11px] text-slate-500">
                Vendor records stored in MongoDB with active purchase history and payable dues.
              </p>
            </div>
            <button
              onClick={() => {
                setIsNewSupplierMode(true);
                setActiveSubTab('new-entry');
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Supplier</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
                <p className="font-semibold text-slate-600">No suppliers registered in database yet</p>
              </div>
            ) : (
              suppliers.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{s.name}</h4>
                        {s.phone && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {s.phone}
                          </p>
                        )}
                        {s.address && (
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {s.address}
                          </p>
                        )}
                      </div>
                      {(s.balanceDue || 0) > 0 ? (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 shrink-0">
                          ₹{(s.balanceDue || 0).toLocaleString('en-IN')} Due
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 shrink-0">
                          Clear
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[10px] font-mono">
                      {s.gstin ? `GST: ${s.gstin}` : 'Unregistered'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSupplierId(s.id);
                        setActiveSubTab('new-entry');
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      + New Inward Bill
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Slip and Payment Modals */}
      <InwardSlipModal
        isOpen={Boolean(selectedBillForSlip)}
        bill={selectedBillForSlip}
        onClose={() => setSelectedBillForSlip(null)}
      />

      <SettleSupplierPaymentModal
        isOpen={Boolean(selectedBillForPayment)}
        bill={selectedBillForPayment}
        onClose={() => setSelectedBillForPayment(null)}
        onPaymentSettled={handlePaymentSettled}
      />
    </div>
  );
};

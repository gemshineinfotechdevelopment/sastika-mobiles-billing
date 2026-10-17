import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Users,
  Search,
  UserPlus,
  SlidersHorizontal,
  ChevronDown,
  CheckCircle2,
  Download,
  RotateCw,
  MessageSquare,
  Pencil,
  MoreVertical,
  ChevronRight,
  Send,
  Banknote,
  Award,
  PhoneCall,
  X,
} from 'lucide-react';
import type { Customer } from '../types';
import { INITIAL_CUSTOMERS } from '../data/initialCustomers';
import { CollectPaymentModal } from '../components/modals/CollectPaymentModal';
import { CustomerLedgerModal } from '../components/modals/CustomerLedgerModal';
import { api } from '../services/api';

interface CustomersPageProps {
  onOpenAddCustomer: () => void;
  onSelectCustomerForBill?: (customer: Customer) => void;
}

type TabFilter = 'all' | 'due' | 'settled' | 'vip';
type SortOption = 'default' | 'highest_sales' | 'lowest_sales' | 'highest_due' | 'loyalty' | 'name';

export const CustomersPage: React.FC<CustomersPageProps> = ({
  onOpenAddCustomer,
}) => {
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [selectedIds, setSelectedIds] = useState<string[]>(['#CUST-9840']); // First row (Suresh Kumar) selected as in screenshot
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals state
  const [selectedCustomerForLedger, setSelectedCustomerForLedger] = useState<Customer | null>(null);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);
  const [reminderToast, setReminderToast] = useState<string | null>(null);
  const [actionDropdownId, setActionDropdownId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener: Alt+C opens Add Customer, Ctrl+K focuses search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        onOpenAddCustomer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenAddCustomer]);

  // Try to load any extra customers from backend if available
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.getCustomers();
        if (res.customers && res.customers.length > 0) {
          // Merge API customers with rich initial mock patrons
          const apiMap = new Map(res.customers.map((c) => [c.phone, c]));
          const merged = INITIAL_CUSTOMERS.map((init) => {
            if (apiMap.has(init.phone)) {
              return { ...init, ...apiMap.get(init.phone) };
            }
            return init;
          });
          // Add any newly registered ones from API
          res.customers.forEach((c) => {
            if (!merged.some((m) => m.phone === c.phone)) {
              merged.push({
                ...c,
                id: c.id || `#CUST-${Math.floor(1000 + Math.random() * 9000)}`,
                tier: c.gstin ? 'VIP MEMBER' : 'REGULAR',
                lifetimeSales: 0,
                billsCount: 0,
                khataBalance: 0,
                khataStatus: 'settled',
                loyaltyPoints: 10,
                avatarBg: 'bg-blue-600 text-white',
                initials: c.name.slice(0, 2).toUpperCase(),
              });
            }
          });
          setCustomers(merged);
        }
      } catch {
        // Run with rich initial customers
      }
    };
    fetchCustomers();
  }, []);

  // Filter & Search
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        cust.name.toLowerCase().includes(q) ||
        cust.phone.includes(q) ||
        (cust.id && cust.id.toLowerCase().includes(q)) ||
        (cust.address && cust.address.toLowerCase().includes(q)) ||
        (cust.gstin && cust.gstin.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (activeTab === 'due') {
        return (cust.khataBalance || 0) > 0;
      }
      if (activeTab === 'settled') {
        return (cust.khataBalance || 0) === 0;
      }
      if (activeTab === 'vip') {
        return cust.tier === 'VIP MEMBER';
      }
      return true;
    });
  }, [customers, searchTerm, activeTab]);

  // Sorting
  const sortedCustomers = useMemo(() => {
    if (sortOption === 'default') {
      return [...filteredCustomers];
    }
    return [...filteredCustomers].sort((a, b) => {
      if (sortOption === 'highest_sales') {
        return (b.lifetimeSales || 0) - (a.lifetimeSales || 0);
      }
      if (sortOption === 'lowest_sales') {
        return (a.lifetimeSales || 0) - (b.lifetimeSales || 0);
      }
      if (sortOption === 'highest_due') {
        return (b.khataBalance || 0) - (a.khataBalance || 0);
      }
      if (sortOption === 'loyalty') {
        return (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0);
      }
      if (sortOption === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [filteredCustomers, sortOption]);

  // Pagination calculations (displaying matching page counts)
  const totalPages = Math.max(1, Math.ceil(sortedCustomers.length / itemsPerPage));
  const paginatedCustomers = sortedCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Checkbox handlers
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedCustomers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedCustomers.map((c) => c.id || c.name));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Payment settled handler
  const handlePaymentSettled = (customerId: string, amountPaid: number) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const newBal = Math.max(0, (c.khataBalance || 0) - amountPaid);
          return {
            ...c,
            khataBalance: newBal,
            khataStatus: newBal === 0 ? 'settled' : 'pending',
            dueText: newBal === 0 ? undefined : 'Partial Balance',
          };
        }
        return c;
      })
    );
    setReminderToast(`Payment of ₹${amountPaid.toLocaleString('en-IN')} successfully recorded!`);
    setTimeout(() => setReminderToast(null), 4000);
  };

  // Export CSV handler
  const handleExportCSV = () => {
    const headers = [
      'Customer ID',
      'Name',
      'Phone',
      'Email',
      'Address',
      'GSTIN',
      'Tier',
      'Lifetime Sales (INR)',
      'Bills Count',
      'Khata Due (INR)',
      'Khata Status',
      'Loyalty Points',
    ];
    const rows = customers.map((c) => [
      c.id || '',
      `"${c.name}"`,
      `"${c.phone}"`,
      `"${c.email || ''}"`,
      `"${c.address || ''}"`,
      `"${c.gstin || ''}"`,
      `"${c.tier || 'REGULAR'}"`,
      c.lifetimeSales || 0,
      c.billsCount || 0,
      c.khataBalance || 0,
      c.khataStatus || 'settled',
      c.loyaltyPoints || 0,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sastika_customers_khata_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setReminderToast('Customer directory and Khata ledger exported successfully!');
    setTimeout(() => setReminderToast(null), 3500);
  };

  // Send Reminders handler
  const handleSendReminders = () => {
    setReminderToast('Automated WhatsApp & SMS reminders dispatched to 14 pending Khata accounts!');
    setTimeout(() => setReminderToast(null), 4500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {reminderToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{reminderToast}</span>
          <button
            onClick={() => setReminderToast(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TOP HEADER SECTION WITH BREADCRUMB & ACTION BUTTONS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          {/* Breadcrumbs matching image */}
          <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400 flex flex-wrap items-center gap-1.5 mb-1 whitespace-nowrap">
            <span>RETAIL OS</span>
            <span className="text-slate-300">›</span>
            <span>CUSTOMER MANAGEMENT</span>
            <span className="text-slate-300">›</span>
            <span className="text-blue-600 font-extrabold">DIRECTORY &amp; KHATA LEDGER</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Customers &amp; Khata Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Directory of retail patrons, credit (Khata) accounts, lifetime purchases, and loyalty rewards.
          </p>
        </div>

        {/* Action Buttons matching screenshot */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* 1. Export Directory (CSV) */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer active:scale-98"
            title="Download Customer Database in CSV Format"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Directory (CSV)</span>
          </button>

          {/* 2. Send Reminders */}
          <button
            onClick={handleSendReminders}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200/80 text-blue-700 text-xs font-semibold rounded-xl transition-all cursor-pointer active:scale-98"
            title="Send WhatsApp & SMS Khata Reminders"
          >
            <RotateCw className="w-3.5 h-3.5 text-blue-600" />
            <span>Send Reminders</span>
          </button>

          {/* 3. + Add Customer [Alt+C] */}
          <button
            onClick={onOpenAddCustomer}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-blue-500/20 transition-all cursor-pointer active:scale-98"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add Customer</span>
            <span className="bg-blue-700/80 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium tracking-tight">
              Alt+C
            </span>
          </button>
        </div>
      </div>

      {/* 4 KPI / SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL REGISTERED PATRONS */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-400">
              TOTAL REGISTERED PATRONS
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">248</span>
              <span className="inline-flex items-center text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                +18 this month
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span>Active counters: 3</span>
            <span className="flex items-center gap-1 font-medium text-slate-600">
              <span className="text-emerald-500 font-bold">✓</span> 99.2% phone verified
            </span>
          </div>
        </div>

        {/* Card 2: TOTAL KHATA BALANCE DUE (Alert / Action Highlighted) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-200/90 shadow-xs flex flex-col justify-between space-y-3 hover:border-rose-300 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-400">
              TOTAL KHATA BALANCE DUE
            </span>
            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-red-100 text-red-700 border border-red-200">
              14 PENDING
            </span>
          </div>
          <div className="flex items-center justify-between gap-1.5">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-red-700 font-mono tracking-tight">
                  ₹42,650
                </span>
                <span className="text-[11px] font-semibold text-slate-400">/ 14 accounts</span>
              </div>
            </div>
            <button
              onClick={() => {
                const dueCust = customers.find((c) => (c.khataBalance || 0) > 0) || customers[2];
                setSelectedCustomerForPayment(dueCust);
              }}
              className="bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
            >
              Collect Due
            </button>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-rose-600 font-medium pt-1 border-t border-rose-100">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
            <span>₹31,999 overdue by &gt; 30 days</span>
          </div>
        </div>

        {/* Card 3: TOTAL LIFETIME PURCHASES */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-400">
              TOTAL LIFETIME PURCHASES
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                ₹18,92,400
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase">
                FY 24-25
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-500 pt-1 border-t border-slate-100 font-medium">
            Avg. Basket Value: <span className="font-bold text-slate-800 font-mono">₹7,630</span>
          </div>
        </div>

        {/* Card 4: LOYALTY & ACTIVE MEMBERS */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-400">
              LOYALTY &amp; ACTIVE MEMBERS
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">182</span>
              <span className="text-xs font-semibold text-slate-500">Enrolled Patrons</span>
            </div>
          </div>
          <div className="text-xs text-blue-600 font-medium pt-1 border-t border-slate-100">
            <span className="font-bold font-mono">14,210 pts</span> circulating in rewards
          </div>
        </div>
      </div>

      {/* FILTER, SEARCH & TAB CONTROLS BAR */}
      <div className="bg-white rounded-2xl p-2 sm:p-3 border border-slate-200/80 shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5">
        {/* Left: Search input field */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by customer name, phone (+91), or Khata ID..."
            className="w-full pl-8.5 pr-14 py-1.5 bg-slate-50 focus:bg-white text-xs text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <span className="text-[9px] font-mono font-bold text-slate-400 bg-white border border-slate-200 px-1 py-0.5 rounded shadow-2xs">
              CTRL+K
            </span>
          </div>
        </div>

        {/* Middle: Filter tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0">
          {/* Tab 1: All */}
          <button
            onClick={() => {
              setActiveTab('all');
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All (248)
          </button>

          {/* Tab 2: Due Khata (14) with red badge */}
          <button
            onClick={() => {
              setActiveTab('due');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'due'
                ? 'bg-red-50 text-red-700 border border-red-200 ring-1 ring-red-400'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Due Khata</span>
            <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              14
            </span>
          </button>

          {/* Tab 3: Settled (234) */}
          <button
            onClick={() => {
              setActiveTab('settled');
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'settled'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 ring-1 ring-emerald-400'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Settled (234)
          </button>

          {/* Tab 4: VIPs (36) */}
          <button
            onClick={() => {
              setActiveTab('vip');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'vip'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 ring-1 ring-blue-400'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>⭐ VIPs (36)</span>
          </button>
        </div>

        {/* Right: Sort Dropdown & Filter Icon */}
        <div className="flex items-center gap-1.5 shrink-0 self-end xl:self-auto">
          <div className="relative">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold pl-2.5 pr-7 py-1.5 rounded-xl border border-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="default">Sort: Highest Purchases</option>
              <option value="highest_sales">Highest Sales</option>
              <option value="lowest_sales">Lowest Sales</option>
              <option value="highest_due">Highest Due</option>
              <option value="loyalty">Loyalty Points</option>
              <option value="name">Name (A-Z)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => {
              setSortOption('highest_due');
              setActiveTab('due');
            }}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer"
            title="Toggle Detailed Filters"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* MAIN DATA TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
                <th className="py-2.5 px-2.5 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={
                      paginatedCustomers.length > 0 &&
                      selectedIds.length === paginatedCustomers.length
                    }
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-2.5 min-w-[180px]">CUSTOMER PROFILE</th>
                <th className="py-2.5 px-2.5 min-w-[130px]">CONTACT &amp; CONNECT</th>
                <th className="py-2.5 px-2.5 min-w-[105px]">LIFETIME SALES</th>
                <th className="py-2.5 px-2.5 min-w-[100px]">KHATA DUE</th>
                <th className="py-2.5 px-2.5 min-w-[60px]">LOYALTY</th>
                <th className="py-2.5 px-2.5 min-w-[145px] text-right">ROW ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-sm text-slate-600">No matching patrons found</p>
                    <p className="text-xs text-slate-400">Try adjusting your search query or filter</p>
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((customer) => {
                  const custKey = customer.id || customer.name;
                  const isChecked = selectedIds.includes(custKey);
                  const due = customer.khataBalance || 0;
                  const isSettled = due === 0;
                  const isRisk = customer.tier === 'KHATA RISK' || (customer.dueText && customer.dueText.includes('DAYS'));

                  return (
                    <tr
                      key={custKey}
                      className={`transition-colors hover:bg-slate-50/80 ${
                        isChecked ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      {/* 1. Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(custKey)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                        />
                      </td>

                      {/* 2. Customer Profile */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 shadow-2xs ${
                              customer.avatarBg || 'bg-blue-600 text-white'
                            }`}
                          >
                            {customer.initials || customer.name.slice(0, 2).toUpperCase()}
                          </div>

                          {/* Name + Tier badge + ID & Location */}
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className="font-bold text-slate-900 text-sm hover:text-blue-600 cursor-pointer"
                                onClick={() => setSelectedCustomerForLedger(customer)}
                              >
                                {customer.name}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tight ${
                                  customer.tier === 'VIP MEMBER'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : customer.tier === 'KHATA RISK'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200 font-extrabold'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                              >
                                {customer.tier || 'REGULAR'}
                              </span>
                            </div>
                            <p className="text-slate-500 text-[11px] mt-0.5">
                              <span className="font-mono font-medium">{customer.id}</span>
                              <span className="mx-1.5">•</span>
                              <span>{customer.address || 'Chennai'}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 3. Contact & Connect */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-700 font-medium text-xs">
                            {customer.phone}
                          </span>
                          <div className="flex items-center gap-1">
                            {/* WhatsApp / Chat Message Icon */}
                            <a
                              href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                            {/* Phone Call Icon */}
                            <a
                              href={`tel:${customer.phone}`}
                              className="p-1.5 rounded-lg text-teal-600 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                              title="Call customer"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* 4. Lifetime Sales */}
                      <td className="py-3.5 px-3">
                        <div>
                          <p className="font-bold font-mono text-slate-900 text-sm">
                            ₹{(customer.lifetimeSales || 0).toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                          <p className="text-slate-400 text-[11px] mt-0.5">
                            {customer.billsCount || 1} Bills • Last:{' '}
                            <span className="text-slate-600 font-medium">
                              {customer.lastBillDate || '20 Oct'}
                            </span>
                          </p>
                        </div>
                      </td>

                      {/* 5. Khata Due */}
                      <td className="py-3.5 px-3">
                        {isSettled ? (
                          /* Green Settled Pill with Checkmark */
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <div className="leading-tight">
                              <p className="font-mono font-bold text-xs">₹0.00</p>
                              <p className="text-[10px] font-semibold text-emerald-600">Settled</p>
                            </div>
                          </div>
                        ) : isRisk ? (
                          /* High Risk / Red Amount */
                          <div>
                            <p className="font-extrabold font-mono text-rose-700 text-sm">
                              ₹{due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                            <span className="inline-block text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded uppercase mt-0.5">
                              {customer.dueText || '> 35 DAYS DUE'}
                            </span>
                          </div>
                        ) : due > 5000 ? (
                          /* Regular Red Amount */
                          <div>
                            <p className="font-bold font-mono text-red-600 text-sm">
                              ₹{due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-red-500 text-[11px] font-medium mt-0.5">
                              {customer.dueText || 'Due since 24 Oct'}
                            </p>
                          </div>
                        ) : (
                          /* Partial / Amber Amount */
                          <div>
                            <p className="font-bold font-mono text-amber-700 text-sm">
                              ₹{due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-amber-600 text-[11px] font-medium mt-0.5">
                              {customer.dueText || 'Partial Balance'}
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 6. Loyalty Points */}
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-xs text-slate-700">
                          {customer.loyaltyPoints || 0} pts
                        </span>
                      </td>

                      {/* 7. Row Actions (Exact matching buttons per row) */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 relative">
                          {/* Case 1: Karthik Raja -> Red "Collect Payment" button */}
                          {customer.name === 'Karthik Raja' || (due > 20000 && isRisk) ? (
                            <button
                              onClick={() => setSelectedCustomerForPayment(customer)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                            >
                              <span>Collect Payment</span>
                            </button>
                          ) : customer.name === 'Priya Raman' ? (
                            /* Case 2: Priya Raman -> Remind + Pay */
                            <>
                              <button
                                onClick={() => {
                                  setReminderToast(`Khata payment reminder queued for ${customer.name}!`);
                                  setTimeout(() => setReminderToast(null), 3500);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                <Send className="w-3 h-3 text-red-500" />
                                <span>Remind</span>
                              </button>
                              <button
                                onClick={() => setSelectedCustomerForPayment(customer)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                              >
                                Pay
                              </button>
                            </>
                          ) : customer.name === 'Rajesh G' || due > 0 ? (
                            /* Case 3: Rajesh G -> Blue "Pay" button */
                            <button
                              onClick={() => setSelectedCustomerForPayment(customer)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                            >
                              Pay
                            </button>
                          ) : (
                            /* Case 4: Suresh Kumar, Anitha Selvam, Meena Sundaram -> "View Profile" */
                            <>
                              <button
                                onClick={() => setSelectedCustomerForLedger(customer)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50/70 hover:bg-blue-100/80 text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                <span>View Profile</span>
                                {customer.name === 'Suresh Kumar' && <ChevronRight className="w-3.5 h-3.5 text-blue-500" />}
                              </button>
                              {/* Edit Pencil Icon (shown on Suresh Kumar row) */}
                              {customer.name === 'Suresh Kumar' && (
                                <button
                                  onClick={() => setSelectedCustomerForLedger(customer)}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                                  title="Edit Customer"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}

                          {/* 3-dots More Actions Menu */}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setActionDropdownId(
                                  actionDropdownId === custKey ? null : custKey
                                )
                              }
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {/* Dropdown Menu */}
                            {actionDropdownId === custKey && (
                              <div
                                className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 text-left text-xs animate-in fade-in zoom-in-95 duration-100"
                                onMouseLeave={() => setActionDropdownId(null)}
                              >
                                <button
                                  onClick={() => {
                                    setSelectedCustomerForLedger(customer);
                                    setActionDropdownId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 font-semibold text-slate-700"
                                >
                                  Account Statement
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedCustomerForPayment(customer);
                                    setActionDropdownId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 font-semibold text-slate-700"
                                >
                                  Collect Payment
                                </button>
                                <a
                                  href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block w-full text-left px-3.5 py-1.5 hover:bg-slate-50 font-semibold text-emerald-600"
                                >
                                  WhatsApp Message
                                </a>
                                <div className="border-t border-slate-100 my-1"></div>
                                <button
                                  onClick={() => {
                                    alert(`Customer record ${customer.id} archived.`);
                                    setActionDropdownId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 hover:bg-rose-50 font-semibold text-rose-600"
                                >
                                  Archive Patron
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* TABLE FOOTER / PAGINATION BAR */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-800">1 - {paginatedCustomers.length}</span> of{' '}
            <span className="font-bold text-slate-800">248</span> registered customers
          </div>

          {/* Pagination buttons matching screenshot */}
          <div className="flex items-center gap-1 select-none">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none text-slate-700 font-medium transition-all"
            >
              Previous
            </button>

            <button
              onClick={() => setCurrentPage(1)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                currentPage === 1
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100 bg-white border border-slate-200'
              }`}
            >
              1
            </button>

            <button
              onClick={() => setCurrentPage(2)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                currentPage === 2
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100 bg-white border border-slate-200'
              }`}
            >
              2
            </button>

            <button
              onClick={() => setCurrentPage(3)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                currentPage === 3
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100 bg-white border border-slate-200'
              }`}
            >
              3
            </button>

            <span className="px-1 text-slate-400">...</span>

            <button
              onClick={() => setCurrentPage(totalPages)}
              className="w-7 h-7 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 bg-white border border-slate-200 transition-all"
            >
              42
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none text-slate-700 font-medium transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Collect Payment Modal */}
      <CollectPaymentModal
        isOpen={!!selectedCustomerForPayment}
        onClose={() => setSelectedCustomerForPayment(null)}
        customer={selectedCustomerForPayment}
        onPaymentSettled={handlePaymentSettled}
      />

      {/* Full Customer Ledger / Statement Modal */}
      <CustomerLedgerModal
        isOpen={!!selectedCustomerForLedger}
        onClose={() => setSelectedCustomerForLedger(null)}
        customer={selectedCustomerForLedger}
        onCollectPayment={(cust) => setSelectedCustomerForPayment(cust)}
      />
    </div>
  );
};

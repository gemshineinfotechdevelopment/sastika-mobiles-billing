import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  UserPlus,
  IndianRupee,
  FileText,
  X,
  Phone,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import type { Customer } from '../types';
import { CollectPaymentModal } from '../components/modals/CollectPaymentModal';
import { CustomerLedgerModal } from '../components/modals/CustomerLedgerModal';
import { api } from '../services/api';

interface CustomersPageProps {
  onOpenAddCustomer: () => void;
  onSelectCustomerForBill?: (customer: Customer) => void;
  refreshTrigger?: number;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({
  onOpenAddCustomer,
  refreshTrigger,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'due' | 'settled'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modals state
  const [selectedCustomerForLedger, setSelectedCustomerForLedger] = useState<Customer | null>(null);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load live customers from database
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.getCustomers();
      if (res && res.customers) {
        setCustomers(res.customers);
      }
    } catch (err) {
      console.warn('Could not load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [refreshTrigger]);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q));

      const due = c.khataBalance || 0;
      let matchTab = true;
      if (activeTab === 'due') {
        matchTab = due > 0;
      } else if (activeTab === 'settled') {
        matchTab = due === 0;
      }

      return matchSearch && matchTab;
    });
  }, [customers, searchTerm, activeTab]);

  // Pagination
  const totalItems = filteredCustomers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  // Overall Khata Due
  const totalKhataDue = useMemo(() => {
    return customers.reduce((acc, c) => acc + (c.khataBalance || 0), 0);
  }, [customers]);

  const dueCustomersCount = useMemo(() => {
    return customers.filter((c) => (c.khataBalance || 0) > 0).length;
  }, [customers]);

  // Payment collected callback
  const handlePaymentCollectedSuccess = (
    customerId: string,
    amount: number,
    _notes?: string
  ) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const updatedBal = Math.max(0, (c.khataBalance || 0) - amount);
          return {
            ...c,
            khataBalance: updatedBal,
            khataStatus: updatedBal === 0 ? 'settled' : 'pending',
          };
        }
        return c;
      })
    );
    setSelectedCustomerForPayment(null);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 1. Header with Stats & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Customers & Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Total Customers: <strong className="text-slate-900 font-bold">{customers.length}</strong> • Total Due Pending: <strong className="text-rose-600 font-bold font-sans">₹{totalKhataDue.toLocaleString('en-IN')}</strong> ({dueCustomersCount} customers)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchCustomers}
            disabled={loading}
            title="Refresh Customers List from Database"
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer shadow-2xs active:scale-98 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddCustomer}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs active:scale-98"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Customer (Alt+C)</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Tab Filter Bar */}
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
            placeholder="Search by customer name, mobile number, or address..."
            className="w-full pl-9 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          {(['all', 'due', 'settled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'due' ? 'Balance Due' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Clean Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-right">Total Purchases</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading customers from database...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((customer) => {
                  const due = customer.khataBalance || 0;
                  return (
                    <tr key={customer.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {customer.name}
                        {customer.tier && (
                          <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">
                            {customer.tier === 'KHATA RISK' ? 'HIGH RISK' : customer.tier}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        <a href={`tel:${customer.phone}`} className="hover:underline flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{customer.phone}</span>
                        </a>
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate">
                        {customer.address || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-sans whitespace-nowrap">
                        {due > 0 ? (
                          <span className="font-black text-rose-600">
                            ₹{due.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="font-semibold text-emerald-600 text-[11px]">
                            Settled
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700 font-sans font-semibold whitespace-nowrap">
                        ₹{(customer.lifetimeSales || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {due > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedCustomerForPayment(customer)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer shadow-2xs"
                            >
                              <IndianRupee className="w-3 h-3" />
                              <span>Collect</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedCustomerForLedger(customer)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold cursor-pointer"
                          >
                            <FileText className="w-3 h-3 text-slate-400" />
                            <span>Ledger</span>
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

        {/* Mobile Customer Cards View (sm:hidden) */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {paginatedCustomers.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs px-4">
              No customers found matching your criteria.
            </div>
          ) : (
            paginatedCustomers.map((customer) => {
              const due = customer.khataBalance || 0;
              return (
                <div key={customer.id} className="p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h4 className="font-bold text-slate-900 text-xs leading-snug">
                          {customer.name}
                        </h4>
                        {customer.tier && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-blue-50 text-blue-700">
                            {customer.tier}
                          </span>
                        )}
                      </div>
                      <a
                        href={`tel:${customer.phone}`}
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-blue-600 hover:underline"
                      >
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{customer.phone}</span>
                      </a>
                      {customer.address && (
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {customer.address}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      {due > 0 ? (
                        <>
                          <span className="text-[10px] text-rose-500 font-bold block">Khata Due</span>
                          <span className="font-black text-sm text-rose-600 font-sans block">
                            ₹{due.toLocaleString('en-IN')}
                          </span>
                        </>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          Settled
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Purchases: ₹{(customer.lifetimeSales || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-50">
                    <button
                      type="button"
                      onClick={() => setSelectedCustomerForLedger(customer)}
                      className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                    >
                      <FileText className="w-3 h-3 text-slate-400" />
                      <span>Ledger</span>
                    </button>
                    {due > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedCustomerForPayment(customer)}
                        className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-2xs"
                      >
                        <IndianRupee className="w-3 h-3" />
                        <span>Collect Due</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(totalItems, currentPage * itemsPerPage)} of {totalItems} customers
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

      {/* Modals */}
      <CollectPaymentModal
        isOpen={Boolean(selectedCustomerForPayment)}
        customer={selectedCustomerForPayment}
        onClose={() => setSelectedCustomerForPayment(null)}
        onPaymentSettled={handlePaymentCollectedSuccess}
      />

      <CustomerLedgerModal
        isOpen={Boolean(selectedCustomerForLedger)}
        customer={selectedCustomerForLedger}
        onClose={() => setSelectedCustomerForLedger(null)}
      />
    </div>
  );
};

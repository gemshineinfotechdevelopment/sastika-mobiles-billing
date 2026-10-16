import React, { useState, useEffect } from 'react';
import { Search, UserPlus } from 'lucide-react';
import type { Customer } from '../types';
import { api } from '../services/api';

interface CustomersPageProps {
  onOpenAddCustomer: () => void;
  onSelectCustomerForBill?: (customer: Customer) => void;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({
  onOpenAddCustomer,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fallback customers if server is not yet seeded
  const initialCustomers: Customer[] = [
    {
      id: 'cust-1',
      name: 'Vignesh R',
      phone: '+91 98401 23456',
      email: 'vignesh.r@gmail.com',
      address: 'Main Bazaar, Madurai',
    },
    {
      id: 'cust-2',
      name: 'Deepak Kumar',
      phone: '+91 97890 88211',
      email: 'deepak.kumar@yahoo.com',
      address: 'KK Nagar, Chennai',
    },
    {
      id: 'cust-3',
      name: 'Kavitha Mehra',
      phone: '+91 94441 55092',
      email: 'kavitha.m@outlook.com',
      address: 'Anna Salai, Chennai',
      gstin: '33ABCDE1234F1Z5',
    },
    {
      id: 'cust-4',
      name: 'S. Karthikeyan',
      phone: '+91 98410 77341',
      address: 'Town Hall Road, Madurai',
    },
    {
      id: 'cust-5',
      name: 'M. Balaji',
      phone: '+91 99620 44510',
      address: 'RS Puram, Coimbatore',
    },
  ];

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.getCustomers();
        if (res.customers && res.customers.length > 0) {
          setCustomers(res.customers);
        } else {
          setCustomers(initialCustomers);
        }
      } catch {
        setCustomers(initialCustomers);
      }
    };
    fetchCustomers();
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.gstin && c.gstin.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customer Directory</h1>
          <p className="text-xs text-slate-500">
            Registered buyers, frequent shoppers & GST enterprise accounts
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Registered Accounts</h2>
            <p className="text-xs text-slate-500">
              Total {customers.length} verified contact records
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, phone or GSTIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600 focus:bg-white"
              />
            </div>

            <button
              onClick={onOpenAddCustomer}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer active:scale-98"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          </div>
        </div>

        {/* Customers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">CUSTOMER NAME</th>
                <th className="py-3 px-4">PHONE NUMBER</th>
                <th className="py-3 px-4">EMAIL</th>
                <th className="py-3 px-4">CITY / ADDRESS</th>
                <th className="py-3 px-4">GSTIN (B2B)</th>
                <th className="py-3 px-4 text-center">TYPE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No customers found
                  </td>
                </tr>
              ) : (
                filtered.map((cust, idx) => (
                  <tr key={cust.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {cust.name.charAt(0)}
                      </div>
                      <span>{cust.name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {cust.phone}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {cust.email || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {cust.address || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {cust.gstin || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          cust.gstin
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {cust.gstin ? 'B2B Trade' : 'Retail'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

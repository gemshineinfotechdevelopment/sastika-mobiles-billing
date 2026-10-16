import React from 'react';
import { Plus } from 'lucide-react';

export const PurchasesPage: React.FC = () => {
  const purchaseOrders = [
    {
      id: 'PO-2024-089',
      vendor: 'Redington India Ltd (Apple & Oneplus Distributor)',
      date: '2024-10-22',
      itemsCount: 15,
      totalAmount: 345000,
      status: 'Received',
      paymentStatus: 'Paid',
    },
    {
      id: 'PO-2024-088',
      vendor: 'Supertron Electronics (Accessories & Audio)',
      date: '2024-10-20',
      itemsCount: 80,
      totalAmount: 78500,
      status: 'Received',
      paymentStatus: 'Paid',
    },
    {
      id: 'PO-2024-087',
      vendor: 'Samsung Mobile Regional Warehouse',
      date: '2024-10-18',
      itemsCount: 10,
      totalAmount: 289000,
      status: 'Received',
      paymentStatus: 'Credit (15 Days)',
    },
    {
      id: 'PO-2024-086',
      vendor: 'Spigen India Wholesale Partner',
      date: '2024-10-15',
      itemsCount: 120,
      totalAmount: 24000,
      status: 'Received',
      paymentStatus: 'Paid',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Purchases & Inward Stock</h1>
          <p className="text-xs text-slate-500">
            Track vendor shipments, supplier bills and stock replenishment
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Purchase Orders & Consignments</h2>
            <p className="text-xs text-slate-500">
              Recent consignments received from authorized distributors
            </p>
          </div>

          <button
            onClick={() => alert('New Stock Inward modal: Enter vendor invoice details and device IMEIs.')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>New Stock Inward</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">PO NUMBER</th>
                <th className="py-3 px-4">SUPPLIER / DISTRIBUTOR</th>
                <th className="py-3 px-4">DATE</th>
                <th className="py-3 px-4">ITEMS</th>
                <th className="py-3 px-4 text-right">PURCHASE VALUE</th>
                <th className="py-3 px-4 text-center">STATUS</th>
                <th className="py-3 px-4 text-center">PAYMENT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold font-mono text-blue-600">
                    {po.id}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {po.vendor}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono">
                    {po.date}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {po.itemsCount} units
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900 font-mono">
                    ₹{po.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {po.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                      {po.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

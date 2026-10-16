import React from 'react';
import { Download } from 'lucide-react';
import type { Bill } from '../types';

interface ReportsViewProps {
  bills: Bill[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ bills }) => {
  const totalGross = bills.reduce((acc, b) => acc + (b.grandTotal || 0), 0) + 842300;
  const totalTaxCollected = bills.reduce((acc, b) => acc + (b.totalTax || 0), 0) + 7425;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Financial & GST Reports</h2>
            <p className="text-xs text-slate-500">
              Tax compliance reports, GSTR-1 summary and sales breakdown
            </p>
          </div>

          <button
            onClick={() => alert('Exporting GSTR-1 JSON and Excel report...')}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download GSTR-1 Excel</span>
          </button>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <p className="text-xs font-semibold text-slate-500">Total Store Revenue (MTD)</p>
            <p className="text-2xl font-black text-slate-900 font-mono mt-1">₹{totalGross.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-emerald-600 font-bold mt-1">↑ 18.4% vs last month</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <p className="text-xs font-semibold text-slate-500">Total Output GST Collected</p>
            <p className="text-2xl font-black text-slate-900 font-mono mt-1">
              ₹{totalTaxCollected.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">CGST 9% + SGST 9% (18% bracket)</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <p className="text-xs font-semibold text-slate-500">Average Bill Size</p>
            <p className="text-2xl font-black text-slate-900 font-mono mt-1">₹14,580</p>
            <p className="text-[11px] text-blue-600 font-medium mt-1">Driven by 5G Handset upgrades</p>
          </div>
        </div>
      </div>

      {/* Tax Breakdown Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3">HSN / Tax Slab Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">HSN CODE</th>
                <th className="py-2.5 px-3">CATEGORY DESCRIPTION</th>
                <th className="py-2.5 px-3 text-center">GST RATE</th>
                <th className="py-2.5 px-3 text-right">TAXABLE VALUE</th>
                <th className="py-2.5 px-3 text-right">CGST</th>
                <th className="py-2.5 px-3 text-right">SGST</th>
                <th className="py-2.5 px-3 text-right">TOTAL TAX</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr>
                <td className="py-3 px-3 font-bold text-blue-600">85171300</td>
                <td className="py-3 px-3 font-sans font-medium text-slate-800">Smartphones & Cellular Phones</td>
                <td className="py-3 px-3 text-center">18%</td>
                <td className="py-3 px-3 text-right">₹6,85,000</td>
                <td className="py-3 px-3 text-right">₹61,650</td>
                <td className="py-3 px-3 text-right">₹61,650</td>
                <td className="py-3 px-3 text-right font-bold text-slate-900">₹1,23,300</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-blue-600">85044030</td>
                <td className="py-3 px-3 font-sans font-medium text-slate-800">Fast Chargers & Adapters</td>
                <td className="py-3 px-3 text-center">18%</td>
                <td className="py-3 px-3 text-right">₹48,200</td>
                <td className="py-3 px-3 text-right">₹4,338</td>
                <td className="py-3 px-3 text-right">₹4,338</td>
                <td className="py-3 px-3 text-right font-bold text-slate-900">₹8,676</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-blue-600">85183000</td>
                <td className="py-3 px-3 font-sans font-medium text-slate-800">TWS Earbuds & Headsets</td>
                <td className="py-3 px-3 text-center">18%</td>
                <td className="py-3 px-3 text-right">₹62,100</td>
                <td className="py-3 px-3 text-right">₹5,589</td>
                <td className="py-3 px-3 text-right">₹5,589</td>
                <td className="py-3 px-3 text-right font-bold text-slate-900">₹11,178</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-blue-600">70071900</td>
                <td className="py-3 px-3 font-sans font-medium text-slate-800">Tempered Screen Protectors</td>
                <td className="py-3 px-3 text-center">18%</td>
                <td className="py-3 px-3 text-right">₹47,000</td>
                <td className="py-3 px-3 text-right">₹4,230</td>
                <td className="py-3 px-3 text-right">₹4,230</td>
                <td className="py-3 px-3 text-right font-bold text-slate-900">₹8,460</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

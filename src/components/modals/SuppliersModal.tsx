import React from 'react';
import { X, Building2, Phone, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';
import type { Supplier } from '../../types';
import { INITIAL_SUPPLIERS } from '../../data/initialPurchases';

interface SuppliersModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers?: Supplier[];
}

export const SuppliersModal: React.FC<SuppliersModalProps> = ({
  isOpen,
  onClose,
  suppliers = INITIAL_SUPPLIERS,
}) => {
  if (!isOpen) return null;

  const totalPayables = suppliers.reduce((acc, s) => acc + (s.balanceDue || 0), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Authorized Suppliers &amp; Vendors</h3>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {suppliers.length} Active Partners
                </span>
              </div>
              <p className="text-slate-500 text-xs">
                Direct OEM brand partners, regional distributors, and wholesale accessory channels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Payables summary banner */}
        <div className="px-6 py-3 bg-amber-50/70 border-b border-amber-200/60 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span className="font-medium">Total Vendor Credit (Khata) Balance Outstanding:</span>
          </div>
          <span className="font-bold font-mono text-sm text-rose-700">
            ₹{totalPayables.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Body list */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200/90 rounded-xl p-4 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                        {supplier.id}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 mt-1">{supplier.name}</h4>
                      <p className="text-[11px] text-blue-700 font-semibold">{supplier.category}</p>
                    </div>
                    {supplier.balanceDue && supplier.balanceDue > 0 ? (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-700 shrink-0">
                        ₹{(supplier.balanceDue / 1000).toFixed(1)}k Due
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                        Settled
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-1 text-slate-600 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{supplier.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono">{supplier.phone}</span>
                      <span className="text-slate-400">({supplier.contactPerson})</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-slate-500">
                      <span>GST: {supplier.gstin}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">
                    Total Inward: <strong className="text-slate-800 font-mono">₹{supplier.totalPurchases?.toLocaleString('en-IN')}</strong>
                  </span>
                  <a
                    href={`tel:${supplier.phone}`}
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                  >
                    <span>Contact Vendor</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl cursor-pointer"
          >
            Close Directory
          </button>
        </div>
      </div>
    </div>
  );
};

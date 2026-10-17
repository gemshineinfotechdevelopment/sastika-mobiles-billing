import React, { useState } from 'react';
import { X, Printer, Check } from 'lucide-react';
import type { Product } from '../../types';

interface PrintBarcodeModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintBarcodeModal: React.FC<PrintBarcodeModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const [copies, setCopies] = useState(2);
  const [selectedImei, setSelectedImei] = useState('');

  if (!isOpen || !product) return null;

  const handlePrint = () => {
    window.print();
  };

  const barcodeText = selectedImei || product.sku || product.ean || `SKU-${product.id}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Thermal Barcode Sticker</h3>
              <p className="text-slate-500 text-xs">Print 50x25mm shelf/box barcode label</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Controls */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Print Copies</label>
              <input
                type="number"
                min="1"
                max="50"
                value={copies}
                onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-xs"
              />
            </div>
            {product.imeiNumbers && product.imeiNumbers.length > 0 && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target IMEI</label>
                <select
                  value={selectedImei}
                  onChange={(e) => setSelectedImei(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                >
                  <option value="">Default SKU Barcode</option>
                  {product.imeiNumbers.map((imei) => (
                    <option key={imei} value={imei}>
                      {imei}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Barcode Label Thermal Preview */}
          <div className="p-4 bg-slate-100 rounded-xl flex items-center justify-center">
            <div
              id="printable-barcode-label"
              className="w-64 bg-white border border-slate-300 rounded-lg p-3 text-center shadow-xs space-y-1 font-mono"
            >
              <p className="font-extrabold text-[11px] text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-1">
                SASTIKA MOBILES
              </p>
              <p className="font-bold text-slate-900 text-xs line-clamp-1">{product.name}</p>
              {product.variant && (
                <p className="text-[10px] text-slate-500 font-medium">({product.variant})</p>
              )}

              {/* Barcode representation */}
              <div className="py-1.5 flex flex-col items-center">
                <div className="flex items-center justify-center h-10 w-48 bg-slate-50 border border-slate-200 px-2 rounded-xs">
                  <div className="flex items-end gap-0.5 h-7">
                    {[...Array(28)].map((_, i) => (
                      <span
                        key={i}
                        className={`bg-slate-900 ${
                          i % 3 === 0
                            ? 'w-1 h-7'
                            : i % 2 === 0
                            ? 'w-0.5 h-6'
                            : 'w-0.5 h-7'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-[10px] font-mono tracking-widest text-slate-700 font-bold mt-1">
                  {barcodeText}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-1 flex items-center justify-between">
                <span className="text-[9px] text-slate-500">Rack: {product.rackLocation || 'A1'}</span>
                <span className="font-extrabold text-xs text-slate-900">
                  MRP: ₹{product.price.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[8px] text-slate-400">INCL. OF ALL TAXES</p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print {copies} Sticker{copies > 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

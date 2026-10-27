import React, { useState, useEffect } from 'react';
import { Printer, X, Receipt, FileText } from 'lucide-react';
import type { Bill } from '../types';
import { api } from '../services/api';
import sastikaLogo from '../assets/sastika-logo.jpeg';

interface InvoiceModalProps {
  bill: Bill;
  onClose: () => void;
}

type PrintFormat = '80mm' | '58mm' | 'a4';

const parseSavedFormat = (val: string | null): PrintFormat => {
  if (!val) return '80mm';
  const s = val.toLowerCase();
  if (s.includes('58') || s.includes('2-inch') || s.includes('2 inch')) return '58mm';
  if (s.includes('a4') || s.includes('laser')) return 'a4';
  return '80mm';
};

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ bill, onClose }) => {
  const [printFormat, setPrintFormat] = useState<PrintFormat>(() => {
    return parseSavedFormat(localStorage.getItem('sastika_printer_type'));
  });

  const [shopName, setShopName] = useState(import.meta.env.VITE_SHOP_NAME || 'SASTIKA MOBILES');
  const [shopPhone, setShopPhone] = useState(import.meta.env.VITE_SHOP_PHONE || '+91 98765 43210');
  const [shopAddress, setShopAddress] = useState(import.meta.env.VITE_SHOP_ADDRESS || '124 Bazaar Main Road, Madurai, Tamil Nadu - 625001');
  const [shopGstin, setShopGstin] = useState(import.meta.env.VITE_SHOP_GSTIN || '33AAAAA0000A1Z5');
  const [footerNote, setFooterNote] = useState('Thank you for shopping with Sastika Mobiles! Items with physical damage are not eligible for warranty.');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Sync with store settings & storage events
  useEffect(() => {
    api.getSettings()
      .then((res) => {
        if (res.success && res.settings) {
          const s = res.settings as Record<string, any>;
          if (s.shopName) setShopName(s.shopName);
          if (s.phone) setPhoneIfPresent(s.phone);
          if (s.address) setShopAddress(s.address);
          if (s.gstin) setShopGstin(s.gstin);
          if (s.thermalPrinter?.printFooterNote) setFooterNote(s.thermalPrinter.printFooterNote);
          if (s.thermalPrinter?.paperSize) {
            setPrintFormat(parseSavedFormat(s.thermalPrinter.paperSize));
          }
        }
      })
      .catch((err) => console.warn('Could not load invoice shop settings:', err));

    const onPrinterSettingChanged = () => {
      setPrintFormat(parseSavedFormat(localStorage.getItem('sastika_printer_type')));
    };
    window.addEventListener('printerSettingChanged', onPrinterSettingChanged);
    return () => window.removeEventListener('printerSettingChanged', onPrinterSettingChanged);
  }, []);

  const setPhoneIfPresent = (val: string) => {
    if (val) setShopPhone(val);
  };

  const handleSwitchFormat = (format: PrintFormat) => {
    setPrintFormat(format);
    const label = format === '58mm' ? '2-inch Thermal (58mm)' : format === 'a4' ? 'A4 Standard Laser' : '3-inch Thermal (80mm)';
    localStorage.setItem('sastika_printer_type', label);
    window.dispatchEvent(new Event('printerSettingChanged'));
  };

  const handlePrint = () => {
    window.print();
  };

  const totalQuantity = bill.items.reduce((acc, i) => acc + (i.quantity || 1), 0);
  const formattedDate = bill.date || new Date().toISOString().slice(0, 10);
  const formattedTime = bill.time || '12:00 PM';

  // Responsive modal width based on chosen format
  const modalMaxWidth =
    printFormat === '58mm'
      ? 'max-w-sm'
      : printFormat === '80mm'
      ? 'max-w-md'
      : 'max-w-3xl';

  const printClass =
    printFormat === '58mm'
      ? 'format-thermal-58mm'
      : printFormat === '80mm'
      ? 'format-thermal-80mm'
      : 'format-a4-laser';

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
    >
      <div className={`bg-white rounded-2xl shadow-2xl ${modalMaxWidth} w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 cursor-default transition-all`}>
        {/* Action Header - Hidden on Print */}
        <div className="px-5 py-3.5 bg-slate-900 text-white no-print space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={sastikaLogo}
                alt="Sastika Mobiles"
                className="w-7 h-7 rounded-lg object-contain bg-white/10 p-0.5 border border-slate-700 shrink-0"
              />
              <span className="font-semibold text-xs sm:text-sm">Invoice #{bill.invoiceNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Bill</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Format Switcher Tabs */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
            <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">Printing Model:</span>
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleSwitchFormat('80mm')}
                className={`flex-1 sm:flex-none px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  printFormat === '80mm'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Receipt className="w-3 h-3" />
                <span>80mm (3")</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchFormat('58mm')}
                className={`flex-1 sm:flex-none px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  printFormat === '58mm'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Receipt className="w-3 h-3" />
                <span>58mm (2")</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchFormat('a4')}
                className={`flex-1 sm:flex-none px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  printFormat === 'a4'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>A4 Laser</span>
              </button>
            </div>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div id="printable-invoice" className={`p-4 sm:p-6 text-slate-900 bg-white ${printClass}`}>

          {/* ══════════════════════════════════════════════════════════════════
              FORMAT 1: 58mm ULTRA-COMPACT THERMAL SLIP
             ══════════════════════════════════════════════════════════════════ */}
          {printFormat === '58mm' && (
            <div className="font-mono text-[10px] leading-tight space-y-2 text-slate-950">
              {/* Header */}
              <div className="text-center pb-1.5 thermal-border-b border-b border-dashed border-slate-900">
                <img
                  src={sastikaLogo}
                  alt="Sastika Mobiles"
                  className="w-10 h-10 mx-auto rounded-full object-contain mb-1"
                />
                <p className="font-black text-xs uppercase tracking-tight">{shopName}</p>
                <p className="text-[9px] text-slate-700 leading-snug mt-0.5">{shopAddress}</p>
                <p className="text-[9px] text-slate-700">Ph: {shopPhone}</p>
                <p className="text-[9px] font-bold mt-0.5">GSTIN: {shopGstin}</p>
                <p className="text-[9px] font-black uppercase mt-1 bg-slate-100 py-0.5 tracking-wider">
                  ** CASH MEMO (58mm) **
                </p>
              </div>

              {/* Meta */}
              <div className="text-[9px] text-slate-800 thermal-border-b border-b border-dashed border-slate-900 pb-1 space-y-0.5">
                <div className="flex justify-between">
                  <span>INV: #{bill.invoiceNumber}</span>
                  <span>{formattedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>TIME: {formattedTime}</span>
                  <span className="uppercase">{bill.paymentMode || 'Cash'}</span>
                </div>
                <div className="flex justify-between">
                  <span>CUST: {bill.customer?.name || 'Customer'}</span>
                  <span>{bill.customer?.phone || ''}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 py-1 thermal-border-b border-b border-dashed border-slate-900 text-[10px]">
                {bill.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between font-bold text-slate-950">
                      <span className="truncate pr-1">{idx + 1}. {item.name}</span>
                      <span className="shrink-0 font-mono">₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[8.5px] text-slate-600 font-mono pl-3">
                      <span>{item.quantity}x @ ₹{item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      <span>GST {item.gstRate || 18}%</span>
                    </div>
                    {item.imei && (
                      <div className="text-[8px] text-slate-600 font-mono pl-3">
                        IMEI: {item.imei}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Totals Summary */}
              <div className="space-y-1 text-[10px] pt-1 thermal-border-b border-b border-dashed border-slate-900 pb-1.5">
                <div className="flex justify-between text-[9px] text-slate-700">
                  <span>Items / Qty:</span>
                  <span>{bill.items.length} / {totalQuantity} Nos</span>
                </div>
                <div className="flex justify-between text-[9px] text-slate-700">
                  <span>Taxable:</span>
                  <span className="font-mono">₹{bill.subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-[9px] text-slate-700">
                  <span>CGST + SGST:</span>
                  <span className="font-mono">₹{(bill.cgstTotal + bill.sgstTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {((bill.discount ?? 0) > 0) && (
                  <div className="flex justify-between text-[9px] text-rose-700 font-bold">
                    <span>Discount {bill.discountPercent ? `(${bill.discountPercent}%)` : ''}:</span>
                    <span className="font-mono">-₹{(bill.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-xs text-slate-950 pt-0.5 border-t border-slate-900">
                  <span>NET TOTAL:</span>
                  <span className="font-mono">₹{bill.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-[9px] font-bold text-emerald-800">
                  <span>Paid ({bill.paymentMode || 'Cash'}):</span>
                  <span className="font-mono">₹{(bill.paidAmount ?? bill.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {(bill.balanceDue ?? 0) > 0 && (
                  <div className="flex justify-between text-[9px] font-bold text-rose-800">
                    <span>Balance Due:</span>
                    <span className="font-mono">₹{bill.balanceDue?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {bill.emiDetails?.isEmi && (
                  <div className="pt-1 text-[8.5px] border-t border-dotted border-slate-700 space-y-0.5 text-slate-800">
                    <div className="font-bold uppercase text-[9px]">★ PHONE EMI ({bill.emiDetails.tenureMonths}M) ★</div>
                    <div className="flex justify-between">
                      <span>Down Payment:</span>
                      <span className="font-mono">₹{bill.emiDetails.downPayment.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-950">
                      <span>Monthly EMI:</span>
                      <span className="font-mono">₹{bill.emiDetails.monthlyEmi.toLocaleString('en-IN')}/mo</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="text-center pt-1 text-[8.5px] text-slate-700 space-y-1">
                <p className="text-[8px] leading-tight text-slate-600">{footerNote}</p>
                <p className="font-black text-slate-900 tracking-wider">*** THANK YOU ***</p>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              FORMAT 2: 80mm STANDARD POS THERMAL RECEIPT (ESC/POS)
             ══════════════════════════════════════════════════════════════════ */}
          {printFormat === '80mm' && (
            <div className="font-mono text-xs leading-normal space-y-2.5 text-slate-950">
              {/* Header */}
              <div className="text-center pb-2 thermal-border-b border-b border-dashed border-slate-900">
                <img
                  src={sastikaLogo}
                  alt="Sastika Mobiles"
                  className="w-12 h-12 mx-auto rounded-full object-contain mb-1"
                />
                <p className="font-black text-sm uppercase tracking-tight text-slate-950">{shopName}</p>
                <p className="text-[10px] text-slate-700 leading-tight mt-0.5">{shopAddress}</p>
                <p className="text-[10px] text-slate-700">Official Mobile: {shopPhone}</p>
                <p className="text-[10px] font-bold text-slate-900 mt-0.5">GSTIN: {shopGstin}</p>
                <div className="mt-1.5 inline-block px-3 py-0.5 bg-slate-900 text-white rounded font-bold text-[10px] uppercase tracking-wider">
                  TAX INVOICE (80MM ESC/POS)
                </div>
              </div>

              {/* Meta */}
              <div className="text-[10px] text-slate-800 thermal-border-b border-b border-dashed border-slate-900 pb-1.5 space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>INVOICE: #{bill.invoiceNumber}</span>
                  <span>{formattedDate} {formattedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span>CUSTOMER: <strong className="text-slate-900">{bill.customer.name}</strong></span>
                  <span>TEL: {bill.customer.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>PAYMENT MODE: <strong className="uppercase text-slate-900">{bill.paymentMode || 'Cash'}</strong></span>
                  <span>COUNTER: Terminal 01</span>
                </div>
                {bill.customer.gstin && (
                  <div>
                    <span>CUST GSTIN: <strong className="font-bold">{bill.customer.gstin}</strong></span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="py-1 thermal-border-b border-b border-dashed border-slate-900">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-dashed border-slate-900 text-[10px] uppercase font-black text-slate-900">
                      <th className="pb-1 text-left">ITEM</th>
                      <th className="pb-1 text-center w-8">QTY</th>
                      <th className="pb-1 text-right w-16">RATE</th>
                      <th className="pb-1 text-right w-20">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashed divide-slate-200">
                    {bill.items.map((item, idx) => (
                      <tr key={idx} className="align-top">
                        <td className="py-1 pr-1 font-semibold text-slate-950">
                          <div>{item.name}</div>
                          {item.imei && (
                            <div className="text-[9.5px] text-slate-600 font-normal">
                              IMEI: {item.imei}
                            </div>
                          )}
                          {item.model && !item.imei && (
                            <div className="text-[9.5px] text-slate-500 font-normal">
                              {item.model}
                            </div>
                          )}
                        </td>
                        <td className="py-1 text-center font-bold">{item.quantity}</td>
                        <td className="py-1 text-right font-mono text-[10.5px]">
                          ₹{item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-1 text-right font-mono font-bold text-slate-950 text-[11px]">
                          ₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="pt-1 space-y-1 text-xs thermal-border-b border-b border-dashed border-slate-900 pb-2">
                <div className="flex justify-between text-[10.5px] text-slate-700">
                  <span>Total Items / Total Units:</span>
                  <span className="font-bold text-slate-900">{bill.items.length} Items / {totalQuantity} Nos</span>
                </div>
                <div className="flex justify-between text-[10.5px] text-slate-700">
                  <span>Taxable Value:</span>
                  <span className="font-mono">₹{bill.subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-[10.5px] text-slate-700">
                  <span>CGST (9%):</span>
                  <span className="font-mono">₹{bill.cgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-[10.5px] text-slate-700">
                  <span>SGST (9%):</span>
                  <span className="font-mono">₹{bill.sgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {((bill.discount ?? 0) > 0) && (
                  <div className="flex justify-between text-[10.5px] text-rose-700 font-bold">
                    <span>Discount {bill.discountPercent ? `(${bill.discountPercent}%)` : ''}:</span>
                    <span className="font-mono">-₹{(bill.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm text-slate-950 border-t-2 border-slate-900 pt-1.5 mt-1">
                  <span>GRAND TOTAL:</span>
                  <span className="font-mono text-base">₹{bill.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-emerald-800">
                  <span>Amount Paid ({bill.paymentMode || 'Cash'}):</span>
                  <span className="font-mono">₹{(bill.paidAmount ?? bill.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {(bill.balanceDue ?? 0) > 0 && (
                  <div className="flex justify-between text-xs font-bold text-rose-800">
                    <span>Balance Due:</span>
                    <span className="font-mono">₹{bill.balanceDue?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {bill.emiDetails?.isEmi && (
                  <div className="pt-2 mt-1.5 border-t border-dashed border-slate-900 space-y-1 text-[10.5px]">
                    <div className="font-black text-slate-950 uppercase text-[11px] text-center bg-slate-100 py-0.5 rounded">
                      ★ IN-STORE PHONE EMI PLAN ({bill.emiDetails.tenureMonths} MONTHS) ★
                    </div>
                    {bill.emiDetails.modelName && (
                      <div className="flex justify-between text-slate-700">
                        <span>Device Financed:</span>
                        <strong className="text-slate-900">{bill.emiDetails.modelName}</strong>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-700">
                      <span>Initial Down Payment:</span>
                      <span className="font-mono font-bold text-emerald-800">₹{bill.emiDetails.downPayment.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Principal Balance:</span>
                      <span className="font-mono">₹{bill.emiDetails.principalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {bill.emiDetails.interestRate > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>Interest ({bill.emiDetails.interestRate}%):</span>
                        <span className="font-mono">+₹{bill.emiDetails.interestAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {(bill.emiDetails.serviceCharge || 0) > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>Processing Fee:</span>
                        <span className="font-mono">+₹{bill.emiDetails.serviceCharge?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[11.5px] font-black text-slate-950 pt-1 border-t border-dotted border-slate-400">
                      <span>Monthly Installment (EMI):</span>
                      <span className="font-mono font-black text-slate-950">₹{bill.emiDetails.monthlyEmi.toLocaleString('en-IN', { minimumFractionDigits: 2 })} / Mo</span>
                    </div>
                    {bill.emiDetails.firstDueDate && (
                      <div className="flex justify-between text-[9.5px] text-slate-600">
                        <span>1st Installment Due Date:</span>
                        <span className="font-bold">{bill.emiDetails.firstDueDate}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="text-center pt-2 space-y-1.5 text-[10px] text-slate-700">
                <p className="text-[9.5px] text-slate-600 leading-snug px-4">{footerNote}</p>
                <p className="font-bold text-slate-900 tracking-wider text-[11px] pt-1">*** THANK YOU FOR VISITING SASTIKA MOBILES ***</p>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              FORMAT 3: A4 STANDARD LASER PRINTER (FULL PAGE TABLE)
             ══════════════════════════════════════════════════════════════════ */}
          {printFormat === 'a4' && (
            <div className="space-y-4 text-xs sm:text-sm">
              {/* Shop Header & Title */}
              <div className="border border-slate-900 rounded-t-lg p-4 flex justify-between items-start bg-slate-50/50">
                <div className="flex items-start gap-3">
                  <img
                    src={sastikaLogo}
                    alt="Sastika Mobiles"
                    className="w-14 h-14 rounded-xl object-contain border border-slate-300 shadow-2xs shrink-0 bg-white"
                  />
                  <div>
                    <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight">{shopName}</h1>
                    <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider mb-0.5">Premium Mobiles & Accessories</p>
                    <p className="text-slate-600 text-xs">{shopAddress}</p>
                    <p className="text-slate-600 text-xs">Phone: <strong className="text-slate-900">{shopPhone}</strong></p>
                    <p className="text-slate-900 font-mono text-xs font-bold mt-0.5">GSTIN: {shopGstin}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-slate-900 text-white rounded font-bold text-xs uppercase tracking-wider mb-1.5">
                    TAX INVOICE
                  </span>
                  <p className="font-mono font-black text-base text-slate-900">{bill.invoiceNumber}</p>
                  <p className="text-slate-600 text-xs">Date: <strong className="text-slate-900">{formattedDate}</strong></p>
                  <p className="text-slate-600 text-xs">Time: <strong className="text-slate-900">{formattedTime}</strong></p>
                  <p className="text-slate-600 text-xs">Payment Mode: <strong className="text-slate-900 uppercase">{bill.paymentMode || 'Cash'}</strong></p>
                </div>
              </div>

              {/* Customer Billed To - Structured Box */}
              <div className="border-x border-b border-slate-900 p-3.5 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Billed To (Customer Details):</p>
                  <p className="text-sm font-black text-slate-900">{bill.customer.name}</p>
                  <p className="text-slate-700 font-mono">Mobile: {bill.customer.phone || 'N/A'}</p>
                  {bill.customer.address && <p className="text-slate-600">{bill.customer.address}</p>}
                </div>
                <div className="sm:text-right">
                  <p className="font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Place of Supply:</p>
                  <p className="text-xs font-bold text-slate-900">Tamil Nadu (33)</p>
                  {bill.customer.gstin && (
                    <p className="text-xs font-mono font-bold text-slate-900 mt-1">Customer GSTIN: {bill.customer.gstin}</p>
                  )}
                  <p className="text-[11px] text-slate-500 mt-0.5">Counter: Terminal 01</p>
                </div>
              </div>

              {/* Itemized Goods & Services Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse print-table">
                  <thead>
                    <tr className="bg-slate-100 border border-slate-900 text-slate-900 font-bold text-[11px]">
                      <th className="py-2 px-2 text-center border border-slate-900 w-10">#</th>
                      <th className="py-2 px-2 border border-slate-900">Description of Goods</th>
                      <th className="py-2 px-2 border border-slate-900">IMEI / Serial No</th>
                      <th className="py-2 px-2 text-center border border-slate-900 w-14">Qty</th>
                      <th className="py-2 px-2 text-right border border-slate-900">Rate (₹)</th>
                      <th className="py-2 px-2 text-right border border-slate-900">Taxable (₹)</th>
                      <th className="py-2 px-2 text-center border border-slate-900 w-16">GST</th>
                      <th className="py-2 px-2 text-right border border-slate-900">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.items.map((item, index) => (
                      <tr key={index} className="border border-slate-900 text-slate-900 text-xs">
                        <td className="py-2 px-2 text-center border border-slate-900 font-mono text-slate-500">{index + 1}</td>
                        <td className="py-2 px-2 border border-slate-900 font-bold text-slate-900">
                          <div>{item.name}</div>
                          {item.model && <div className="text-slate-500 text-[10px] font-normal">{item.model}</div>}
                        </td>
                        <td className="py-2 px-2 border border-slate-900 font-mono text-[11px] text-slate-700">
                          {item.imei || '—'}
                        </td>
                        <td className="py-2 px-2 text-center border border-slate-900 font-bold">{item.quantity}</td>
                        <td className="py-2 px-2 text-right border border-slate-900 font-mono">
                          ₹{item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-2 text-right border border-slate-900 font-mono">
                          ₹{(item.taxableAmount || (item.unitPrice * (item.quantity || 1) / 1.18)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-2 text-center border border-slate-900 font-mono text-slate-700">
                          {item.gstRate || 18}%
                        </td>
                        <td className="py-2 px-2 text-right border border-slate-900 font-mono font-bold text-slate-900">
                          ₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & EMI Financing Summary */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mt-2">
                {/* Left: EMI Financing Schedule Box (if active) */}
                {bill.emiDetails?.isEmi ? (
                  <div className="flex-1 w-full border border-slate-900 rounded-lg p-3 text-xs bg-amber-50/20 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                      <span className="font-black uppercase text-[11px] text-slate-900">
                        ★ IN-STORE PHONE EMI PLAN ({bill.emiDetails.tenureMonths} MONTHS) ★
                      </span>
                      <span className="font-mono font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded text-[10px]">
                        ₹{bill.emiDetails.monthlyEmi.toLocaleString('en-IN', { minimumFractionDigits: 2 })} / Month
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-600 block">Financed Device:</span>
                        <strong className="text-slate-900">{bill.emiDetails.modelName || 'Mobile Device'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-600 block">Initial Down Payment:</span>
                        <strong className="font-mono text-emerald-700">₹{bill.emiDetails.downPayment.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (Paid)</strong>
                      </div>
                      <div>
                        <span className="text-slate-600 block">Principal Balance Financed:</span>
                        <span className="font-mono font-semibold">₹{bill.emiDetails.principalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 block">Interest Rate ({bill.emiDetails.interestRate}%):</span>
                        <span className="font-mono font-semibold">+₹{bill.emiDetails.interestAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      {(bill.emiDetails.serviceCharge || 0) > 0 && (
                        <div>
                          <span className="text-slate-600 block">Service / Processing Fee:</span>
                          <span className="font-mono font-semibold">+₹{bill.emiDetails.serviceCharge?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-600 block">First Installment Due Date:</span>
                        <strong className="text-slate-900">{bill.emiDetails.firstDueDate || 'Within 30 Days'}</strong>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 pt-1 border-t border-dashed border-slate-300">
                      Installments can be repaid via counter cash, UPI QR or Customer Ledger.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1" />
                )}

                {/* Right: Totals Table */}
                <table className="w-80 shrink-0 text-xs border border-slate-900 border-collapse print-table">
                  <tbody>
                    <tr className="border-b border-slate-900">
                      <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-900">Total Units / Qty:</td>
                      <td className="py-1.5 px-3 font-bold text-right font-mono text-slate-900">{totalQuantity} Nos</td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-900">Taxable Amount:</td>
                      <td className="py-1.5 px-3 text-right font-mono text-slate-900">
                        ₹{bill.subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-900">CGST (9%):</td>
                      <td className="py-1.5 px-3 text-right font-mono text-slate-900">
                        ₹{bill.cgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-900">SGST (9%):</td>
                      <td className="py-1.5 px-3 text-right font-mono text-slate-900">
                        ₹{bill.sgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    {((bill.discount ?? 0) > 0) && (
                      <tr className="border-b border-slate-900 bg-rose-50/50">
                        <td className="py-1.5 px-3 font-bold text-rose-800 border-r border-slate-900">
                          Discount {bill.discountPercent ? `(${bill.discountPercent}%)` : ''}:
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-rose-800">
                          -₹{(bill.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}
                    <tr className="border-b-2 border-slate-900 bg-slate-50">
                      <td className="py-2 px-3 font-black text-sm text-slate-900 border-r border-slate-900 uppercase">
                        Grand Total:
                      </td>
                      <td className="py-2 px-3 font-black text-sm text-right font-mono text-slate-950">
                        ₹{bill.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-900">Amount Paid:</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-700">
                        ₹{(bill.paidAmount ?? bill.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    {(bill.balanceDue ?? 0) > 0 && (
                      <tr className="bg-rose-50/50">
                        <td className="py-1.5 px-3 font-bold text-rose-800 border-r border-slate-900">Balance Due:</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-rose-800">
                          ₹{bill.balanceDue?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer Terms & Signatory */}
              <div className="border border-slate-900 rounded-b-lg p-4 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50/30">
                <div>
                  <p className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">Terms & Conditions:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
                    <li>Goods once sold will not be taken back or exchanged.</li>
                    <li>Warranty claims handled directly by official brand service centers.</li>
                    <li>Please retain this bill original copy for warranty and IMEI verification.</li>
                  </ul>
                  {bill.notes && <p className="mt-2 text-slate-800 font-semibold italic text-[11px]">Note: {bill.notes}</p>}
                </div>

                <div className="flex flex-col justify-between items-end text-right pt-6 sm:pt-0">
                  <p className="text-slate-600 text-xs">For <strong className="text-slate-900">{shopName}</strong></p>
                  <div className="mt-8 border-t border-slate-900 pt-1 w-44 text-center">
                    <p className="font-bold text-slate-900 text-xs">Authorized Signatory</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

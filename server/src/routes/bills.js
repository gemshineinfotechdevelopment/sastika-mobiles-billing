import express from 'express';
import { Bill } from '../models/Bill.js';
import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';

const router = express.Router();

// GET all bills with search, status, paymentMode, date range
router.get('/', async (req, res) => {
  try {
    const { search, status, paymentMode, startDate, endDate } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      if (status === 'Due') {
        filter.$or = [{ status: 'PARTIAL' }, { balanceDue: { $gt: 0 } }];
      } else if (status === 'Paid') {
        filter.status = 'PAID';
      } else if (status === 'Draft') {
        filter.status = 'DRAFT';
      } else if (status === 'Cancelled') {
        filter.$or = [{ status: 'CANCELLED' }, { isCancelled: true }];
      }
    }

    if (paymentMode && paymentMode !== 'All') {
      filter.$or = [
        { paymentMode: new RegExp(paymentMode, 'i') },
        { tenderMode: new RegExp(paymentMode, 'i') },
      ];
    }

    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    }

    if (search) {
      const q = new RegExp(search.trim(), 'i');
      filter.$or = [
        { invoiceNumber: q },
        { 'customer.name': q },
        { 'customer.phone': q },
        { itemSummary: q },
        { 'items.name': q },
        { 'items.imei': q },
      ];
    }

    const bills = await Bill.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bills.length,
      bills,
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET Daily Z-Report End of Day summary
router.get('/reports/z-report', async (req, res) => {
  try {
    const today = req.query.date || new Date().toISOString().slice(0, 10);
    const todayBills = await Bill.find({ date: today, isCancelled: { $ne: true } });

    const totalBills = todayBills.length;
    let grossSales = 0;
    let totalTax = 0;
    let cashSales = 0;
    let upiSales = 0;
    let cardSales = 0;
    let khataCreditSales = 0;

    todayBills.forEach((b) => {
      grossSales += b.grandTotal || 0;
      totalTax += b.totalTax || 0;

      const mode = (b.paymentMode || b.tenderMode || '').toLowerCase();
      if (mode.includes('upi') || mode.includes('gpay') || mode.includes('phonepe')) {
        upiSales += b.grandTotal;
      } else if (mode.includes('card')) {
        cardSales += b.grandTotal;
      } else if (mode.includes('khata') || mode.includes('credit')) {
        khataCreditSales += b.balanceDue || b.grandTotal;
      } else {
        cashSales += b.grandTotal;
      }
    });

    res.json({
      success: true,
      reportDate: today,
      terminal: 'Terminal 01',
      totalInvoices: totalBills,
      grossSales,
      totalTax,
      breakdown: {
        cashSales,
        upiSales,
        cardSales,
        khataCreditSales,
      },
      netSales: grossSales - totalTax,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single bill by ID or invoiceNumber
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let bill = await Bill.findOne({
      $or: [{ id }, { invoiceNumber: id }],
    });

    if (!bill && id.match(/^[0-9a-fA-F]{24}$/)) {
      bill = await Bill.findById(id);
    }

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({ success: true, bill });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create new bill (POS Checkout)
router.post('/', async (req, res) => {
  try {
    const {
      customer,
      items,
      paymentMode = 'Cash',
      tenderMode,
      paidAmount,
      balanceDue,
      dueDate,
      notes = '',
      customerType = 'REGULAR',
      counter = 'Terminal 01',
    } = req.body;

    if (!customer || !customer.name || !items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and at least one item are required',
      });
    }

    // Generate unique sequential invoice number for current year
    const year = new Date().getFullYear();
    const countThisYear = await Bill.countDocuments();
    const invoiceNumber = `INV-${year}-${String(countThisYear + 1).padStart(4, '0')}`;

    // Calculate totals & tax
    let subTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let grandTotal = 0;

    const processedItems = [];
    const itemNames = [];

    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      const gstRate = Number(item.gstRate) || 18;

      const itemTotal = price * qty;
      const taxable = itemTotal / (1 + gstRate / 100);
      const taxAmount = itemTotal - taxable;
      const cgst = taxAmount / 2;
      const sgst = taxAmount / 2;

      subTotal += taxable;
      cgstTotal += cgst;
      sgstTotal += sgst;
      grandTotal += itemTotal;

      processedItems.push({
        productId: item.productId || '',
        name: item.name,
        model: item.model || '',
        imei: item.imei || '',
        quantity: qty,
        unitPrice: price,
        gstRate,
        taxableAmount: Number(taxable.toFixed(2)),
        cgst: Number(cgst.toFixed(2)),
        sgst: Number(sgst.toFixed(2)),
        total: Number(itemTotal.toFixed(2)),
      });

      itemNames.push(item.name);

      // Auto-deduct stock and remove sold IMEI from Product
      if (item.productId || item.name) {
        try {
          const productFilter = item.productId
            ? { $or: [{ id: item.productId }, { _id: item.productId.match(/^[0-9a-fA-F]{24}$/) ? item.productId : null }] }
            : { name: item.name };

          const product = await Product.findOne(productFilter);
          if (product) {
            product.stock = Math.max(0, product.stock - qty);
            if (item.imei && product.imeiNumbers && product.imeiNumbers.length) {
              product.imeiNumbers = product.imeiNumbers.filter((i) => i !== item.imei);
            }
            await product.save();
          }
        } catch (stockErr) {
          console.warn('Inventory sync notice:', stockErr.message);
        }
      }
    }

    const calculatedPaid = paidAmount !== undefined ? Number(paidAmount) : grandTotal;
    const calculatedDue = balanceDue !== undefined ? Number(balanceDue) : Math.max(0, grandTotal - calculatedPaid);
    const billStatus = calculatedDue > 0 ? 'PARTIAL' : 'PAID';

    const newBill = new Bill({
      invoiceNumber,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
      customer: {
        id: customer.id || '',
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
        gstin: customer.gstin || '',
        tier: customer.tier || 'REGULAR',
      },
      items: processedItems,
      subTotal: Number(subTotal.toFixed(2)),
      cgstTotal: Number(cgstTotal.toFixed(2)),
      sgstTotal: Number(sgstTotal.toFixed(2)),
      totalTax: Number((cgstTotal + sgstTotal).toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2)),
      paidAmount: Number(calculatedPaid.toFixed(2)),
      balanceDue: Number(calculatedDue.toFixed(2)),
      dueDate: dueDate || '',
      paymentMode,
      tenderMode: tenderMode || paymentMode,
      customerType,
      status: billStatus,
      notes,
      counter,
      itemSummary: itemNames.slice(0, 2).join(' + ') + (itemNames.length > 2 ? ` (+${itemNames.length - 2} more)` : ''),
      subSummary: items[0]?.imei ? `IMEI: ${items[0].imei} (1 Yr Mfr Warranty)` : `${processedItems.length} Products billed`,
    });

    const savedBill = await newBill.save();

    // Auto update customer record if phone exists
    if (customer.phone) {
      try {
        let custRecord = await Customer.findOne({ phone: customer.phone });
        if (!custRecord) {
          custRecord = new Customer({
            name: customer.name,
            phone: customer.phone,
            address: customer.address || '',
            email: customer.email || '',
            tier: customer.tier || 'REGULAR',
          });
        }

        custRecord.lifetimeSales = (custRecord.lifetimeSales || 0) + grandTotal;
        custRecord.billsCount = (custRecord.billsCount || 0) + 1;
        custRecord.lastBillDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

        if (calculatedDue > 0) {
          custRecord.khataBalance = (custRecord.khataBalance || 0) + calculatedDue;
          custRecord.khataStatus = 'pending';
          custRecord.dueText = `Due since ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`;

          custRecord.ledger.push({
            date: new Date().toISOString().slice(0, 10),
            billNumber: invoiceNumber,
            type: 'INVOICE',
            amount: calculatedDue,
            paymentMode,
            notes: `Bill credit for ${invoiceNumber}`,
            balanceAfter: custRecord.khataBalance,
          });
        }

        await custRecord.save();
      } catch (custErr) {
        console.warn('Customer khata sync notice:', custErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Bill generated successfully',
      bill: savedBill,
    });
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST Void / Cancel Bill (Restores Stock & IMEIs)
router.post('/:id/void', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Customer Returned / Billing Mistake' } = req.body;

    const bill = await Bill.findOne({
      $or: [{ id }, { invoiceNumber: id }],
    });

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (bill.isCancelled || bill.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Invoice is already voided/cancelled' });
    }

    // 1. Restore product stock and IMEIs
    for (const item of bill.items) {
      const productFilter = item.productId
        ? { $or: [{ id: item.productId }, { _id: item.productId.match(/^[0-9a-fA-F]{24}$/) ? item.productId : null }] }
        : { name: item.name };

      const product = await Product.findOne(productFilter);
      if (product) {
        product.stock += item.quantity || 1;
        if (item.imei && !product.imeiNumbers.includes(item.imei)) {
          product.imeiNumbers.push(item.imei);
        }
        await product.save();
      }
    }

    // 2. Reverse Khata balance if it had balance due
    if (bill.balanceDue > 0 && bill.customer?.phone) {
      const cust = await Customer.findOne({ phone: bill.customer.phone });
      if (cust) {
        cust.khataBalance = Math.max(0, (cust.khataBalance || 0) - bill.balanceDue);
        cust.lifetimeSales = Math.max(0, (cust.lifetimeSales || 0) - bill.grandTotal);
        if (cust.khataBalance === 0) cust.khataStatus = 'settled';

        cust.ledger.push({
          date: new Date().toISOString().slice(0, 10),
          billNumber: bill.invoiceNumber,
          type: 'RETURN',
          amount: bill.balanceDue,
          paymentMode: 'Void Reversal',
          notes: `Reversal for voided bill ${bill.invoiceNumber}`,
          balanceAfter: cust.khataBalance,
        });

        await cust.save();
      }
    }

    // 3. Mark bill as CANCELLED
    bill.status = 'CANCELLED';
    bill.isCancelled = true;
    bill.voidReason = `Void Reason: ${reason}`;
    bill.stockRestoredText = `Reversed to Stock (${bill.items.length} units)`;
    bill.paidAmount = 0;
    bill.balanceDue = 0;
    bill.tenderMode = 'Stock Restored';

    await bill.save();

    res.json({
      success: true,
      message: `Invoice ${bill.invoiceNumber} voided and stock restored successfully`,
      bill,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

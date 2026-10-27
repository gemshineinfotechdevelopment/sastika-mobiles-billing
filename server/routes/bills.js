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

// GET Daily Z-Report End of Day fiscal closing summary
router.get('/reports/z-report', async (req, res) => {
  try {
    const today = req.query.date || new Date().toISOString().slice(0, 10);
    // Find all bills for the selected date strictly from MongoDB
    const allBills = await Bill.find({ date: today }).sort({ createdAt: 1, invoiceNumber: 1 });
    const allProducts = await Product.find({});

    const productMap = new Map();
    allProducts.forEach((p) => {
      if (p.id) productMap.set(p.id, p);
      if (p._id) productMap.set(p._id.toString(), p);
      if (p.name) productMap.set(p.name.toLowerCase().trim(), p);
    });

    const activeBills = allBills.filter((b) => !b.isCancelled && b.status !== 'CANCELLED');
    const voidBills = allBills.filter((b) => b.isCancelled || b.status === 'CANCELLED');

    let grossSales = 0;
    let taxableTurnover = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let totalTax = 0;
    let totalItemsCount = 0;
    let discountsTotal = 0;
    let totalCost = 0;

    let cashSales = 0;
    let upiSales = 0;
    let cardSales = 0;
    let khataCreditSales = 0;
    let netCollected = 0;

    const productsSoldMap = new Map();

    activeBills.forEach((b) => {
      const gTotal = Number(b.grandTotal) || 0;
      const sTotal = Number(b.subTotal) || 0;
      const cgst = Number(b.cgstTotal) || 0;
      const sgst = Number(b.sgstTotal) || 0;
      const tax = Number(b.totalTax) || (cgst + sgst);
      const paid = Number(b.paidAmount !== undefined ? b.paidAmount : gTotal);
      const due = Number(b.balanceDue !== undefined ? b.balanceDue : Math.max(0, gTotal - paid));

      grossSales += gTotal;
      taxableTurnover += sTotal;
      cgstTotal += cgst;
      sgstTotal += sgst;
      totalTax += tax;

      // Extract bill level discount
      let billDiscount = 0;
      if (b.notes && b.notes.includes('-₹')) {
        const discMatch = b.notes.match(/-₹(\d+(\.\d+)?)/);
        if (discMatch) {
          billDiscount = parseFloat(discMatch[1]);
          discountsTotal += billDiscount;
        }
      }

      // Sum of item totals for proportional discount allocation
      const billItemsGrossSum = (b.items || []).reduce((acc, it) => acc + (Number(it.total) || 0), 0);

      // Aggregate product-level sales & calculate profit
      if (Array.isArray(b.items)) {
        b.items.forEach((item) => {
          const qty = Number(item.quantity) || 1;
          const itemTotal = Number(item.total) || 0;
          const unitPrice = Number(item.unitPrice) || (qty > 0 ? itemTotal / qty : 0);

          totalItemsCount += qty;

          // Lookup product cost price
          const prod =
            (item.productId && productMap.get(item.productId)) ||
            (item.name && productMap.get(item.name.toLowerCase().trim())) ||
            null;

          const unitCost = prod && typeof prod.costPrice === 'number' ? prod.costPrice : 0;
          const itemTotalCost = unitCost * qty;
          totalCost += itemTotalCost;

          // Proportionate discount for this item
          const itemDiscount =
            billItemsGrossSum > 0 && billDiscount > 0
              ? (itemTotal / billItemsGrossSum) * billDiscount
              : 0;

          // Net Worth Amount after discount
          const netWorth = Math.max(0, itemTotal - itemDiscount);
          const itemProfit = netWorth - itemTotalCost;

          const prodKey = item.productId || item.name;
          if (!productsSoldMap.has(prodKey)) {
            productsSoldMap.set(prodKey, {
              productId: item.productId || '',
              name: item.name,
              model: item.model || prod?.model || '',
              category: prod?.category || 'General',
              quantity: qty,
              unitPrice: Number(unitPrice.toFixed(2)),
              grossAmount: Number(itemTotal.toFixed(2)),
              discountAmount: Number(itemDiscount.toFixed(2)),
              netWorthAmount: Number(netWorth.toFixed(2)),
              unitCost: Number(unitCost.toFixed(2)),
              totalCost: Number(itemTotalCost.toFixed(2)),
              profit: Number(itemProfit.toFixed(2)),
            });
          } else {
            const existing = productsSoldMap.get(prodKey);
            existing.quantity += qty;
            existing.grossAmount = Number((existing.grossAmount + itemTotal).toFixed(2));
            existing.discountAmount = Number((existing.discountAmount + itemDiscount).toFixed(2));
            existing.netWorthAmount = Number((existing.netWorthAmount + netWorth).toFixed(2));
            existing.totalCost = Number((existing.totalCost + itemTotalCost).toFixed(2));
            existing.profit = Number((existing.profit + itemProfit).toFixed(2));
          }
        });
      }

      khataCreditSales += due;
      netCollected += paid;

      const mode = (b.paymentMode || b.tenderMode || 'Cash').toLowerCase();
      if (mode.includes('upi') || mode.includes('gpay') || mode.includes('phonepe') || mode.includes('qr')) {
        upiSales += paid;
      } else if (mode.includes('card') || mode.includes('pos')) {
        cardSales += paid;
      } else if (mode.includes('credit') || mode.includes('khata')) {
        if (paid > 0) cashSales += paid;
      } else {
        cashSales += paid;
      }
    });

    let voidTotal = 0;
    voidBills.forEach((b) => {
      voidTotal += Number(b.grandTotal) || 0;
    });

    const productsSold = Array.from(productsSoldMap.values()).sort(
      (a, b) => b.netWorthAmount - a.netWorthAmount
    );

    const totalProfit = Number((grossSales - totalCost).toFixed(2));
    const profitMargin = grossSales > 0 ? Number(((totalProfit / grossSales) * 100).toFixed(1)) : 0;

    // Detailed day's bills & payments register
    const billsList = activeBills.map((b) => ({
      id: b.id,
      invoiceNumber: b.invoiceNumber,
      time: b.time || '',
      customerName: b.customer?.name || 'Customer',
      customerPhone: b.customer?.phone || '',
      itemsCount: (b.items || []).length,
      itemsSummary: b.itemSummary || (b.items || []).map((i) => i.name).join(', '),
      paymentMode: b.paymentMode || b.tenderMode || 'Cash',
      grandTotal: Number((b.grandTotal || 0).toFixed(2)),
      paidAmount: Number((b.paidAmount !== undefined ? b.paidAmount : b.grandTotal).toFixed(2)),
      balanceDue: Number((b.balanceDue || 0).toFixed(2)),
      status: b.status || 'PAID',
    }));

    res.json({
      success: true,
      reportDate: today,
      terminal: 'Terminal 01',
      totalInvoices: activeBills.length,
      firstInvoice: activeBills.length > 0 ? activeBills[0].invoiceNumber : 'None',
      lastInvoice: activeBills.length > 0 ? activeBills[activeBills.length - 1].invoiceNumber : 'None',
      grossSales: Number(grossSales.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      totalProfit,
      profitMargin,
      taxableTurnover: Number(taxableTurnover.toFixed(2)),
      cgstTotal: Number(cgstTotal.toFixed(2)),
      sgstTotal: Number(sgstTotal.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      totalItemsCount,
      discountsTotal: Number(discountsTotal.toFixed(2)),
      netSales: Number(taxableTurnover.toFixed(2)),
      breakdown: {
        cashSales: Number(cashSales.toFixed(2)),
        upiSales: Number(upiSales.toFixed(2)),
        cardSales: Number(cardSales.toFixed(2)),
        khataCreditSales: Number(khataCreditSales.toFixed(2)),
        netCollected: Number(netCollected.toFixed(2)),
      },
      voids: {
        count: voidBills.length,
        totalAmount: Number(voidTotal.toFixed(2)),
      },
      productsSold,
      billsList,
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

    if (!items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required in the bill',
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
        id: customer?.id || '',
        name: (customer?.name || '').trim() || 'Customer',
        phone: (customer?.phone || '').trim(),
        email: customer?.email || '',
        address: customer?.address || '',
        gstin: customer?.gstin || '',
        tier: customer?.tier || 'REGULAR',
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
      customerType: customerType || 'CUSTOMER',
      status: billStatus,
      notes,
      counter,
      itemSummary: itemNames.slice(0, 2).join(' + ') + (itemNames.length > 2 ? ` (+${itemNames.length - 2} more)` : ''),
      subSummary: items[0]?.imei ? `IMEI: ${items[0].imei} (1 Yr Mfr Warranty)` : `${processedItems.length} Products billed`,
    });

    const savedBill = await newBill.save();

    // Auto maintain customer records: Every billed customer is created or updated in DB
    if (customer && customer.name && customer.name.trim()) {
      try {
        const custName = customer.name.trim();
        const custPhone = (customer.phone || '').trim();

        let custRecord = null;
        if (custPhone) {
          custRecord = await Customer.findOne({ phone: custPhone });
        }
        if (!custRecord && customer.id) {
          const isObjectId = /^[0-9a-fA-F]{24}$/.test(customer.id);
          custRecord = await Customer.findOne({
            $or: [{ id: customer.id }, ...(isObjectId ? [{ _id: customer.id }] : [])],
          });
        }
        if (!custRecord && custName) {
          custRecord = await Customer.findOne({ name: new RegExp(`^${custName}$`, 'i') });
        }

        if (!custRecord) {
          custRecord = new Customer({
            name: custName,
            phone: custPhone,
            address: customer.address || '',
            email: customer.email || '',
            gstin: customer.gstin || '',
            tier: customer.tier || 'REGULAR',
            lifetimeSales: 0,
            billsCount: 0,
            khataBalance: 0,
            khataStatus: 'settled',
            dueText: 'Settled',
            ledger: [],
          });
        } else {
          custRecord.name = custName;
          if (custPhone && (!custRecord.phone || custRecord.phone === 'Cash Counter' || custRecord.phone === 'Counter Sale')) {
            custRecord.phone = custPhone;
          }
          if (customer.address && !custRecord.address) custRecord.address = customer.address;
          if (customer.email && !custRecord.email) custRecord.email = customer.email;
          if (customer.gstin && !custRecord.gstin) custRecord.gstin = customer.gstin;
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
        console.warn('Customer auto-maintenance notice:', custErr.message);
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

// PUT Update bill (Edit customer, payment mode, amounts, notes, items)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filter = {
      $or: [{ id }, { invoiceNumber: id }],
    };
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      filter.$or.push({ _id: id });
    }

    const bill = await Bill.findOne(filter);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const {
      customer,
      paymentMode,
      tenderMode,
      paidAmount,
      balanceDue,
      notes,
      items,
      subTotal,
      cgstTotal,
      sgstTotal,
      totalTax,
      grandTotal,
      status,
    } = req.body;

    if (customer) {
      bill.customer = {
        name: customer.name || bill.customer?.name || 'Customer',
        phone: customer.phone || bill.customer?.phone || '',
        address: customer.address !== undefined ? customer.address : bill.customer?.address || '',
        gstin: customer.gstin !== undefined ? customer.gstin : bill.customer?.gstin || '',
      };
    }

    if (paymentMode !== undefined) bill.paymentMode = paymentMode;
    if (tenderMode !== undefined) bill.tenderMode = tenderMode;
    if (paidAmount !== undefined) bill.paidAmount = Number(paidAmount);
    if (balanceDue !== undefined) {
      bill.balanceDue = Number(balanceDue);
      if (bill.status !== 'CANCELLED') {
        bill.status = bill.balanceDue > 0 ? 'PARTIAL' : 'PAID';
      }
    }
    if (status !== undefined) bill.status = status;
    if (notes !== undefined) bill.notes = notes;

    if (Array.isArray(items) && items.length > 0) {
      bill.items = items;
      bill.itemSummary = items.map((i) => i.name).join(', ');
    }
    if (subTotal !== undefined) bill.subTotal = Number(subTotal);
    if (cgstTotal !== undefined) bill.cgstTotal = Number(cgstTotal);
    if (sgstTotal !== undefined) bill.sgstTotal = Number(sgstTotal);
    if (totalTax !== undefined) bill.totalTax = Number(totalTax);
    if (grandTotal !== undefined) bill.grandTotal = Number(grandTotal);

    await bill.save();

    res.json({
      success: true,
      message: `Invoice ${bill.invoiceNumber} updated successfully`,
      bill,
    });
  } catch (error) {
    console.error('Error updating bill:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE bill permanently (Restores stock if active, adjusts customer ledger)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filter = {
      $or: [{ id }, { invoiceNumber: id }],
    };
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      filter.$or.push({ _id: id });
    }

    const bill = await Bill.findOne(filter);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // 1. If bill was active (not cancelled), restore product stock
    if (!bill.isCancelled && bill.status !== 'CANCELLED' && Array.isArray(bill.items)) {
      for (const item of bill.items) {
        const prodFilter = item.productId
          ? { $or: [{ id: item.productId }, { _id: item.productId.match(/^[0-9a-fA-F]{24}$/) ? item.productId : null }] }
          : { name: item.name };

        const product = await Product.findOne(prodFilter);
        if (product) {
          product.stock += item.quantity || 1;
          if (item.imei && !product.imeiNumbers.includes(item.imei)) {
            product.imeiNumbers.push(item.imei);
          }
          await product.save();
        }
      }
    }

    // 2. Adjust customer lifetime sales & khata balance if bill had balance due
    if (bill.customer?.phone) {
      const cust = await Customer.findOne({ phone: bill.customer.phone });
      if (cust) {
        if (!bill.isCancelled && bill.status !== 'CANCELLED') {
          cust.lifetimeSales = Math.max(0, (cust.lifetimeSales || 0) - (bill.grandTotal || 0));
          cust.billsCount = Math.max(0, (cust.billsCount || 1) - 1);
        }
        if (bill.balanceDue > 0) {
          cust.khataBalance = Math.max(0, (cust.khataBalance || 0) - bill.balanceDue);
          if (cust.khataBalance === 0) cust.khataStatus = 'settled';

          cust.ledger.push({
            date: new Date().toISOString().slice(0, 10),
            billNumber: bill.invoiceNumber,
            type: 'DELETE',
            amount: bill.balanceDue,
            paymentMode: 'Bill Deleted',
            notes: `Deleted invoice record ${bill.invoiceNumber}`,
            balanceAfter: cust.khataBalance,
          });
        }
        await cust.save();
      }
    }

    // 3. Remove from database
    await Bill.deleteOne({ _id: bill._id });

    res.json({
      success: true,
      message: `Invoice ${bill.invoiceNumber} deleted permanently from database`,
    });
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;


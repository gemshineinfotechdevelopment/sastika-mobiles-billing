import express from 'express';
import { bills, products } from '../data/mockData.js';

const router = express.Router();

// GET all bills / invoices
router.get('/', (req, res) => {
  const { search } = req.query;
  let filtered = [...bills];

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(b => 
      b.invoiceNumber.toLowerCase().includes(q) ||
      b.customer.name.toLowerCase().includes(q) ||
      b.customer.phone.includes(q)
    );
  }

  res.json({
    success: true,
    count: filtered.length,
    bills: filtered.reverse()
  });
});

// GET single bill by ID
router.get('/:id', (req, res) => {
  const bill = bills.find(b => b.id === req.params.id || b.invoiceNumber === req.params.id);
  if (!bill) {
    return res.status(404).json({ success: false, message: 'Invoice not found' });
  }
  res.json({ success: true, bill });
});

// POST create new bill
router.post('/', (req, res) => {
  const { customer, items, paymentMode, notes } = req.body;

  if (!customer || !customer.name || !items || !items.length) {
    return res.status(400).json({
      success: false,
      message: 'Customer details and at least one item are required'
    });
  }

  const invoiceCount = bills.length + 1;
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount).padStart(4, '0')}`;
  
  // Calculate totals
  let subTotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let grandTotal = 0;

  const processedItems = items.map(item => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.unitPrice) || 0;
    const itemTotal = price * qty;
    const gstRate = Number(item.gstRate) || 18;
    
    // Reverse tax calculation for inclusive prices
    const taxable = itemTotal / (1 + gstRate / 100);
    const tax = itemTotal - taxable;
    const cgst = tax / 2;
    const sgst = tax / 2;

    subTotal += taxable;
    cgstTotal += cgst;
    sgstTotal += sgst;
    grandTotal += itemTotal;

    // Deduct stock if matching product exists
    if (item.productId) {
      const prod = products.find(p => p.id === item.productId);
      if (prod && prod.stock >= qty) {
        prod.stock -= qty;
      }
    }

    return {
      productId: item.productId || null,
      name: item.name,
      model: item.model || '',
      imei: item.imei || '',
      quantity: qty,
      unitPrice: price,
      gstRate,
      taxableAmount: Number(taxable.toFixed(2)),
      cgst: Number(cgst.toFixed(2)),
      sgst: Number(sgst.toFixed(2)),
      total: Number(itemTotal.toFixed(2))
    };
  });

  const newBill = {
    id: `bill-${Date.now()}`,
    invoiceNumber,
    date: new Date().toISOString(),
    customer: {
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
      gstin: customer.gstin || ''
    },
    items: processedItems,
    subTotal: Number(subTotal.toFixed(2)),
    cgstTotal: Number(cgstTotal.toFixed(2)),
    sgstTotal: Number(sgstTotal.toFixed(2)),
    totalTax: Number((cgstTotal + sgstTotal).toFixed(2)),
    grandTotal: Math.round(grandTotal),
    paymentMode: paymentMode || 'Cash',
    notes: notes || 'Thank you for your business!'
  };

  bills.push(newBill);

  res.status(201).json({
    success: true,
    message: 'Invoice generated successfully',
    bill: newBill
  });
});

export default router;

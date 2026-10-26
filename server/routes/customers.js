import express from 'express';
import { Customer } from '../models/Customer.js';
import { Bill } from '../models/Bill.js';

const router = express.Router();

// GET all customers with search, tier, khataStatus
router.get('/', async (req, res) => {
  try {
    const { search, tier, khataStatus } = req.query;
    const filter = {};

    if (tier && tier !== 'All') {
      filter.tier = tier;
    }

    if (khataStatus && khataStatus !== 'All') {
      filter.khataStatus = khataStatus;
    }

    if (search) {
      const q = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: q },
        { phone: q },
        { email: q },
        { address: q },
        { id: q },
      ];
    }

    const customers = await Customer.find(filter).sort({ khataBalance: -1, createdAt: -1 });

    res.json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single customer with bills & ledger
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let customer = await Customer.findOne({
      $or: [{ id }, { phone: id }],
    });

    if (!customer && id.match(/^[0-9a-fA-F]{24}$/)) {
      customer = await Customer.findById(id);
    }

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Also fetch customer's recent bills
    const customerBills = await Bill.find({
      $or: [{ 'customer.id': customer.id }, { 'customer.phone': customer.phone }],
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      customer,
      bills: customerBills,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST add new customer
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, address, gstin, tier = 'REGULAR' } = req.body;

    const trimmedName = (name || '').trim();
    const trimmedPhone = (phone || '').trim();

    if (!trimmedName || !trimmedPhone) {
      return res.status(400).json({ success: false, message: 'Customer Name and Phone number are required' });
    }

    // Check existing by exact phone or matching 10-digit number
    const digitsOnly = trimmedPhone.replace(/\D/g, '');
    let existing = await Customer.findOne({ phone: trimmedPhone });
    if (!existing && digitsOnly.length >= 10) {
      const last10 = digitsOnly.slice(-10);
      existing = await Customer.findOne({
        phone: { $regex: `${last10}$` },
      });
    }

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Customer with phone "${trimmedPhone}" already exists (${existing.name})`,
      });
    }

    const customer = new Customer({
      name: trimmedName,
      phone: trimmedPhone,
      email: email ? email.trim() : '',
      address: address ? address.trim() : '',
      gstin: gstin ? gstin.trim() : '',
      tier,
      khataBalance: 0,
      khataStatus: 'settled',
      dueText: 'Settled',
      lifetimeSales: 0,
      billsCount: 0,
      loyaltyPoints: 0,
    });

    const saved = await customer.save();

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      customer: saved,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT update customer
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    let customer = await Customer.findOne({ id });
    if (!customer && id.match(/^[0-9a-fA-F]{24}$/)) {
      customer = await Customer.findById(id);
    }

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (body.name) customer.name = body.name.trim();
    if (body.phone) customer.phone = body.phone.trim();
    if (body.email !== undefined) customer.email = body.email.trim();
    if (body.address !== undefined) customer.address = body.address.trim();
    if (body.gstin !== undefined) customer.gstin = body.gstin.trim();
    if (body.tier !== undefined) customer.tier = body.tier;

    const updated = await customer.save();
    res.json({ success: true, message: 'Customer updated successfully', customer: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST collect Khata payment from customer
router.post('/:id/collect-payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMode = 'UPI', notes = '', billNumber } = req.body;

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
    }

    let customer = await Customer.findOne({ id });
    if (!customer && id.match(/^[0-9a-fA-F]{24}$/)) {
      customer = await Customer.findById(id);
    }

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Deduct from Khata balance
    const currentBalance = customer.khataBalance || 0;
    const newBalance = Math.max(0, currentBalance - payAmount);
    customer.khataBalance = newBalance;
    customer.khataStatus = newBalance === 0 ? 'settled' : 'pending';
    if (newBalance === 0) customer.dueText = 'Settled';

    // Append to customer ledger
    customer.ledger.push({
      date: new Date().toISOString().slice(0, 10),
      billNumber: billNumber || `RCPT-${Date.now().toString().slice(-4)}`,
      type: 'PAYMENT',
      amount: payAmount,
      paymentMode,
      notes: notes || 'Credit balance settlement',
      balanceAfter: newBalance,
    });

    await customer.save();

    // If billNumber was specified, update that bill's balanceDue
    if (billNumber) {
      const bill = await Bill.findOne({ invoiceNumber: billNumber });
      if (bill) {
        bill.paidAmount = (bill.paidAmount || 0) + payAmount;
        bill.balanceDue = Math.max(0, (bill.balanceDue || 0) - payAmount);
        if (bill.balanceDue === 0) bill.status = 'PAID';
        await bill.save();
      }
    }

    res.json({
      success: true,
      message: `Payment of ₹${payAmount.toLocaleString('en-IN')} recorded successfully`,
      newBalance,
      customer,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE customer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let deleted = await Customer.findOneAndDelete({ id });
    if (!deleted && id.match(/^[0-9a-fA-F]{24}$/)) {
      deleted = await Customer.findByIdAndDelete(id);
    }
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

import express from 'express';
import { customers } from '../data/mockData.js';

const router = express.Router();

// GET all customers
router.get('/', (req, res) => {
  const { search } = req.query;
  let filtered = [...customers];

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  }

  res.json({
    success: true,
    count: filtered.length,
    customers: filtered
  });
});

// POST add customer
router.post('/', (req, res) => {
  const { name, phone, email, address, gstin } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Customer name and phone are required' });
  }

  // Check if phone already exists
  const existing = customers.find(c => c.phone === phone);
  if (existing) {
    return res.json({ success: true, customer: existing, existing: true });
  }

  const newCustomer = {
    id: `cust-${Date.now()}`,
    name,
    phone,
    email: email || '',
    address: address || '',
    gstin: gstin || ''
  };

  customers.push(newCustomer);

  res.status(201).json({
    success: true,
    message: 'Customer registered successfully',
    customer: newCustomer
  });
});

export default router;

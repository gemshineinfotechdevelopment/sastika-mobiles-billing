import express from 'express';
import { Supplier } from '../models/Supplier.js';

const router = express.Router();

// GET all suppliers
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search) {
      const q = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: q },
        { phone: q },
        { gstin: q },
        { contactPerson: q },
        { category: q },
      ];
    }

    const suppliers = await Supplier.find(filter).sort({ balanceDue: -1, createdAt: -1 });

    res.json({
      success: true,
      count: suppliers.length,
      suppliers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single supplier
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let supplier = await Supplier.findOne({ id });
    if (!supplier && id.match(/^[0-9a-fA-F]{24}$/)) {
      supplier = await Supplier.findById(id);
    }

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    res.json({ success: true, supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST add supplier
router.post('/', async (req, res) => {
  try {
    const { name, address, phone, email, gstin, contactPerson, category } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Supplier name and phone are required' });
    }

    const supplier = new Supplier({
      name: name.trim(),
      address: address ? address.trim() : '',
      phone: phone.trim(),
      email: email ? email.trim() : '',
      gstin: gstin ? gstin.trim() : '',
      contactPerson: contactPerson ? contactPerson.trim() : '',
      category: category || 'Smartphones & Smart Devices',
    });

    const saved = await supplier.save();

    res.status(201).json({
      success: true,
      message: 'Supplier registered successfully',
      supplier: saved,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT update supplier
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    let supplier = await Supplier.findOne({ id });
    if (!supplier && id.match(/^[0-9a-fA-F]{24}$/)) {
      supplier = await Supplier.findById(id);
    }

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    if (body.name) supplier.name = body.name.trim();
    if (body.address !== undefined) supplier.address = body.address.trim();
    if (body.phone) supplier.phone = body.phone.trim();
    if (body.email !== undefined) supplier.email = body.email.trim();
    if (body.gstin !== undefined) supplier.gstin = body.gstin.trim();
    if (body.contactPerson !== undefined) supplier.contactPerson = body.contactPerson.trim();
    if (body.category !== undefined) supplier.category = body.category;

    const updated = await supplier.save();
    res.json({ success: true, message: 'Supplier updated successfully', supplier: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST settle supplier dues
router.post('/:id/settle', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const payAmount = Number(amount);

    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    let supplier = await Supplier.findOne({ id });
    if (!supplier && id.match(/^[0-9a-fA-F]{24}$/)) {
      supplier = await Supplier.findById(id);
    }

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    supplier.balanceDue = Math.max(0, (supplier.balanceDue || 0) - payAmount);
    await supplier.save();

    res.json({
      success: true,
      message: `Payment of ₹${payAmount.toLocaleString('en-IN')} settled for ${supplier.name}`,
      supplier,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE supplier
router.delete('/:id', async (req, res) => {
  try {
    let deleted = await Supplier.findOneAndDelete({ id });
    if (!deleted && id.match(/^[0-9a-fA-F]{24}$/)) {
      deleted = await Supplier.findByIdAndDelete(id);
    }
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.json({ success: true, message: 'Supplier removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

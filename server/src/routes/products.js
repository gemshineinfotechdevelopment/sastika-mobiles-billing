import express from 'express';
import { products } from '../data/mockData.js';

const router = express.Router();

// GET all products / inventory
router.get('/', (req, res) => {
  const { search, category } = req.query;
  let filtered = [...products];

  if (category && category !== 'All') {
    filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.model.toLowerCase().includes(q) ||
      (p.imeiNumbers && p.imeiNumbers.some(imei => imei.includes(q)))
    );
  }

  res.json({
    success: true,
    count: filtered.length,
    products: filtered
  });
});

// GET single product by ID
router.get('/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  res.json({ success: true, product });
});

// POST add new product to inventory
router.post('/', (req, res) => {
  const {
    name,
    category,
    brand,
    model,
    price,
    costPrice,
    gstRate,
    hsnCode,
    stock,
    imeiNumbers,
    sku,
    variant,
    rackLocation,
    minThreshold,
    isDualImei,
    statusTag,
  } = req.body;

  if (!name || !price) {
    return res.status(400).json({ success: false, message: 'Name and price are required' });
  }

  const cp = Number(costPrice) || 0;
  const sp = Number(price);
  const margin = cp > 0 ? Number((((sp - cp) / cp) * 100).toFixed(1)) : 0;

  const newProduct = {
    id: `prod-${Date.now()}`,
    name,
    category: category || 'Smartphones',
    brand: brand || '',
    model: model || '',
    variant: variant || '',
    sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
    price: sp,
    costPrice: cp,
    margin,
    gstRate: Number(gstRate) || 18,
    hsnCode: hsnCode || '85171300',
    stock: Number(stock) || 0,
    minThreshold: Number(minThreshold) || 4,
    rackLocation: rackLocation || 'Main Display',
    isDualImei: Boolean(isDualImei),
    statusTag: statusTag || '',
    imeiNumbers: Array.isArray(imeiNumbers) ? imeiNumbers : []
  };

  products.unshift(newProduct);

  res.status(201).json({
    success: true,
    message: 'Product added to inventory',
    product: newProduct
  });
});

// PUT update existing product
router.put('/:id', (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const existing = products[index];
  const updates = req.body;

  const updated = {
    ...existing,
    ...updates,
    price: updates.price !== undefined ? Number(updates.price) : existing.price,
    costPrice: updates.costPrice !== undefined ? Number(updates.costPrice) : existing.costPrice,
    stock: updates.stock !== undefined ? Number(updates.stock) : existing.stock,
  };

  if (updated.costPrice > 0 && updated.price > 0) {
    updated.margin = Number((((updated.price - updated.costPrice) / updated.costPrice) * 100).toFixed(1));
  }

  products[index] = updated;

  res.json({
    success: true,
    message: 'Product updated successfully',
    product: updated
  });
});

// DELETE product
router.delete('/:id', (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const deleted = products.splice(index, 1)[0];
  res.json({
    success: true,
    message: 'Product removed from catalog',
    product: deleted
  });
});

export default router;

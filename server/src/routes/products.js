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
  const { name, category, brand, model, price, costPrice, gstRate, hsnCode, stock, imeiNumbers } = req.body;

  if (!name || !price) {
    return res.status(400).json({ success: false, message: 'Name and price are required' });
  }

  const newProduct = {
    id: `prod-${Date.now()}`,
    name,
    category: category || 'Smartphones',
    brand: brand || '',
    model: model || '',
    price: Number(price),
    costPrice: Number(costPrice) || 0,
    gstRate: Number(gstRate) || 18,
    hsnCode: hsnCode || '85171300',
    stock: Number(stock) || 0,
    imeiNumbers: Array.isArray(imeiNumbers) ? imeiNumbers : []
  };

  products.push(newProduct);

  res.status(201).json({
    success: true,
    message: 'Product added to inventory',
    product: newProduct
  });
});

export default router;

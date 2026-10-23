import express from 'express';
import { Product } from '../models/Product.js';
import { upload, uploadToCloudinary } from '../config/cloudinary.js';

const router = express.Router();

// GET all products with filtering, search, category, lowStock
router.get('/', async (req, res) => {
  try {
    const { search, category, lowStock } = req.query;
    const filter = {};

    if (category && category !== 'All') {
      filter.category = new RegExp(`^${category}$`, 'i');
    }

    if (lowStock === 'true') {
      filter.$expr = { $lte: ['$stock', '$minThreshold'] };
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { brand: searchRegex },
        { model: searchRegex },
        { sku: searchRegex },
        { variant: searchRegex },
        { imeiNumbers: searchRegex },
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single product by ID, SKU, or IMEI
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let product = await Product.findOne({
      $or: [{ id }, { sku: id }, { imeiNumbers: id }],
    });

    if (!product && id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id);
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create new product with optional Cloudinary image upload
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const body = req.body;
    let imageUrl = body.imageUrl || '';

    // If an image file is attached via multipart/form-data, upload to Cloudinary
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer, {
          folder: 'sastika_mobiles/products',
        });
        imageUrl = uploadResult.secure_url;
      } catch (uploadErr) {
        console.warn('Cloudinary upload warning:', uploadErr.message);
        // If Cloudinary fails/not configured, retain provided URL or default
      }
    }

    // Process imeiNumbers if passed as comma-separated or array
    let imeiNumbers = [];
    if (body.imeiNumbers) {
      imeiNumbers = Array.isArray(body.imeiNumbers)
        ? body.imeiNumbers
        : String(body.imeiNumbers)
            .split(',')
            .map((i) => i.trim())
            .filter(Boolean);
    }

    const newProduct = new Product({
      name: body.name,
      category: body.category || 'Accessories',
      brand: body.brand || 'Generic',
      model: body.model || '',
      price: Number(body.price) || 0,
      costPrice: Number(body.costPrice) || 0,
      gstRate: Number(body.gstRate) || 18,
      hsnCode: body.hsnCode || '85171300',
      stock: Number(body.stock) || 0,
      imeiNumbers,
      sku: body.sku || '',
      variant: body.variant || '',
      rackLocation: body.rackLocation || 'Rack A1',
      ean: body.ean || '',
      isDualImei: Boolean(body.isDualImei),
      minThreshold: Number(body.minThreshold) || 5,
      imageUrl,
      roiBadge: body.roiBadge || '',
      statusTag: body.statusTag || '',
      series: body.series || '',
    });

    const saved = await newProduct.save();

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      product: saved,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT update product
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    let product = await Product.findOne({ id });
    if (!product && id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id);
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // If a new image was uploaded to Cloudinary
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer, {
          folder: 'sastika_mobiles/products',
        });
        product.imageUrl = uploadResult.secure_url;
      } catch (uploadErr) {
        console.warn('Cloudinary upload warning:', uploadErr.message);
      }
    } else if (body.imageUrl !== undefined) {
      product.imageUrl = body.imageUrl;
    }

    if (body.name !== undefined) product.name = body.name;
    if (body.category !== undefined) product.category = body.category;
    if (body.brand !== undefined) product.brand = body.brand;
    if (body.model !== undefined) product.model = body.model;
    if (body.price !== undefined) product.price = Number(body.price);
    if (body.costPrice !== undefined) product.costPrice = Number(body.costPrice);
    if (body.gstRate !== undefined) product.gstRate = Number(body.gstRate);
    if (body.hsnCode !== undefined) product.hsnCode = body.hsnCode;
    if (body.stock !== undefined) product.stock = Number(body.stock);
    if (body.sku !== undefined) product.sku = body.sku;
    if (body.variant !== undefined) product.variant = body.variant;
    if (body.rackLocation !== undefined) product.rackLocation = body.rackLocation;
    if (body.minThreshold !== undefined) product.minThreshold = Number(body.minThreshold);
    if (body.isDualImei !== undefined) product.isDualImei = Boolean(body.isDualImei);
    if (body.statusTag !== undefined) product.statusTag = body.statusTag;
    if (body.roiBadge !== undefined) product.roiBadge = body.roiBadge;

    if (body.imeiNumbers !== undefined) {
      product.imeiNumbers = Array.isArray(body.imeiNumbers)
        ? body.imeiNumbers
        : String(body.imeiNumbers)
            .split(',')
            .map((i) => i.trim())
            .filter(Boolean);
    }

    const updated = await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PATCH quick stock adjust
router.patch('/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { delta, newStock } = req.body;

    let product = await Product.findOne({ id });
    if (!product && id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id);
    }
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (newStock !== undefined) {
      product.stock = Math.max(0, Number(newStock));
    } else if (delta !== undefined) {
      product.stock = Math.max(0, product.stock + Number(delta));
    }

    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let deleted = await Product.findOneAndDelete({ id });
    if (!deleted && id.match(/^[0-9a-fA-F]{24}$/)) {
      deleted = await Product.findByIdAndDelete(id);
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product deleted from inventory' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

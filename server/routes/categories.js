import express from 'express';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';

const router = express.Router();

const DEFAULT_CATEGORIES = [
  { name: 'Smartphones', hsnCode: '85171300', defaultRack: 'Rack A1', isDualImei: true },
  { name: 'Fast Chargers', hsnCode: '85044090', defaultRack: 'Rack C1', isDualImei: false },
  { name: 'TWS Earbuds & Neckbands', hsnCode: '85183000', defaultRack: 'Rack B1', isDualImei: false },
  { name: 'Screen Protectors', hsnCode: '70071900', defaultRack: 'Rack Front-Spindle', isDualImei: false },
  { name: 'Smartwatches', hsnCode: '85176290', defaultRack: 'Rack D1', isDualImei: false },
  { name: 'Accessories', hsnCode: '85177090', defaultRack: 'Rack E1', isDualImei: false },
];

// GET all categories
router.get('/', async (req, res) => {
  try {
    let categories = await Category.find().sort({ name: 1 });

    // If no categories in collection yet, seed defaults & products distinct categories
    if (!categories || categories.length === 0) {
      const distinctProdCats = await Product.distinct('category').catch(() => []);
      const allNames = new Set(DEFAULT_CATEGORIES.map((c) => c.name));
      (distinctProdCats || []).forEach((c) => {
        if (c && typeof c === 'string' && c.trim()) allNames.add(c.trim());
      });

      const seedDocs = Array.from(allNames).map((name) => {
        const match = DEFAULT_CATEGORIES.find((d) => d.name.toLowerCase() === name.toLowerCase());
        return {
          name,
          hsnCode: match ? match.hsnCode : '85171300',
          defaultRack: match ? match.defaultRack : 'Rack A1',
          isDualImei: match ? match.isDualImei : false,
        };
      });

      try {
        await Category.insertMany(seedDocs, { ordered: false });
      } catch {
        // ignore duplicate key errors on initial concurrent seed
      }

      categories = await Category.find().sort({ name: 1 });
    }

    res.json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create new category
router.post('/', async (req, res) => {
  try {
    const { name, description, hsnCode, defaultRack, isDualImei } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const trimmedName = name.trim();

    // Check if category already exists (case-insensitive)
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Category already exists',
        category: existing,
      });
    }

    const newCategory = new Category({
      name: trimmedName,
      description: description ? description.trim() : '',
      hsnCode: hsnCode ? hsnCode.trim() : '85171300',
      defaultRack: defaultRack ? defaultRack.trim() : 'Rack A1',
      isDualImei: Boolean(isDualImei),
    });

    const saved = await newCategory.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: saved,
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE category
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let deleted = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      deleted = await Category.findByIdAndDelete(id);
    } else {
      deleted = await Category.findOneAndDelete({
        name: { $regex: new RegExp(`^${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      });
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, message: `Category "${deleted.name}" deleted` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

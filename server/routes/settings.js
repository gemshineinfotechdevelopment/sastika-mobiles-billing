import express from 'express';
import { Settings } from '../models/Settings.js';

const router = express.Router();

// GET store settings & shop info
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        shopName: process.env.SHOP_NAME || 'Sastika Mobiles',
        gstin: process.env.SHOP_GSTIN || '33AAAAA0000A1Z5',
        phone: process.env.SHOP_PHONE || '+91 98765 43210',
        address: process.env.SHOP_ADDRESS || 'Main Road, Bazaar Street, Tamil Nadu',
      });
    }

    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update settings
router.put('/', async (req, res) => {
  try {
    const body = req.body;
    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings(body);
    } else {
      Object.assign(settings, body);
    }

    const updated = await settings.save();
    res.json({
      success: true,
      message: 'Store settings updated successfully',
      settings: updated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;

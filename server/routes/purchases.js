import express from 'express';
import { PurchaseBill } from '../models/PurchaseBill.js';
import { Supplier } from '../models/Supplier.js';
import { Product } from '../models/Product.js';

const router = express.Router();

// GET all purchase bills
router.get('/', async (req, res) => {
  try {
    const { search, paymentStatus, stockSyncStatus } = req.query;
    const filter = {};

    if (paymentStatus && paymentStatus !== 'All') {
      filter.paymentStatus = paymentStatus;
    }

    if (stockSyncStatus && stockSyncStatus !== 'All') {
      filter.stockSyncStatus = stockSyncStatus;
    }

    if (search) {
      const q = new RegExp(search.trim(), 'i');
      filter.$or = [
        { supplierInvoiceNumber: q },
        { 'supplier.name': q },
        { itemsSummary: q },
      ];
    }

    const purchases = await PurchaseBill.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: purchases.length,
      purchases,
    });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single purchase bill
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let purchase = await PurchaseBill.findOne({
      $or: [{ id }, { supplierInvoiceNumber: id }],
    });

    if (!purchase && id.match(/^[0-9a-fA-F]{24}$/)) {
      purchase = await PurchaseBill.findById(id);
    }

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase bill not found' });
    }

    res.json({ success: true, purchase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create purchase bill & sync inventory stock
router.post('/', async (req, res) => {
  try {
    const {
      supplierInvoiceNumber,
      date = new Date().toISOString().slice(0, 10),
      supplier,
      items = [],
      itemsSummary,
      unitsCount,
      totalAmount,
      paidAmount = 0,
      balanceDue,
      dueNotice = '',
      isBarcoded = true,
      stockSyncStatus = 'Verified',
    } = req.body;

    if (!supplierInvoiceNumber || !supplier || !supplier.name) {
      return res.status(400).json({
        success: false,
        message: 'Supplier Invoice Number and Supplier details are required',
      });
    }

    const total = Number(totalAmount) || 0;
    const paid = Number(paidAmount) || 0;
    const due = balanceDue !== undefined ? Number(balanceDue) : Math.max(0, total - paid);

    let paymentStatus = 'PAID FULL';
    if (due > 0 && paid > 0) paymentStatus = 'PARTIAL DUE';
    else if (due > 0 && paid === 0) paymentStatus = 'UNPAID';

    // Summary text if not provided
    const summary =
      itemsSummary ||
      (items.length
        ? items.map((i) => `${i.quantity}x ${i.name}`).join(', ')
        : 'Inward Consignment');

    const totalUnits = unitsCount || items.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0);

    const newPurchase = new PurchaseBill({
      supplierInvoiceNumber: supplierInvoiceNumber.trim(),
      date,
      supplier: {
        id: supplier.id || '',
        name: supplier.name,
        address: supplier.address || '',
        phone: supplier.phone || '',
        gstin: supplier.gstin || '',
      },
      items,
      itemsSummary: summary,
      unitsCount: totalUnits,
      isBarcoded: Boolean(isBarcoded),
      totalAmount: total,
      paidAmount: paid,
      balanceDue: due,
      dueNotice,
      paymentStatus,
      stockSyncStatus,
    });

    const saved = await newPurchase.save();

    // 1. Sync stock in inventory for each item
    for (const item of items) {
      try {
        const product = await Product.findOne({
          name: new RegExp(`^${item.name.trim()}$`, 'i'),
        });

        if (product) {
          product.stock += Number(item.quantity) || 1;
          if (item.unitCost) product.costPrice = Number(item.unitCost);
          if (item.imeiNumbers && Array.isArray(item.imeiNumbers)) {
            item.imeiNumbers.forEach((imei) => {
              if (!product.imeiNumbers.includes(imei)) {
                product.imeiNumbers.push(imei);
              }
            });
          }
          await product.save();
        }
      } catch (prodErr) {
        console.warn('Inward product stock sync notice:', prodErr.message);
      }
    }

    // 2. Update Supplier balance
    if (supplier.name) {
      try {
        let suppRecord = await Supplier.findOne({
          $or: [{ name: supplier.name }, { phone: supplier.phone }],
        });

        if (!suppRecord) {
          suppRecord = new Supplier({
            name: supplier.name,
            address: supplier.address || '',
            phone: supplier.phone || '',
            gstin: supplier.gstin || '',
          });
        }

        suppRecord.totalPurchases = (suppRecord.totalPurchases || 0) + total;
        suppRecord.balanceDue = (suppRecord.balanceDue || 0) + due;
        await suppRecord.save();
      } catch (suppErr) {
        console.warn('Supplier balance sync notice:', suppErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Purchase bill logged & stock updated successfully',
      purchase: saved,
    });
  } catch (error) {
    console.error('Error creating purchase bill:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST settle supplier payment
router.post('/:id/settle-payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMode = 'NEFT/RTGS', notes = '' } = req.body;

    const settleAmount = Number(amount);
    if (!settleAmount || settleAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
    }

    let purchase = await PurchaseBill.findOne({
      $or: [{ id }, { supplierInvoiceNumber: id }],
    });

    if (!purchase && id.match(/^[0-9a-fA-F]{24}$/)) {
      purchase = await PurchaseBill.findById(id);
    }

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase bill not found' });
    }

    purchase.paidAmount = (purchase.paidAmount || 0) + settleAmount;
    purchase.balanceDue = Math.max(0, (purchase.balanceDue || 0) - settleAmount);

    if (purchase.balanceDue === 0) {
      purchase.paymentStatus = 'PAID FULL';
      purchase.dueNotice = 'Settled';
    } else {
      purchase.paymentStatus = 'PARTIAL DUE';
    }

    await purchase.save();

    // Also update supplier balance
    if (purchase.supplier?.name) {
      const supplier = await Supplier.findOne({ name: purchase.supplier.name });
      if (supplier) {
        supplier.balanceDue = Math.max(0, (supplier.balanceDue || 0) - settleAmount);
        await supplier.save();
      }
    }

    res.json({
      success: true,
      message: `Settled ₹${settleAmount.toLocaleString('en-IN')} towards ${purchase.supplierInvoiceNumber}`,
      purchase,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE purchase bill
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let deleted = await PurchaseBill.findOneAndDelete({
      $or: [{ id }, { supplierInvoiceNumber: id }],
    });

    if (!deleted && id.match(/^[0-9a-fA-F]{24}$/)) {
      deleted = await PurchaseBill.findByIdAndDelete(id);
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Purchase bill not found' });
    }

    res.json({ success: true, message: 'Purchase bill removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

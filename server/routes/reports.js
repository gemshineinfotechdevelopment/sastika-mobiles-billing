import express from 'express';
import { Bill } from '../models/Bill.js';
import { Product } from '../models/Product.js';
import { PurchaseBill } from '../models/PurchaseBill.js';
import { Customer } from '../models/Customer.js';
import { Settings } from '../models/Settings.js';

const router = express.Router();

function getCurrentFinancialYear() {
  const d = new Date();
  const month = d.getMonth();
  const year = d.getFullYear();
  if (month >= 3) {
    return `FY ${year} - ${year + 1}`;
  } else {
    return `FY ${year - 1} - ${year}`;
  }
}

// GET consolidated Reports & Financial Analytics
router.get('/analytics', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const startOfMonth = today.slice(0, 7) + '-01';

    // 1. Live bills from database
    const allBills = await Bill.find({ isCancelled: { $ne: true } });
    const todayBills = allBills.filter((b) => (b.date || '').slice(0, 10) === today);
    const monthBills = allBills.filter((b) => {
      const d = (b.date || '').slice(0, 10);
      return d >= startOfMonth && d <= today;
    });

    const grossSalesToday = todayBills.reduce((acc, b) => acc + (b.grandTotal || 0), 0);
    const todayInvoicesCount = todayBills.length;

    const monthlySales = monthBills.reduce((acc, b) => acc + (b.grandTotal || 0), 0);

    // 2. Purchases & Supplier Dues from database
    const allPurchases = await PurchaseBill.find();
    const monthPurchases = allPurchases.filter((p) => {
      const d = (p.date || '').slice(0, 10);
      return d >= startOfMonth && d <= today;
    });
    const totalPurchases = monthPurchases.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
    const supplierDues = allPurchases.reduce((acc, p) => acc + (p.balanceDue || 0), 0);
    const inwardConsignmentsCount = monthPurchases.length;

    // 3. Stock valuation from Products in database
    const allProducts = await Product.find();
    let totalStockUnits = 0;
    let stockValuation = 0;
    let phonesCount = 0;
    let accessoriesCount = 0;

    allProducts.forEach((p) => {
      const stock = p.stock || 0;
      totalStockUnits += stock;
      stockValuation += stock * (p.costPrice || (p.price ? p.price * 0.8 : 0));
      if ((p.category || '').toLowerCase().includes('phone')) {
        phonesCount += stock;
      } else {
        accessoriesCount += stock;
      }
    });

    // 4. Critical Stock Reorder Alerts from database
    const criticalStockProducts = await Product.find({
      $expr: {
        $lte: ['$stock', { $ifNull: ['$minThreshold', 5] }],
      },
    }).sort({ stock: 1 }).limit(10);

    const reorderAlerts = criticalStockProducts.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category || 'General',
      subtext: `${p.variant || p.model || 'Standard'} | Rate: ₹${(p.price || 0).toLocaleString('en-IN')}`,
      rate: p.price || 0,
      availUnits: p.stock || 0,
      minSafe: p.minThreshold || 5,
      isUrgent: (p.stock || 0) <= 1,
    }));

    // 5. Payment mode breakdown from actual bills in database
    const modeCounts = { upi: 0, cash: 0, card: 0, khata: 0 };
    allBills.forEach((b) => {
      const mode = (b.paymentMode || b.tenderMode || '').toLowerCase();
      if (mode.includes('upi') || mode.includes('gpay') || mode.includes('phonepe') || mode.includes('paytm')) {
        modeCounts.upi += 1;
      } else if (mode.includes('card') || mode.includes('pos')) {
        modeCounts.card += 1;
      } else if (mode.includes('khata') || mode.includes('credit') || (b.balanceDue || 0) > 0) {
        modeCounts.khata += 1;
      } else {
        modeCounts.cash += 1;
      }
    });

    const totalModes = allBills.length;
    const paymentModeBreakdown = totalModes > 0 ? {
      upi: Math.round((modeCounts.upi / totalModes) * 100),
      cash: Math.round((modeCounts.cash / totalModes) * 100),
      card: Math.round((modeCounts.card / totalModes) * 100),
      khata: Math.round((modeCounts.khata / totalModes) * 100),
    } : {
      upi: 0,
      cash: 0,
      card: 0,
      khata: 0,
    };

    // 6. Top selling items from actual bills in database
    const itemMap = new Map();
    allBills.forEach((b) => {
      (b.items || []).forEach((item) => {
        const key = item.name || 'Item';
        const existing = itemMap.get(key) || { name: key, category: 'General', soldUnits: 0, revenue: 0 };
        existing.soldUnits += item.quantity || 1;
        existing.revenue += item.total || (item.unitPrice * (item.quantity || 1));
        itemMap.set(key, existing);
      });
    });

    const productCategoryMap = new Map();
    allProducts.forEach((p) => {
      if (p.name && p.category) {
        productCategoryMap.set(p.name.trim().toLowerCase(), p.category);
      }
    });

    const topSellingItems = Array.from(itemMap.values())
      .map((item) => {
        const foundCategory = productCategoryMap.get(item.name.trim().toLowerCase());
        return {
          ...item,
          category: foundCategory || item.category,
        };
      })
      .sort((a, b) => b.soldUnits - a.soldUnits)
      .slice(0, 10);

    // 7. GST & Tax Compliance calculation from actual bills
    let cgstCollected = 0;
    let sgstCollected = 0;
    let taxableTurnover = 0;

    monthBills.forEach((b) => {
      cgstCollected += b.cgstTotal || 0;
      sgstCollected += b.sgstTotal || 0;
      taxableTurnover += b.subTotal || 0;
    });

    const gstCompliance = {
      taxableTurnover: Math.round(taxableTurnover),
      cgstCollected: Math.round(cgstCollected),
      sgstCollected: Math.round(sgstCollected),
      totalGstCollected: Math.round(cgstCollected + sgstCollected),
      eligibleInputTaxItc: -Math.round(totalPurchases * 0.18),
      netTaxPayable: Math.max(0, Math.round(cgstCollected + sgstCollected - totalPurchases * 0.18)),
      dueDate: '20th Next Month',
      status: 'Active GSTR-1',
    };

    // 8. Shop Settings from database
    const shopSettings = await Settings.findOne();

    res.json({
      success: true,
      period: `${getCurrentFinancialYear()} (Live Database)`,
      grossSalesToday,
      monthlySales,
      stockValuation: Math.round(stockValuation),
      supplierDues,
      todayInvoicesCount,
      paymentModeBreakdown,
      topSellingItems,
      criticalReorderAlerts: reorderAlerts,
      reorderAlerts,
      gstCompliance,
      shopSettings: shopSettings ? {
        shopName: shopSettings.shopName,
        phone: shopSettings.phone,
        address: shopSettings.address,
        gstin: shopSettings.gstin,
      } : null,
      kpis: {
        todaySales: {
          value: grossSalesToday,
          invoices: todayInvoicesCount,
          trend: 'Live Counter Sales',
          avgTicket: todayInvoicesCount ? Math.round(grossSalesToday / todayInvoicesCount) : 0,
        },
        monthlySales: {
          value: monthlySales,
          trend: 'Monthly Active',
        },
        purchases: {
          value: totalPurchases,
          supplierDues,
          inwardConsignments: inwardConsignmentsCount,
        },
        stockValuation: {
          value: Math.round(stockValuation),
          totalUnits: totalStockUnits,
          skusCount: allProducts.length,
          phonesCount,
          accessoriesCount,
        },
      },
    });
  } catch (error) {
    console.error('Error generating analytics report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

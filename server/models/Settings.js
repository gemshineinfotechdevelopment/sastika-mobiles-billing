import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      default: 'Sastika Mobiles',
    },
    tagline: {
      type: String,
      default: 'Premium Smartphones & Genuine Accessories',
    },
    gstin: {
      type: String,
      default: '33AAAAA0000A1Z5',
    },
    phone: {
      type: String,
      default: '+91 98765 43210',
    },
    email: {
      type: String,
      default: 'support@sastikamobiles.com',
    },
    address: {
      type: String,
      default: 'Main Road, Bazaar Street, Tamil Nadu',
    },
    stateCode: {
      type: String,
      default: '33 - Tamil Nadu',
    },
    invoicePrefix: {
      type: String,
      default: 'INV',
    },
    financialYear: {
      type: String,
      default: '2024-2025',
    },
    thermalPrinter: {
      paperSize: {
        type: String,
        default: '3-inch Thermal (80mm)',
      },
      showQrCode: {
        type: Boolean,
        default: true,
      },
      showImeiBarcode: {
        type: Boolean,
        default: true,
      },
      printFooterNote: {
        type: String,
        default: 'Thank you for shopping at Sastika Mobiles! Items with physical damage are not eligible for warranty.',
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

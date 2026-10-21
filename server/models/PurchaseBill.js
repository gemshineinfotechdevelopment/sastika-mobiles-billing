import mongoose from 'mongoose';

const purchaseBillItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: 'Accessories',
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
  unitCost: {
    type: Number,
    required: true,
  },
  gstRate: {
    type: Number,
    default: 18,
  },
  taxableAmount: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  imeiNumbers: {
    type: [String],
    default: [],
  },
  isBarcoded: {
    type: Boolean,
    default: true,
  },
});

const purchaseBillSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => `po-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    },
    supplierInvoiceNumber: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
    },
    supplier: {
      id: String,
      name: { type: String, required: true },
      address: { type: String, default: '' },
      phone: { type: String, default: '' },
      gstin: { type: String, default: '' },
    },
    items: {
      type: [purchaseBillItemSchema],
      default: [],
    },
    itemsSummary: {
      type: String,
      default: '',
    },
    unitsCount: {
      type: Number,
      default: 0,
    },
    imeiLoggedCount: {
      type: Number,
      default: 0,
    },
    isBarcoded: {
      type: Boolean,
      default: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    balanceDue: {
      type: Number,
      default: 0,
    },
    dueNotice: {
      type: String,
      default: '',
    },
    paymentStatus: {
      type: String,
      enum: ['PAID FULL', 'PARTIAL DUE', 'UNPAID'],
      default: 'PAID FULL',
    },
    stockSyncStatus: {
      type: String,
      enum: ['Verified', 'Pending'],
      default: 'Verified',
    },
    taxAuditStatus: {
      type: String,
      default: 'ITC Claimed (18%)',
    },
  },
  {
    timestamps: true,
  }
);

export const PurchaseBill =
  mongoose.models.PurchaseBill || mongoose.model('PurchaseBill', purchaseBillSchema);

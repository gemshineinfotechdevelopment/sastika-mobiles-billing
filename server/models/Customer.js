import mongoose from 'mongoose';

const customerLedgerEntrySchema = new mongoose.Schema(
  {
    date: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
    },
    billNumber: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['INVOICE', 'PAYMENT', 'RETURN', 'ADJUSTMENT'],
      default: 'INVOICE',
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMode: {
      type: String,
      default: 'Cash',
    },
    notes: {
      type: String,
      default: '',
    },
    balanceAfter: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const customerSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    },
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    gstin: {
      type: String,
      trim: true,
      default: '',
    },
    tier: {
      type: String,
      default: 'REGULAR',
    },
    khataBalance: {
      type: Number,
      default: 0,
    },
    khataStatus: {
      type: String,
      enum: ['settled', 'pending', 'risk'],
      default: 'settled',
    },
    dueText: {
      type: String,
      default: 'Settled',
    },
    lifetimeSales: {
      type: Number,
      default: 0,
    },
    billsCount: {
      type: Number,
      default: 0,
    },
    lastBillDate: {
      type: String,
      default: '',
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
    },
    avatarBg: {
      type: String,
      default: 'bg-blue-100 text-blue-700',
    },
    initials: {
      type: String,
      default: '',
    },
    ledger: {
      type: [customerLedgerEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Auto compute initials before saving
customerSchema.pre('save', function () {
  if (this.name && !this.initials) {
    const parts = this.name.trim().split(' ');
    this.initials = parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
});

export const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);

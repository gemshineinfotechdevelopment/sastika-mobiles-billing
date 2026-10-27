import mongoose from 'mongoose';

const billItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    default: '',
  },
  imei: {
    type: String,
    default: '',
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
  unitPrice: {
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
  cgst: {
    type: Number,
    default: 0,
  },
  sgst: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
});

const billSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => `bill-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    date: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
    },
    time: {
      type: String,
      default: () =>
        new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
    },
    customer: {
      id: String,
      name: { type: String, required: true },
      phone: { type: String, default: 'Cash Counter' },
      email: { type: String, default: '' },
      address: { type: String, default: '' },
      gstin: { type: String, default: '' },
      tier: { type: String, default: 'REGULAR' },
    },
    items: {
      type: [billItemSchema],
      required: true,
      validate: [(val) => val.length > 0, 'At least one item is required in the bill'],
    },
    subTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    cgstTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    sgstTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    totalTax: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    grandTotal: {
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
    dueDate: {
      type: String,
      default: '',
    },
    paymentMode: {
      type: String,
      default: 'Cash',
    },
    tenderMode: {
      type: String,
      default: 'Cash',
    },
    customerType: {
      type: String,
      enum: ['REGULAR', 'MEMBER', 'COUNTER POS', 'CUSTOMER'],
      default: 'REGULAR',
    },
    status: {
      type: String,
      enum: ['PAID', 'PARTIAL', 'DRAFT', 'CANCELLED'],
      default: 'PAID',
    },
    notes: {
      type: String,
      default: '',
    },
    counter: {
      type: String,
      default: 'Terminal 01',
    },
    itemSummary: {
      type: String,
      default: '',
    },
    subSummary: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    isCancelled: {
      type: Boolean,
      default: false,
    },
    voidReason: {
      type: String,
      default: '',
    },
    stockRestoredText: {
      type: String,
      default: '',
    },
    emiDetails: {
      isEmi: { type: Boolean, default: false },
      modelName: { type: String, default: '' },
      downPayment: { type: Number, default: 0 },
      principalAmount: { type: Number, default: 0 },
      interestRate: { type: Number, default: 0 },
      interestAmount: { type: Number, default: 0 },
      tenureMonths: { type: Number, default: 0 },
      serviceCharge: { type: Number, default: 0 },
      monthlyEmi: { type: Number, default: 0 },
      totalFinancedAmount: { type: Number, default: 0 },
      firstDueDate: { type: String, default: '' },
      emiSchedule: [
        {
          installmentNo: Number,
          dueDate: String,
          amount: Number,
          status: { type: String, default: 'PENDING' },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

export const Bill = mongoose.models.Bill || mongoose.model('Bill', billSchema);

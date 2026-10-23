import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
    },
    model: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Price must be positive'],
    },
    costPrice: {
      type: Number,
      default: 0,
      min: [0, 'Cost price must be positive'],
    },
    margin: {
      type: Number,
      default: 0,
    },
    gstRate: {
      type: Number,
      default: 18,
    },
    hsnCode: {
      type: String,
      default: '85171300',
      trim: true,
    },
    stock: {
      type: Number,
      default: 0,
    },
    imeiNumbers: {
      type: [String],
      default: [],
    },
    sku: {
      type: String,
      trim: true,
      default: '',
    },
    variant: {
      type: String,
      trim: true,
      default: '',
    },
    rackLocation: {
      type: String,
      trim: true,
      default: 'Rack A1',
    },
    ean: {
      type: String,
      trim: true,
      default: '',
    },
    isDualImei: {
      type: Boolean,
      default: false,
    },
    minThreshold: {
      type: Number,
      default: 5,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    roiBadge: {
      type: String,
      default: '',
    },
    statusTag: {
      type: String,
      default: '',
    },
    series: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Calculate margin before save if price and costPrice exist
productSchema.pre('save', function () {
  if (this.price && this.costPrice && this.price > 0) {
    this.margin = Number((((this.price - this.costPrice) / this.price) * 100).toFixed(1));
  }
});

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    hsnCode: {
      type: String,
      default: '85171300',
      trim: true,
    },
    defaultRack: {
      type: String,
      default: 'Rack A1',
      trim: true,
    },
    isDualImei: {
      type: Boolean,
      default: false,
    },
    itemCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

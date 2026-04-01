import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SpAbhay_User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  stock: {
    type: Number,
    default: 0
  },
  barcode: {
    type: String,
    default: null
  }
});

// Since barcode can be null if entered manually, but must be unique if present alongside shop
itemSchema.index(
  { shopId: 1, barcode: 1 }, 
  { unique: true, partialFilterExpression: { barcode: { $type: "string", $ne: "" } } }
);

export const SpAbhay_Item = mongoose.model('SpAbhay_Item', itemSchema);

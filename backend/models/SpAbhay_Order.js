import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SpAbhay_User',
    required: true
  },
  orderIdString: {
    type: String,
    required: true,
    unique: true
  },
  items: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'SpAbhay_Item' },
    name: String,
    price: Number,
    quantity: Number
  }],
  total: {
    type: Number,
    required: true
  },
  paymentMode: {
    type: String,
    default: 'Online' // Online, Manual
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Ready for Pickup', 'Completed', 'Rejected'],
    default: 'Pending'
  }
}, { timestamps: true });

export const SpAbhay_Order = mongoose.model('SpAbhay_Order', orderSchema);

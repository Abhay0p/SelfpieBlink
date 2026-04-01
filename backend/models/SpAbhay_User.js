import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  shopName: {
    type: String,
    required: true
  },
  ownerName: String,
  phone: String,
  role: {
    type: String,
    default: 'merchant'
  },
  location: {
    lat: Number,
    lng: Number
  }
}, { timestamps: true });

export const SpAbhay_User = mongoose.model('SpAbhay_User', userSchema);

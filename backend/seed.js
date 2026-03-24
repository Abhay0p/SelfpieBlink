import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { SpAbhay_User } from './models/SpAbhay_User.js';
import { SpAbhay_Item } from './models/SpAbhay_Item.js';
import { SpAbhay_Order } from './models/SpAbhay_Order.js';

dotenv.config();

const RUN_SEED = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/grocery_billing');
    console.log("Connected to MongoDB...");

    // Clear Demo Data (optional but good for clean resed)
    await SpAbhay_User.deleteMany({ email: { $in: ['merchant@demo.com', 'supermart@demo.com'] } });

    // 1. Create Demo Merchants
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('secret123', salt);

    const merchantA = await SpAbhay_User.create({
      email: 'merchant@demo.com',
      password: hash,
      shopName: 'Sharma General Store',
      ownerName: 'Rahul Sharma',
      phone: '9876543210',
      role: 'merchant'
    });

    const merchantB = await SpAbhay_User.create({
      email: 'supermart@demo.com',
      password: hash,
      shopName: 'MegaSupermart',
      ownerName: 'Amit Verma',
      phone: '9876543211',
      role: 'merchant'
    });

    // Clean items just for these
    await SpAbhay_Item.deleteMany({ shopId: { $in: [merchantA._id, merchantB._id] } });

    // 2. Insert Demo Catalogs
    const sharmaItems = [
      { shopId: merchantA._id, name: 'Maggi 2-Min Noodles', price: 14, stock: 50, barcode: '8901058810014' },
      { shopId: merchantA._id, name: 'Amul Butter 100g', price: 58, stock: 20, barcode: '8901262010015' },
      { shopId: merchantA._id, name: 'Lays Classic Salted', price: 20, stock: 45, barcode: '8901491101905' }
    ];

    const megaItems = [
      { shopId: merchantB._id, name: 'Coca Cola 2L', price: 95, stock: 150, barcode: '8901764012270' },
      { shopId: merchantB._id, name: 'Britannia Good Day', price: 30, stock: 100, barcode: '8901063142278' },
      { shopId: merchantB._id, name: 'Tata Salt 1kg', price: 28, stock: 200, barcode: '8901396014022' }
    ];

    await SpAbhay_Item.insertMany([...sharmaItems, ...megaItems]);

    console.log('✅ Demo Shops & Inventory Injected Successfully!');
    console.log(`\n--- ACCOUNTS AVAILABLE ---`);
    console.log(`[Sharma General Store] Email: merchant@demo.com | Pass: secret123`);
    console.log(`\tStore Entrance QR Identity: ${merchantA._id}`);
    console.log(`[MegaSupermart] Email: supermart@demo.com | Pass: secret123`);
    console.log(`\tStore Entrance QR Identity: ${merchantB._id}`);
    console.log(`\nTo test hardware scanning, point the app's barcode scanner at a REAL packet of Maggi or Coke and match the barcode above!`);

    process.exit(0);
  } catch (err) {
    console.error("Seeding Failed:", err);
    process.exit(1);
  }
};

RUN_SEED();

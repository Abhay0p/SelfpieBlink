import express from 'express';
import { matchListWithAI } from '../controllers/SpAbhay_aiMatcher.js';
import multer from 'multer';
import { SpAbhay_Item } from '../models/SpAbhay_Item.js';
import { SpAbhay_Order } from '../models/SpAbhay_Order.js';
import { SpAbhay_User } from '../models/SpAbhay_User.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

// Nearby Stores (Demo Seeded Stores)
router.get('/shops/nearby', async (req, res) => {
  try {
    // In production, use MongoDB GeoSpatial index $near queries. For now, sending all merchants.
    const shops = await SpAbhay_User.find({ role: 'merchant' }).select('-password -role');
    res.json({ success: true, data: shops });
  } catch(error) {
    res.status(500).json({ success: false, message: 'Failed to locate shops' });
  }
});

// Fetch Shop Inventory
router.get('/inventory/:shopId', async (req, res) => {
  try {
    const items = await SpAbhay_Item.find({ shopId: req.params.shopId });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Create Item
router.post('/inventory/:shopId', async (req, res) => {
  try {
    const data = { ...req.body, shopId: req.params.shopId };
    if (data.barcode === '') delete data.barcode;
    const newItem = await SpAbhay_Item.create(data);
    res.json({ success: true, data: newItem });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create item', error: error.message });
  }
});

// Update Item
router.put('/inventory/:shopId/:itemId', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.barcode === '') delete data.barcode;
    const updated = await SpAbhay_Item.findOneAndUpdate(
       { _id: req.params.itemId, shopId: req.params.shopId }, 
       data, 
       { new: true }
    );
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update' });
  }
});

// Delete Item
router.delete('/inventory/:shopId/:itemId', async (req, res) => {
  try {
    await SpAbhay_Item.findOneAndDelete({ _id: req.params.itemId, shopId: req.params.shopId });
    res.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
});

// Barcode Scan endpoint
router.get('/inventory/scan/:shopId/:barcode', async (req, res) => {
  try {
    // Exact or loose regex search for barcode (ignoring spaces)
    const cleanBarcode = req.params.barcode.replace(/\s+/g, '').trim();
    const item = await SpAbhay_Item.findOne({ 
      shopId: req.params.shopId, 
      barcode: new RegExp(`^${cleanBarcode}$`, 'i') 
    });
    
    if (!item) return res.status(404).json({ success: false, message: 'Barcode not found in Store Database.' });
    if (item.stock < 1) return res.status(400).json({ success: false, message: 'Item is fully out of stock.' });
    
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Barcode Lookup crashed internally.' });
  }
});

// AI Match Request
router.post('/ai-match/:shopId', upload.single('listImage'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });
    const inventory = await SpAbhay_Item.find({ shopId: req.params.shopId }).lean();
    if(inventory.length === 0) return res.json({ success: true, data: [] });

    const matchedItems = await matchListWithAI(req.file.buffer, inventory, req.file.mimetype);
    res.json({ success: true, data: matchedItems });
  } catch (error) {
    console.error('AI Match Error:', error);
    res.status(500).json({ success: false, message: 'AI processing failed' });
  }
});

// Checkout Generation Route
router.post('/checkout', async (req, res) => {
  const { items, total, shopId } = req.body;
  const orderIdString = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
  
  try {
    const shop = await SpAbhay_User.findById(shopId);
    const shopNameClean = shop ? shop.shopName.replace(/\s+/g, '') : 'SelfpieMerchant';

    await SpAbhay_Order.create({ shopId, orderIdString, items, total, status: 'Pending' });
    
    // Generates a native Paytm intent link that skips Razorpay entirely
    const upiLink = `upi://pay?pa=${shopNameClean}@paytm&pn=${shopNameClean}&am=${total}&cu=INR&tn=${orderIdString}`;
    
    res.json({ success: true, orderId: orderIdString, upiLink });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Order generation failed' });
  }
});

// Order State Transition (Merchant Action)
router.put('/orders/:orderIdString/status', async (req, res) => {
  const { status, shopId } = req.body;
  
  try {
    const validStatuses = ['Accepted', 'Ready for Pickup', 'Rejected'];
    if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const order = await SpAbhay_Order.findOneAndUpdate(
       { orderIdString: req.params.orderIdString, shopId }, 
       { status }, 
       { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

// Exit Validation Route (Merchant authenticates gate pass)
router.post('/orders/exit-validate', async (req, res) => {
  const { orderIdString, shopId } = req.body;
  
  try {
    const order = await SpAbhay_Order.findOne({ orderIdString, shopId });
    if (!order) return res.status(404).json({ success: false, message: 'Invalid Gate Pass! Order not found.' });
    if (order.status === 'Completed') return res.status(400).json({ success: false, message: "Fraud Alert: Gate pass already scanned & used." });
    if (order.status === 'Rejected' || order.status === 'Pending Payment') return res.status(400).json({ success: false, message: "Order is unpaid or rejected." });
    
    // Deduct Stock
    for (let item of order.items) {
      await SpAbhay_Item.updateOne({ _id: item.itemId }, { $inc: { stock: -item.quantity } });
    }
    
    order.status = 'Completed';
    await order.save();
    
    res.json({ success: true, message: `Gate pass validated. Stock deducted for ${orderIdString}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Exit validation failed' });
  }
});

export default router;

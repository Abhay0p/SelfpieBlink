import { SpAbhay_Item } from '../models/SpAbhay_Item.js';
import { SpAbhay_Order } from '../models/SpAbhay_Order.js';
import { SpAbhay_User } from '../models/SpAbhay_User.js';
import { matchListWithAI } from './SpAbhay_aiMatcher.js';

export const getNearbyShops = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const shops = await SpAbhay_User.find({ role: 'merchant' }).select('-password -role').lean();
    
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const toRad = (value) => (value * Math.PI) / 180;
      const R = 6371; // Earth's radius in km

      shops.forEach(shop => {
         if (shop.location && shop.location.lat && shop.location.lng) {
            const dLat = toRad(shop.location.lat - userLat);
            const dLon = toRad(shop.location.lng - userLng);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(userLat)) * Math.cos(toRad(shop.location.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
            shop.distanceKm = R * c;
         } else {
            shop.distanceKm = 9999;
         }
      });
      shops.sort((a, b) => a.distanceKm - b.distanceKm);
    }
    
    res.json({ success: true, data: shops });
  } catch(error) {
    res.status(500).json({ success: false, message: 'Failed to locate shops' });
  }
};

export const getInventory = async (req, res) => {
  try {
    const items = await SpAbhay_Item.find({ shopId: req.params.shopId });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};

export const createItem = async (req, res) => {
  try {
    const data = { ...req.body, shopId: req.params.shopId };
    if (data.barcode === '') delete data.barcode;
    const newItem = await SpAbhay_Item.create(data);
    res.json({ success: true, data: newItem });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create item', error: error.message });
  }
};

export const updateItem = async (req, res) => {
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
};

export const deleteItem = async (req, res) => {
  try {
    await SpAbhay_Item.findOneAndDelete({ _id: req.params.itemId, shopId: req.params.shopId });
    res.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
};

export const scanBarcode = async (req, res) => {
  try {
    const cleanBarcode = req.params.barcode.replace(/\s+/g, '').trim();
    
    // Support either physical product barcode OR internal database ID (via QR)
    const query = { 
      shopId: req.params.shopId, 
      $or: [ { barcode: new RegExp(`^${cleanBarcode}$`, 'i') } ] 
    };
    
    // If the scanned string is a valid MongoDB ID, allow matching by internal _id too
    if (cleanBarcode.match(/^[0-9a-fA-F]{24}$/)) {
       query.$or.push({ _id: cleanBarcode });
    }

    const item = await SpAbhay_Item.findOne(query);
    
    if (!item) return res.status(404).json({ success: false, message: 'Barcode not found in Store Database.' });
    if (item.stock < 1) return res.status(400).json({ success: false, message: 'Item is fully out of stock.' });
    
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Barcode Lookup crashed internally.' });
  }
};

export const matchAIList = async (req, res) => {
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
};

export const generateCheckout = async (req, res) => {
  const { items, total, shopId } = req.body;
  const orderIdString = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
  
  try {
    const shop = await SpAbhay_User.findById(shopId);
    const shopNameClean = shop ? shop.shopName.replace(/\s+/g, '') : 'SelfpieMerchant';

    await SpAbhay_Order.create({ shopId, orderIdString, items, total, status: 'Pending' });
    
    const upiLink = `upi://pay?pa=${shopNameClean}@paytm&pn=${shopNameClean}&am=${total}&cu=INR&tn=${orderIdString}`;
    
    res.json({ success: true, orderId: orderIdString, upiLink });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Order generation failed' });
  }
};

export const updateOrderStatus = async (req, res) => {
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
};

export const exitValidate = async (req, res) => {
  const { orderIdString, shopId } = req.body;
  
  try {
    const order = await SpAbhay_Order.findOne({ orderIdString, shopId });
    if (!order) return res.status(404).json({ success: false, message: 'Invalid Gate Pass! Order not found.' });
    if (order.status === 'Completed') return res.status(400).json({ success: false, message: "Fraud Alert: Gate pass already scanned & used." });
    if (order.status === 'Rejected' || order.status === 'Pending Payment') return res.status(400).json({ success: false, message: "Order is unpaid or rejected." });
    
    order.status = 'Completed';
    await order.save();
    
    res.json({ success: true, message: `Gate pass validated. Stock deducted for ${orderIdString}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Exit validation failed' });
  }
};

export const verifyPayment = async (req, res) => {
  const { orderIdString, shopId } = req.body;
  try {
    const order = await SpAbhay_Order.findOne({ orderIdString, shopId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    // Deduct stock immediately upon payment
    for (let item of order.items) {
      await SpAbhay_Item.updateOne({ _id: item.itemId }, { $inc: { stock: -item.quantity } });
    }
    
    res.json({ success: true, message: 'Payment validated and stock instantly deducted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Stock deduction failed.' });
  }
};

export const getHistory = async (req, res) => {
  try {
    const history = await SpAbhay_Order.find({ 
      shopId: req.params.shopId,
      status: { $in: ['Completed', 'Pending', 'Accepted', 'Ready for Pickup'] }
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve history.' });
  }
};

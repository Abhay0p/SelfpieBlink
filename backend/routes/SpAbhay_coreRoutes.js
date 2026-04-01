import express from 'express';
import multer from 'multer';
import { 
  getNearbyShops, 
  getInventory, 
  createItem, 
  updateItem, 
  deleteItem, 
  scanBarcode, 
  matchAIList, 
  generateCheckout, 
  updateOrderStatus, 
  exitValidate,
  verifyPayment,
  getHistory
} from '../controllers/SpAbhay_coreController.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

router.get('/shops/nearby', getNearbyShops);
router.get('/inventory/:shopId', getInventory);
router.post('/inventory/:shopId', createItem);
router.put('/inventory/:shopId/:itemId', updateItem);
router.delete('/inventory/:shopId/:itemId', deleteItem);
router.get('/inventory/scan/:shopId/:barcode', scanBarcode);

// AI processing needs multer middleware
router.post('/ai-match/:shopId', upload.single('listImage'), matchAIList);

router.post('/checkout', generateCheckout);
router.post('/orders/verify-payment', verifyPayment);
router.get('/history/:shopId', getHistory);
router.put('/orders/:orderIdString/status', updateOrderStatus);
router.post('/orders/exit-validate', exitValidate);

export default router;

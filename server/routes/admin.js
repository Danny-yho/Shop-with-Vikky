const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/admin-controller');
const upload = require('../middleware/upload');
const { authenticate, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../utils/schemas');
const asyncHandler = require('../middleware/async-handler');

const router = express.Router();
const adminLimit = rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false });
router.use(authenticate, requireAdmin, adminLimit);

router.get('/products', asyncHandler(controller.listProducts));
router.post('/products', validate(schemas.product), asyncHandler(controller.createProduct));
router.put('/products/:id', validate(schemas.product), asyncHandler(controller.updateProduct));
router.delete('/products/:id', asyncHandler(controller.deleteProduct));
router.get('/categories', asyncHandler(controller.listCategories));
router.post('/categories', validate(schemas.category), asyncHandler(controller.createCategory));
router.put('/categories/:id', validate(schemas.category), asyncHandler(controller.updateCategory));
router.delete('/categories/:id', asyncHandler(controller.deleteCategory));
router.get('/orders', asyncHandler(controller.listOrders));
router.patch('/orders/:id', validate(schemas.orderStatus), asyncHandler(controller.updateOrder));
router.get('/settings', asyncHandler(controller.listSettings));
router.put('/settings', validate(schemas.settings), asyncHandler(controller.updateSettings));
router.post('/uploads', upload.single('image'), asyncHandler(controller.uploadImage));
router.get('/messages', asyncHandler(controller.listMessages));

module.exports = router;

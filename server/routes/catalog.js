const express = require('express');
const controller = require('../controllers/catalog-controller');
const asyncHandler = require('../middleware/async-handler');

const router = express.Router();
router.get('/products', asyncHandler(controller.listProducts));
router.get('/products/:slug', asyncHandler(controller.getProduct));
router.get('/categories', asyncHandler(controller.listCategories));
router.get('/settings', asyncHandler(controller.publicSettings));

module.exports = router;

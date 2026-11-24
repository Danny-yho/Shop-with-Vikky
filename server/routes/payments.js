const express = require('express');
const controller = require('../controllers/order-controller');
const validate = require('../middleware/validate');
const schemas = require('../utils/schemas');
const asyncHandler = require('../middleware/async-handler');

const router = express.Router();
router.post('/paystack/verify', validate(schemas.paymentVerification), asyncHandler(controller.verifyPaystack));
router.post('/paystack/webhook', asyncHandler(controller.paystackWebhook));

module.exports = router;

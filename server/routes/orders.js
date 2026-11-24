const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/order-controller');
const validate = require('../middleware/validate');
const schemas = require('../utils/schemas');
const asyncHandler = require('../middleware/async-handler');
const db = require('../db');

const router = express.Router();
const orderLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 15, standardHeaders: true, legacyHeaders: false });
router.post('/', orderLimiter, validate(schemas.order), asyncHandler(controller.submitOrder));
router.get('/track', (req, res, next) => {
  req.params.trackingCode = String(req.query.orderNumber || '').trim().toUpperCase();
  const parsed = schemas.trackingCode.safeParse({ trackingCode: req.params.trackingCode });
  if (!parsed.success) return res.status(400).json({ error: 'Invalid tracking code' });
  req.trackPhone = String(req.query.phone || '').trim();
  next();
}, asyncHandler(async (req, res) => {
  const order = await db.one(`SELECT tracking_code AS "trackingCode", status, payment_status AS "paymentStatus",
    total, currency, created_at AS "createdAt" FROM orders WHERE tracking_code=$1 AND phone=$2`,
  [req.params.trackingCode, req.trackPhone]);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
}));
router.get('/track/:trackingCode', (req, res, next) => {
  const parsed = schemas.trackingCode.safeParse({ trackingCode: req.params.trackingCode });
  if (!parsed.success) return res.status(400).json({ error: 'Invalid tracking code' });
  next();
}, asyncHandler(controller.trackOrder));

module.exports = router;

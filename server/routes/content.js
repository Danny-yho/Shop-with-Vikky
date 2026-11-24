const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/content-controller');
const validate = require('../middleware/validate');
const schemas = require('../utils/schemas');
const asyncHandler = require('../middleware/async-handler');

const router = express.Router();
const submissionLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 8, standardHeaders: true, legacyHeaders: false });
router.post('/contact', submissionLimit, validate(schemas.contact), asyncHandler(controller.submitContact));
router.post('/newsletter', submissionLimit, validate(schemas.newsletter), asyncHandler(controller.subscribe));

module.exports = router;

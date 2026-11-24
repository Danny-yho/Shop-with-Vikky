const path = require('path');
const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./utils/config');
const db = require('./db');
const { protect } = require('./middleware/csrf');
const asyncHandler = require('./middleware/async-handler');
const { notFound, errorHandler } = require('./middleware/error-handler');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', config.nodeEnv === 'production' ? 1 : false);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://js.paystack.co'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://fonts.googleapis.com', 'https://paystack.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.paystack.co'],
      frameSrc: ['https://checkout.paystack.com'],
      formAction: ["'self'"]
    }
  }
}));
app.use(compression());
app.use(cors({
  origin(origin, callback) {
    if (!origin || config.allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true
}));
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many API requests. Please try again shortly.' }
}));
app.use(express.json({
  limit: '1mb',
  verify: (req, res, buffer) => { req.rawBody = Buffer.from(buffer); }
}));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());
app.use(protect);

app.get('/health', asyncHandler(async (req, res) => {
  await db.query('SELECT 1');
  res.json({ status: 'ok' });
}));
app.use(express.static(path.resolve(__dirname, '..', 'public'), { index: 'index.html' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/catalog'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api', require('./routes/content'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use(notFound);
app.use(errorHandler);

module.exports = app;

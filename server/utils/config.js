require('dotenv').config();

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  databaseUrl: process.env.DATABASE_URL || '',
  frontendUrl: process.env.FRONTEND_URL || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  cookieSecure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
  cookieSameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  clientOrigin: process.env.CLIENT_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5000',
  maxUploadMb: Math.min(Number(process.env.MAX_UPLOAD_MB) || 5, 10),
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || ''
};

if (config.nodeEnv === 'production' && config.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production');
}
if (!config.jwtSecret) {
  config.jwtSecret = 'development-only-secret-change-before-deploy-32chars';
}

config.allowedOrigins = [...new Set([
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:5173',
  config.clientOrigin,
  config.frontendUrl
].filter(Boolean))];

module.exports = config;

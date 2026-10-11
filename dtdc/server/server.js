require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const branchRoutes = require('./routes/branches');
const parcelRoutes = require('./routes/parcels');
const calculatorRoutes = require('./routes/calculator');
const reviewRoutes = require('./routes/reviews');
const enquiryRoutes = require('./routes/enquiries');
const chatRoutes = require('./routes/chat');

const app = express();

// Trust reverse proxies (Render, Vercel, Cloudflare, AWS) so client IPs are accurate
app.set('trust proxy', 1);

// Hide server stack signatures
app.disable('x-powered-by');

// 1. Helmet HTTP Security Headers (Protects against XSS, clickjacking, MIME sniffing)
// Configured to allow Google Identity Services popups and referrer verification
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// 2. CORS Method & Header Control
app.use(cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Payload size limiting (Prevents DoS payload memory overflow attacks)
app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true, limit: '500kb' }));

// 4. NoSQL Query Sanitization Middleware (Prevents Mongo $ / . operator injection)
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    sanitizeData(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeData(req.query);
  }
  next();
});

function sanitizeData(obj) {
  for (const key in obj) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeData(obj[key]);
    }
  }
}

// 5. Rate Limiters (Prevents brute-force attacks & API denial-of-service)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 250,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a few minutes.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login or registration attempts. Please wait a few minutes before trying again.' }
});

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Assistant rate limit reached. Please wait a few minutes.' }
});

// Apply rate limiters
app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/chat', chatLimiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/parcels', parcelRoutes);
app.use('/api/calculator', calculatorRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/chat', chatRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true, status: 'secure', time: new Date().toISOString() }));

app.get('/api/email-diag', async (req, res) => {
  const { deliverEmail } = require('./utils/email');
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').trim();
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  const webhookUrl = (process.env.GOOGLE_SCRIPT_WEBHOOK_URL || process.env.EMAIL_WEBHOOK_URL || '').trim();

  const info = {
    renderEgressNotice: 'Render Free Tier blocks outbound SMTP (ports 25, 465, 587) causing ETIMEDOUT. Use RESEND_API_KEY or GOOGLE_SCRIPT_WEBHOOK_URL over HTTPS port 443.',
    EMAIL_ENABLED: process.env.EMAIL_ENABLED,
    has_RESEND_API_KEY: !!resendKey,
    has_GOOGLE_SCRIPT_WEBHOOK_URL: !!webhookUrl,
    has_EMAIL_USER: !!user,
    EMAIL_USER: user || null,
    has_EMAIL_PASS: !!pass,
    ADMIN_NOTIFY_EMAIL: process.env.ADMIN_NOTIFY_EMAIL || 'vishwa2o2ok@gmail.com'
  };

  if (req.query.testSend === 'true') {
    const result = await deliverEmail({
      to: process.env.ADMIN_NOTIFY_EMAIL || 'vishwa2o2ok@gmail.com',
      subject: 'Test Notification from DK Enterprise Kudlu Gate',
      text: 'This is a test notification confirming that email delivery from Render is working!'
    });
    return res.json({ testSend: true, result, info });
  }

  return res.json({ ok: true, info });
});

// Static frontend
app.use(express.static(path.join(__dirname, '..', 'public'), {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// Fallback 404 for unknown API routes
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`🔒 DK Enterprise Kudlu New Franchise server running on port ${PORT}`));
});

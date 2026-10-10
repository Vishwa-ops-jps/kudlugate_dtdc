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

// Hide server stack signatures
app.disable('x-powered-by');

// 1. Helmet HTTP Security Headers (Protects against XSS, clickjacking, MIME sniffing)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
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
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login or registration attempts. Please wait 15 minutes before trying again.' }
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

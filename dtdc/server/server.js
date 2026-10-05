const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const {
  helmetMiddleware,
  noSqlSanitizer,
  authLimiter,
  aiLimiter,
  apiLimiter
} = require('./middleware/security');

const authRoutes = require('./routes/auth');
const branchRoutes = require('./routes/branches');
const parcelRoutes = require('./routes/parcels');
const calculatorRoutes = require('./routes/calculator');
const reviewRoutes = require('./routes/reviews');
const enquiryRoutes = require('./routes/enquiries');
const chatRoutes = require('./routes/chat');

const app = express();

// Trust reverse proxy headers on Render/Cloudflare for accurate client IP rate limiting
app.set('trust proxy', 1);

// Disable X-Powered-By header to hide Express signature from scanners
app.disable('x-powered-by');

// Security Headers (Clickjacking, HSTS, XSS protection, MIME sniffing prevention)
app.use(helmetMiddleware);

// CORS configuration
app.use(cors());

// Strict body payload size limit to prevent Denial of Service (DoS) memory attacks
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// NoSQL Injection sanitizer (strips MongoDB operators like $ne, $gt from req.body/params/query)
app.use(noSqlSanitizer);

// Health check endpoint
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Apply rate limiters to sensitive routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/chat', aiLimiter, chatRoutes);
app.use('/api', apiLimiter);

// API routes
app.use('/api/branches', branchRoutes);
app.use('/api/parcels', parcelRoutes);
app.use('/api/calculator', calculatorRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/enquiries', enquiryRoutes);

// Static frontend (disable caching for instant updates)
app.use(express.static(path.join(__dirname, '..', 'public'), {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
}));

// Fallback 404 for unknown API routes
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`DTDC Kudlu Gate secure server running on http://localhost:${PORT}`));
});

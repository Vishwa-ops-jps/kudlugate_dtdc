const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// ---- 1. NoSQL Injection Sanitizer ----
// Prevents attackers from injecting MongoDB operators like { "$ne": null } or { "$gt": "" }
function sanitizeNoSQL(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeNoSQL);
  }
  const clean = {};
  for (const key of Object.keys(obj)) {
    // Strip keys starting with $ or containing .
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    clean[key] = sanitizeNoSQL(obj[key]);
  }
  return clean;
}

function noSqlSanitizer(req, res, next) {
  if (req.body) req.body = sanitizeNoSQL(req.body);
  if (req.query) req.query = sanitizeNoSQL(req.query);
  if (req.params) req.params = sanitizeNoSQL(req.params);
  next();
}

// ---- 2. Rate Limiters ----
// Strict rate limiter for Auth endpoints (Login, Register, Forgot Password)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 15 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.' }
});

// Rate limiter for AI Chat endpoint
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // limit each IP to 25 AI queries per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Chat rate limit reached. Please wait a few minutes before asking more questions.' }
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // limit each IP to 150 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP. Please slow down.' }
});

// ---- 3. Helmet Configuration ----
const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // Disabled for static site inline scripts flexibility, headers remain active
  crossOriginEmbedderPolicy: false,
  xFrameOptions: { action: 'deny' }, // Prevents Clickjacking attacks
  xPoweredBy: false // Hides Express server signature from scanners
});

module.exports = {
  noSqlSanitizer,
  authLimiter,
  aiLimiter,
  apiLimiter,
  helmetMiddleware
};

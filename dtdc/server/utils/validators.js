// Shared validation helpers used across routes (auth, parcels, branches, enquiries).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/; // Indian mobile numbers: 10 digits, starts 6-9
const PINCODE_RE = /^\d{6}$/; // Indian PIN codes: 6 digits

// Strips spaces, hyphens, and a leading +91/91 so "+91 98765-43210" and
// "9876543210" both validate the same way.
function normalizePhone(raw) {
  return String(raw || '').trim().replace(/[\s-]/g, '').replace(/^(\+?91)/, '');
}

function isValidEmail(raw) {
  return EMAIL_RE.test(String(raw || '').trim());
}

function isValidPhone(raw) {
  return PHONE_RE.test(normalizePhone(raw));
}

function isValidPincode(raw) {
  // Pincode is often optional on a form - only validate it when something was entered.
  const val = String(raw || '').trim();
  return val === '' || PINCODE_RE.test(val);
}

module.exports = { isValidEmail, isValidPhone, isValidPincode, normalizePhone };

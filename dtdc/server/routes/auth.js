const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { isValidEmail, isValidPhone } = require('../utils/validators');
const { sendPasswordResetEmail } = require('../utils/email');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function isGoogleClientId(value) {
  return typeof value === 'string' && value.trim().endsWith('.apps.googleusercontent.com');
}

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, branch: user.branch, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Public: customer self-registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({ error: 'Enter a valid 10-digit mobile number.' });
    }
    if (password.length < 6) return res.status(400).json({ error: 'Password should be at least 6 characters.' });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, phone, passwordHash, role: 'customer' });
    const token = signToken(user);
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed.', detail: err.message });
  }
});

// Public: login (works for customer, staff, and admin - role comes back in the token)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user || !user.active) return res.status(401).json({ error: 'Invalid email or password.' });
    if (!user.passwordHash) {
      return res.status(401).json({ error: 'This account uses "Sign in with Google". Use the Google button instead.' });
    }

    const ok = await bcrypt.compare(password || '', user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, branch: user.branch }
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed.', detail: err.message });
  }
});

// Public: lets the frontend know which Google client ID to render the button with.
router.get('/google-client-id', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  res.json({ clientId: isGoogleClientId(clientId) ? clientId.trim() : null });
});

// Public: "Sign in with Google". The frontend sends the ID token (credential)
// it got from Google's Sign-In button. We verify it with Google's servers,
// so the email address on the account is guaranteed to be the customer's
// real, verified Google email - not just whatever they typed into a box.
router.post('/google', async (req, res) => {
  try {
    if (!isGoogleClientId(process.env.GOOGLE_CLIENT_ID)) {
      return res.status(500).json({ error: 'Google sign-in is not configured on this server.' });
    }
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Missing Google credential.' });

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } catch (err) {
      // Keep the response generic, but record Google's reason server-side so
      // an invalid client ID, expired token, or certificate/network problem
      // can be diagnosed without ever logging the customer's credential.
      console.error('Google ID token verification failed:', err.message);
      return res.status(401).json({ error: 'Could not verify Google sign-in. Please try again.' });
    }

    if (!payload || !payload.email) {
      return res.status(401).json({ error: 'Google did not return an email address.' });
    }
    if (!payload.email_verified) {
      return res.status(401).json({ error: 'Your Google email is not verified.' });
    }

    const email = payload.email.toLowerCase();
    let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email }] });

    if (user) {
      // Link the Google account to an existing email/password account, if needed.
      if (!user.googleId) user.googleId = payload.sub;
      user.emailVerified = true;
      if (!user.name && payload.name) user.name = payload.name;
      await user.save();
    } else {
      user = await User.create({
        name: payload.name || email.split('@')[0],
        email,
        googleId: payload.sub,
        emailVerified: true,
        role: 'customer'
      });
    }

    if (!user.active) return res.status(401).json({ error: 'This account has been disabled.' });

    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, branch: user.branch, emailVerified: user.emailVerified }
    });
  } catch (err) {
    res.status(500).json({ error: 'Google sign-in failed.', detail: err.message });
  }
});

// Public: request a password reset link. Works for customer, staff, and
// admin accounts alike - anyone who logs in with a password can use it.
// Always returns the same generic message, whether or not the email
// exists, so this endpoint can't be used to check who has an account.
router.post('/forgot-password', async (req, res) => {
  const generic = { message: 'If an account with that email exists, a password reset link has been sent.' };
  try {
    const email = (req.body.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Password reset requested for ${email}, but account does not exist in database.`);
      return res.json(generic);
    }
    if (!user.active) {
      console.log(`Password reset requested for ${email}, but account is disabled.`);
      return res.json(generic);
    }
    if (!user.passwordHash) {
      console.log(`Password reset requested for ${email}, but account uses Google Sign-In (no passwordHash).`);
      return res.json(generic);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    let baseUrl = process.env.APP_BASE_URL;
    if (!baseUrl || baseUrl.includes('localhost')) {
      const host = req.get('x-forwarded-host') || req.get('host');
      const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
      baseUrl = `${protocol}://${host}`;
    }
    baseUrl = baseUrl.replace(/\/$/, '');

    const resetLink = `${baseUrl}/reset-password.html?token=${rawToken}&email=${encodeURIComponent(email)}`;
    
    sendPasswordResetEmail({ to: email, name: user.name, resetLink })
      .then(result => {
        if (result && !result.sent) {
          console.error('Password reset email failed to send:', result.reason);
        } else {
          console.log(`Password reset email successfully dispatched to ${email}`);
        }
      })
      .catch(err => console.error('Password reset email error:', err.message));

    res.json(generic);
  } catch (err) {
    res.status(500).json({ error: 'Could not process request.', detail: err.message });
  }
});

// Public: complete a password reset using the token from the emailed link.
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, password } = req.body;
    if (!email || !token || !password) return res.status(400).json({ error: 'Missing required fields.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password should be at least 6 characters.' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetTokenHash: tokenHash,
      resetTokenExpires: { $gt: new Date() }
    }).select('+resetTokenHash +resetTokenExpires');

    if (!user) return res.status(400).json({ error: 'This reset link is invalid or has expired. Request a new one.' });

    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetTokenHash = null;
    user.resetTokenExpires = null;
    await user.save();

    res.json({ message: 'Password updated. You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not reset password.', detail: err.message });
  }
});

// Who am I - lets the frontend restore session on page load
router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash').populate('branch', 'name city');
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user });
});

module.exports = router;

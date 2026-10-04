const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    // Not required: accounts created via "Sign in with Google" have no password.
    passwordHash: { type: String },
    // Set only for accounts created/linked via "Sign in with Google".
    googleId: { type: String, unique: true, sparse: true },
    emailVerified: { type: Boolean, default: false },
    role: { type: String, enum: ['customer', 'staff', 'admin'], default: 'customer' },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
    active: { type: Boolean, default: true },
    // "Forgot password" flow: a hashed, time-limited token. Never store the raw token.
    resetTokenHash: { type: String, default: null, select: false },
    resetTokenExpires: { type: Date, default: null, select: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);

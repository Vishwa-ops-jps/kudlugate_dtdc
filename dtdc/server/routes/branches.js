const express = require('express');
const bcrypt = require('bcryptjs');
const Branch = require('../models/Branch');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public: list active branches (e.g. for a "our branches" section, or the booking form)
router.get('/', async (req, res) => {
  const branches = await Branch.find({ active: true }).sort('name');
  res.json({ branches });
});

// Admin only: create a branch
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { name, code, city, state, address, phone } = req.body;
    if (!name || !code || !city || !state) {
      return res.status(400).json({ error: 'Name, code, city and state are required.' });
    }
    const branch = await Branch.create({ name, code, city, state, address, phone });
    res.status(201).json({ branch });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'A branch with this code already exists.' });
    res.status(500).json({ error: 'Could not create branch.', detail: err.message });
  }
});

// Admin only: update a branch
router.put('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!branch) return res.status(404).json({ error: 'Branch not found.' });
  res.json({ branch });
});

// Admin only: deactivate a branch (soft delete, keeps history intact)
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const branch = await Branch.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!branch) return res.status(404).json({ error: 'Branch not found.' });
  res.json({ branch });
});

// Admin only: create a staff account tied to a branch
router.post('/:id/staff', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) return res.status(404).json({ error: 'Branch not found.' });

    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

    const passwordHash = await bcrypt.hash(password, 10);
    const staff = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role: 'staff',
      branch: branch._id
    });
    res.status(201).json({ staff: { id: staff._id, name: staff.name, email: staff.email, branch: branch.name } });
  } catch (err) {
    res.status(500).json({ error: 'Could not create staff account.', detail: err.message });
  }
});

// Admin only: list all staff, grouped by branch
router.get('/staff/all', requireAuth, requireRole('admin'), async (req, res) => {
  const staff = await User.find({ role: 'staff' }).select('-passwordHash').populate('branch', 'name city code');
  res.json({ staff });
});

// Admin only: deactivate a staff account
router.delete('/staff/:userId', requireAuth, requireRole('admin'), async (req, res) => {
  const staff = await User.findOneAndUpdate(
    { _id: req.params.userId, role: 'staff' },
    { active: false },
    { new: true }
  );
  if (!staff) return res.status(404).json({ error: 'Staff account not found.' });
  res.json({ staff });
});

module.exports = router;

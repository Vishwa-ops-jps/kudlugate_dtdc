const express = require('express');
const Enquiry = require('../models/Enquiry');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sendEnquiryReceipt, sendAdminEnquiryAlert } = require('../utils/email');
const { isValidPhone, isValidEmail } = require('../utils/validators');

const router = express.Router();

// Public: submit the contact form
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !phone || !message) {
      return res.status(400).json({ error: 'Name, phone and message are required.' });
    }
    if (!isValidPhone(phone)) return res.status(400).json({ error: 'Enter a valid 10-digit mobile number.' });
    if (email && !isValidEmail(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
    const enquiry = await Enquiry.create({ name, email, phone, subject, message });
    sendEnquiryReceipt({ to: email, name }).catch(() => {});
    sendAdminEnquiryAlert({ name, phone, email, subject, message }).catch(() => {});
    res.status(201).json({ enquiry, message: 'Thanks, we will get back to you shortly.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not submit enquiry.', detail: err.message });
  }
});

// Admin only: view all enquiries
router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  const enquiries = await Enquiry.find().sort('-createdAt');
  res.json({ enquiries });
});

// Admin only: mark resolved
router.patch('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, { resolved: !!req.body.resolved }, { new: true });
  if (!enquiry) return res.status(404).json({ error: 'Enquiry not found.' });
  res.json({ enquiry });
});

module.exports = router;

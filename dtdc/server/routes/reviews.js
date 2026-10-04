const express = require('express');
const Review = require('../models/Review');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public: anyone can submit a review; it goes live only after admin approval
router.post('/', async (req, res) => {
  try {
    const { name, rating, comment, trackingId } = req.body;
    if (!name || !rating || !comment) {
      return res.status(400).json({ error: 'Name, rating and comment are required.' });
    }
    const review = await Review.create({ name, rating, comment, trackingId });
    res.status(201).json({ review, message: 'Thanks! Your review will appear once approved.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not submit review.', detail: err.message });
  }
});

// Public: approved reviews only
router.get('/', async (req, res) => {
  const reviews = await Review.find({ approved: true }).sort('-createdAt').limit(30);
  res.json({ reviews });
});

// Admin only: see everything, including pending reviews
router.get('/all', requireAuth, requireRole('admin'), async (req, res) => {
  const reviews = await Review.find().sort('-createdAt');
  res.json({ reviews });
});

// Admin only: approve or reject a review
router.patch('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const review = await Review.findByIdAndUpdate(req.params.id, { approved: !!req.body.approved }, { new: true });
  if (!review) return res.status(404).json({ error: 'Review not found.' });
  res.json({ review });
});

// Admin only: delete a review
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  await Review.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;

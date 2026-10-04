const express = require('express');
const Parcel = require('../models/Parcel');
const RateConfig = require('../models/RateConfig');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');
const { generateTrackingId, resolveZone, calculateCost } = require('../utils/helpers');
const { sendStatusEmail } = require('../utils/email');
const { sendStatusSms } = require('../utils/sms');
const { isValidPhone, isValidPincode } = require('../utils/validators');
const { generateReceiptPdf, generateLabelPdf } = require('../utils/pdf');

const router = express.Router();

async function getConfig() {
  let config = await RateConfig.findOne({ key: 'default' });
  if (!config) config = await RateConfig.create({ key: 'default' });
  return config;
}

// Public: download a PDF receipt by tracking ID. Same exposure level as the
// tracking endpoint above - anyone who already has the tracking ID can see
// this information, this just gives them a printable/shareable copy of it.
router.get('/:trackingId/receipt', async (req, res) => {
  try {
    const parcel = await Parcel.findOne({ trackingId: req.params.trackingId.toUpperCase() })
      .populate('branch', 'name city');
    if (!parcel) return res.status(404).json({ error: 'No parcel found with that tracking ID.' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${parcel.trackingId}-receipt.pdf"`);
    generateReceiptPdf(parcel, res);
  } catch (err) {
    res.status(500).json({ error: 'Could not generate receipt.', detail: err.message });
  }
});

// Staff/Admin book on behalf of a branch; customers can also book their own
// pickup (they pick which branch they're dropping off at / being picked up
// from themselves). Either way the record starts as "Booked" - it only
// becomes "Picked Up" once staff physically receive the parcel.
router.post('/', requireAuth, requireRole('customer', 'staff', 'admin'), async (req, res) => {
  try {
    const { sender, receiver, weightKg, serviceType, branch, customer, customerEmail } = req.body;
    if (!sender || !receiver || !weightKg) {
      return res.status(400).json({ error: 'Sender, receiver and weight are required.' });
    }
    if (!isValidPhone(sender.phone) || !isValidPhone(receiver.phone)) {
      return res.status(400).json({ error: 'Enter valid 10-digit mobile numbers for sender and receiver.' });
    }
    if (!isValidPincode(sender.pincode) || !isValidPincode(receiver.pincode)) {
      return res.status(400).json({ error: 'Pincode should be 6 digits.' });
    }

    let branchId;
    let customerId = null;
    let bookingNote = 'Parcel booked at branch';

    if (req.user.role === 'customer') {
      // Customers choose their own drop-off/pickup branch and can only ever
      // book under their own account - never on behalf of someone else.
      branchId = branch;
      if (!branchId) return res.status(400).json({ error: 'Choose a branch to book with.' });
      customerId = req.user.id;
      bookingNote = 'Booked online by customer';
    } else {
      branchId = req.user.role === 'staff' ? req.user.branch : branch;
      if (!branchId) return res.status(400).json({ error: 'A branch must be specified.' });

      // Link the booking to a customer account by email, if one was given and matches.
      customerId = customer || null;
      if (!customerId && customerEmail) {
        const match = await User.findOne({ email: customerEmail.toLowerCase(), role: 'customer' });
        if (match) customerId = match._id;
      }
    }

    const service = serviceType === 'express' ? 'express' : 'standard';
    const zone = resolveZone(sender.city, sender.state, receiver.city, receiver.state);
    const config = await getConfig();
    const cost = calculateCost(config, { weightKg: Number(weightKg), serviceType: service, zone });

    const parcel = await Parcel.create({
      trackingId: generateTrackingId(),
      sender,
      receiver,
      weightKg,
      serviceType: service,
      zone,
      cost,
      branch: branchId,
      customer: customerId,
      status: 'Booked',
      history: [{ status: 'Booked', location: sender.city, note: bookingNote }]
    });

    res.status(201).json({ parcel });
  } catch (err) {
    res.status(500).json({ error: 'Could not book parcel.', detail: err.message });
  }
});

// Staff/Admin: list parcels (staff sees only their branch, admin sees all)
router.get('/', requireAuth, requireRole('staff', 'admin'), async (req, res) => {
  const filter = req.user.role === 'staff' ? { branch: req.user.branch } : {};
  if (req.query.status) filter.status = req.query.status;
  const parcels = await Parcel.find(filter).populate('branch', 'name city').sort('-createdAt').limit(200);
  res.json({ parcels });
});

// Logged-in customer: my own order history
router.get('/mine', requireAuth, requireRole('customer'), async (req, res) => {
  const parcels = await Parcel.find({ customer: req.user.id }).populate('branch', 'name city').sort('-createdAt');
  res.json({ parcels });
});

// Staff/Admin: update parcel status - triggers email/SMS notification
router.patch('/:id/status', requireAuth, requireRole('staff', 'admin'), async (req, res) => {
  try {
    const { status, location, note } = req.body;
    if (!Parcel.STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

    const filter = { _id: req.params.id };
    if (req.user.role === 'staff') filter.branch = req.user.branch;

    const parcel = await Parcel.findOne(filter);
    if (!parcel) return res.status(404).json({ error: 'Parcel not found, or not in your branch.' });

    parcel.status = status;
    parcel.history.push({ status, location: location || '', note: note || '' });
    await parcel.save();

    // Notifications are best-effort and never block the response.
    sendStatusEmail({
      to: parcel.receiver.email,
      name: parcel.receiver.name,
      trackingId: parcel.trackingId,
      status,
      location
    }).catch(() => {});
    sendStatusSms({ to: parcel.receiver.phone, trackingId: parcel.trackingId, status }).catch(() => {});

    res.json({ parcel });
  } catch (err) {
    res.status(500).json({ error: 'Could not update status.', detail: err.message });
  }
});

// Staff/Admin: printable shipping label / waybill for a parcel
router.get('/:id/label', requireAuth, requireRole('staff', 'admin'), async (req, res) => {
  try {
    const filter = { _id: req.params.id };
    if (req.user.role === 'staff') filter.branch = req.user.branch;

    const parcel = await Parcel.findOne(filter).populate('branch', 'name city');
    if (!parcel) return res.status(404).json({ error: 'Parcel not found, or not in your branch.' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${parcel.trackingId}-label.pdf"`);
    generateLabelPdf(parcel, res);
  } catch (err) {
    res.status(500).json({ error: 'Could not generate label.', detail: err.message });
  }
});

// Admin only: summary numbers + trends for the analytics dashboard
router.get('/stats/summary', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const [totals] = await Parcel.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, totalParcels: { $sum: 1 }, totalRevenue: { $sum: '$cost' } } }
    ]);

    const statusBreakdownRaw = await Parcel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const statusBreakdown = statusBreakdownRaw.map((s) => ({ status: s._id, count: s.count }));

    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);
    const dailyRaw = await Parcel.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          bookings: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 0, '$cost'] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    const daily = dailyRaw.map((d) => ({ date: d._id, bookings: d.bookings, revenue: d.revenue }));

    const byBranchRaw = await Parcel.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: '$branch', count: { $sum: 1 }, revenue: { $sum: '$cost' } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    await Parcel.populate(byBranchRaw, { path: '_id', select: 'name city' });
    const byBranch = byBranchRaw.map((b) => ({
      branch: b._id ? b._id.name : 'Unassigned',
      city: b._id ? b._id.city : '',
      count: b.count,
      revenue: b.revenue
    }));

    res.json({
      totalParcels: totals ? totals.totalParcels : 0,
      totalRevenue: totals ? totals.totalRevenue : 0,
      statusBreakdown,
      daily,
      byBranch
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not load stats.', detail: err.message });
  }
});

module.exports = router;

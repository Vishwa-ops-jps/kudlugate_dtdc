const express = require('express');
const RateConfig = require('../models/RateConfig');
const { requireAuth, requireRole } = require('../middleware/auth');
const { resolveZone, calculateCost } = require('../utils/helpers');

const router = express.Router();

async function getConfig() {
  let config = await RateConfig.findOne({ key: 'default' });
  if (!config) config = await RateConfig.create({ key: 'default' });
  return config;
}

// Public: estimate cost without booking anything
router.post('/estimate', async (req, res) => {
  try {
    const { weightKg, serviceType, senderCity, senderState, receiverCity, receiverState } = req.body;
    const weight = Number(weightKg);
    if (!weight || weight <= 0) return res.status(400).json({ error: 'Enter a valid weight in kg.' });
    if (!senderCity || !senderState || !receiverCity || !receiverState) {
      return res.status(400).json({ error: 'Origin and destination city/state are required.' });
    }
    const service = serviceType === 'express' ? 'express' : 'standard';
    const zone = resolveZone(senderCity, senderState, receiverCity, receiverState);
    const config = await getConfig();
    const cost = calculateCost(config, { weightKg: weight, serviceType: service, zone });

    res.json({ cost, zone, serviceType: service, weightKg: weight });
  } catch (err) {
    res.status(500).json({ error: 'Could not calculate cost.', detail: err.message });
  }
});

// Admin only: view current rate card
router.get('/rates', requireAuth, requireRole('admin'), async (req, res) => {
  const config = await getConfig();
  res.json({ config });
});

// Admin only: update rate card
router.put('/rates', requireAuth, requireRole('admin'), async (req, res) => {
  const config = await getConfig();
  const { baseRate, perKgRate, zoneMultiplier, minCharge } = req.body;
  if (baseRate !== undefined) config.baseRate = baseRate;
  if (minCharge !== undefined) config.minCharge = minCharge;
  if (perKgRate) Object.assign(config.perKgRate, perKgRate);
  if (zoneMultiplier) Object.assign(config.zoneMultiplier, zoneMultiplier);
  await config.save();
  res.json({ config });
});

module.exports = router;

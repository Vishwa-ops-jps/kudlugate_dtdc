function generateTrackingId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DTDCKG${stamp}${rand}`;
}

function resolveZone(senderCity, senderState, receiverCity, receiverState) {
  const norm = (s) => (s || '').trim().toLowerCase();
  if (norm(senderCity) === norm(receiverCity)) return 'local';
  if (norm(senderState) === norm(receiverState)) return 'state';
  return 'national';
}

function calculateCost(rateConfig, { weightKg, serviceType, zone }) {
  const perKg = rateConfig.perKgRate[serviceType] ?? rateConfig.perKgRate.standard;
  const multiplier = rateConfig.zoneMultiplier[zone] ?? 1;
  const raw = (rateConfig.baseRate + weightKg * perKg) * multiplier;
  const cost = Math.max(raw, rateConfig.minCharge);
  return Math.round(cost);
}

module.exports = { generateTrackingId, resolveZone, calculateCost };

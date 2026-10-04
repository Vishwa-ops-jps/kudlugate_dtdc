const mongoose = require('mongoose');

// Singleton document (there is only ever one). Admin can edit the numbers
// from the admin dashboard without touching code.
const rateConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    baseRate: { type: Number, default: 30 }, // flat handling fee, in Rs
    perKgRate: {
      standard: { type: Number, default: 25 },
      express: { type: Number, default: 45 }
    },
    zoneMultiplier: {
      local: { type: Number, default: 1 }, // same city
      state: { type: Number, default: 1.5 }, // same state, different city
      national: { type: Number, default: 2.2 } // different state
    },
    minCharge: { type: Number, default: 60 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('RateConfig', rateConfigSchema);

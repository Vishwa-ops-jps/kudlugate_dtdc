const mongoose = require('mongoose');

const historySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    location: { type: String, default: '' },
    note: { type: String, default: '' },
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const partySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, trim: true }
  },
  { _id: false }
);

const STATUSES = ['Booked', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled'];

const parcelSchema = new mongoose.Schema(
  {
    trackingId: { type: String, required: true, unique: true, uppercase: true },
    sender: { type: partySchema, required: true },
    receiver: { type: partySchema, required: true },
    weightKg: { type: Number, required: true, min: 0.1 },
    serviceType: { type: String, enum: ['standard', 'express'], default: 'standard' },
    zone: { type: String, enum: ['local', 'state', 'national'], required: true },
    cost: { type: Number, required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: STATUSES, default: 'Booked' },
    history: { type: [historySchema], default: [] }
  },
  { timestamps: true }
);

parcelSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('Parcel', parcelSchema);

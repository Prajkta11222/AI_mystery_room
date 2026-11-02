import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  _id: { type: String, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
}, { versionKey: false });

export default mongoose.model('LegacySessionLease', schema);

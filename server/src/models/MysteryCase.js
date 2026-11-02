import mongoose from 'mongoose';
const suspectSchema = new mongoose.Schema({ id: String, name: String, role: String, profile: String, relationship: String, alibi: String }, { _id: false });
const timelineSchema = new mongoose.Schema({ time: String, event: String }, { _id: false });
const evidenceSchema = new mongoose.Schema({ id: String, type: String, title: String, description: String, content: String, timestamp: String, source: String, suspectIds: [String] }, { _id: false });
const schema = new mongoose.Schema({
  ownerSessionId: { type: String, required: true, index: true },
  idempotencyKey: { type: String, default: undefined, maxlength: 80 },
  requestHash: { type: String, default: undefined, maxlength: 64, select: false },
  title: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy','Medium','Hard'], required: true },
  length: { type: String, enum: ['Short','Medium','Long'], required: true },
  language: { type: String, enum: ['en','hi','hinglish'], default: 'en', required: true },
  category: { type: String, enum: ['general','locked_room','art_theft','disappearance','historical','espionage'], default: 'general', required: true },
  premise: { type: String, required: true },
  brief: { type: String, required: true },
  incident: { type: String, required: true },
  location: { type: String, required: true },
  dateTime: { type: String, required: true },
  objective: { type: String, required: true },
  suspects: { type: [suspectSchema], default: [] },
  timeline: { type: [timelineSchema], default: [] },
  evidence: { type: [evidenceSchema], default: [] },
  notes: { type: String, default: '' },
  reviewedEvidence: { type: [String], default: [] },
  requestedHintLevels: { type: [Number], default: [] },
  submittedSuspectId: { type: String, default: null },
  accusationCorrect: { type: Boolean, default: null },
  reveal: { type: mongoose.Schema.Types.Mixed, default: null },
  status: { type: String, enum: ['investigating', 'completed'], default: 'investigating', index: true },
  completedAt: { type: Date, default: null },
  expiresAt: { type: Date, index: { expires: 0 } },
}, { timestamps: true, minimize: false });
schema.index({ ownerSessionId: 1, idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } });
export default mongoose.model('MysteryCase', schema);

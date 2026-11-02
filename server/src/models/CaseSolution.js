import mongoose from 'mongoose';
const schema = new mongoose.Schema({ caseId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true, index: true }, culpritId: { type: String, required: true }, culpritName: String, motive: String, method: String, solutionSummary: String, fullExplanation: String, evidenceReasoning: [{ evidenceId: String, explanation: String, implication: String }], privateSolution: String, expiresAt: { type: Date, index: { expires: 0 } } }, { timestamps: true });
export default mongoose.model('CaseSolution', schema);

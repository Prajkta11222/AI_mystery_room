import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import mongoose from 'mongoose';
import { createHash } from 'node:crypto';
import MysteryCase from '../models/MysteryCase.js';
import CaseSolution from '../models/CaseSolution.js';
import { accusationInput, hintInput, progressInput, scenarioInput } from '../validators/caseSchemas.js';
import { generateCase, translateReveal } from '../services/geminiService.js';
import { env } from '../config/env.js';
import { randomPremise } from '../services/randomPremises.js';

const router = Router();
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const rateLimitMessage = (message) => ({ error: { code: 'RATE_LIMITED', message } });

const generationLimiter = rateLimit({
  windowMs: env.generationWindow * 60 * 1_000,
  limit: env.generationLimit,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage('Too many case requests. Please try again later.'),
});
const progressLimiter = rateLimit({
  windowMs: env.progressWindow * 60 * 1_000,
  limit: env.progressLimit,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage('Too many progress updates. Please wait before trying again.'),
});
const accusationLimiter = rateLimit({
  windowMs: env.accusationWindow * 60 * 1_000,
  limit: env.accusationLimit,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage('Too many accusation requests. Please wait before trying again.'),
});
const hintLimiter = rateLimit({
  windowMs: env.hintWindow * 60 * 1_000,
  limit: env.hintLimit,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage('Too many hint requests. Please try again later.'),
});
let activeGenerations = 0;
function generationConcurrencyLimit(req, res, next) {
  if (activeGenerations >= env.maxConcurrentGenerations) {
    res.setHeader('Retry-After', '3');
    return res.status(429).json({ error: { code: 'GENERATION_BUSY', message: 'Case generation is busy. Please try again shortly.', requestId: req.id } });
  }
  activeGenerations += 1;
  let released = false;
  const release = () => { if (!released) { released = true; activeGenerations -= 1; } };
  res.once('finish', release);
  res.once('close', release);
  return next();
}

const realTarget = /(\b(make|write|create|accuse|investigate|frame)\b.{0,50}\b(real|my|this)\b.{0,40}\b(person|boss|teacher|neighbor|coworker|politician|celebrity)\b|\b(real|my)\s+(boss|teacher|neighbor|coworker|ex|spouse)\b)/i;
const invalidCaseId = { error: { code: 'VALIDATION_ERROR', message: 'That case ID is invalid.' } };

router.param('id', (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: { ...invalidCaseId.error, requestId: req.id } });
  next();
});

function revealFor(doc, solution) {
  return {
    isCorrect: doc.submittedSuspectId === solution.culpritId,
    selectedSuspectId: doc.submittedSuspectId,
    culprit: { id: solution.culpritId, name: solution.culpritName },
    motive: solution.motive,
    method: solution.method,
    solutionSummary: solution.solutionSummary,
    fullExplanation: solution.fullExplanation,
    evidenceReasoning: solution.evidenceReasoning,
  };
}

async function revealForCompletedCase(doc) {
  if (!doc.submittedSuspectId) return null;
  const solution = await CaseSolution.findOne({ caseId: doc._id }).lean();
  if (!solution) throw new Error('Case solution missing');
  return revealFor(doc, solution);
}
async function localizedAuthorizedReveal(reveal, sourceLanguage, displayLanguage, requestId) {
 if (!reveal || !displayLanguage || displayLanguage === sourceLanguage) return reveal;
 try { return { ...await translateReveal(reveal, displayLanguage, sourceLanguage, requestId), revealLanguage: displayLanguage }; }
 catch { return { ...reveal, revealLanguage: sourceLanguage, translationFallback: true }; }
}
async function localizedReveal(doc, displayLanguage, requestId) {
 const reveal = await revealForCompletedCase(doc);
 return localizedAuthorizedReveal(reveal, doc.language || 'en', displayLanguage, requestId);
}

function publicCase(doc, authorizedReveal = null) {
  return {
    id: String(doc._id),
    title: doc.title,
    difficulty: doc.difficulty,
    length: doc.length,
    language: doc.language || 'en',
    category: doc.category || 'general',
    status: doc.status || (doc.submittedSuspectId ? 'completed' : 'investigating'),
    createdAt: doc.createdAt,
    completedAt: doc.completedAt || null,
    requestedHintLevels: doc.requestedHintLevels || [],
    brief: doc.brief,
    incident: doc.incident,
    location: doc.location,
    dateTime: doc.dateTime,
    objective: doc.objective,
    suspects: doc.suspects.map((suspect) => ({
      id: suspect.id,
      name: suspect.name,
      role: suspect.role,
      profile: suspect.profile,
      relationship: suspect.relationship,
      alibi: suspect.alibi,
    })),
    timeline: doc.timeline.map((event) => ({ time: event.time, event: event.event })),
    evidence: doc.evidence.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      content: item.content,
      timestamp: item.timestamp,
      source: item.source,
      suspectIds: item.suspectIds,
    })),
    notes: doc.notes,
    reviewedEvidence: doc.reviewedEvidence,
    requestedHintLevels: doc.requestedHintLevels || [],
    submitted: Boolean(doc.submittedSuspectId),
    reveal: doc.submittedSuspectId ? authorizedReveal || doc.reveal || null : null,
  };
}

function investigationSummary(doc) {
  return {
    id: String(doc._id), title: doc.title, brief: doc.brief,
    difficulty: doc.difficulty, length: doc.length, language: doc.language || 'en',
    category: doc.category || 'general', status: doc.status || (doc.submittedSuspectId ? 'completed' : 'investigating'),
    createdAt: doc.createdAt, updatedAt: doc.updatedAt, completedAt: doc.completedAt || null,
  };
}

function makeHint(doc, solution, level, displayLanguage) {
  const supported = solution.evidenceReasoning.filter((item) => item.implication === 'supports_culprit');
  const first = doc.evidence.find((item) => item.id === supported[0]?.evidenceId);
  const second = doc.evidence.find((item) => item.id === supported.find((item) => item.evidenceId !== first?.id)?.evidenceId);
  if (!first || !second) throw new Error('Validated hint evidence is missing');
  const hints = {
    en: [
      `Revisit “${first.title}”. Compare its time with the events in the case timeline.`,
      `Compare “${first.title}” with “${second.title}”. Look for a detail that connects both pieces of evidence.`,
      `Use the timing in “${first.title}” to check which suspect statements fit the timeline. The answer is not stated here; the case evidence should support your conclusion.`,
    ],
    hi: [
      `“${first.title}” को फिर से देखें। इसका समय केस की समयरेखा से मिलाएँ।`,
      `“${first.title}” और “${second.title}” की तुलना करें। दोनों सबूतों में जुड़ी हुई बात खोजें।`,
      `“${first.title}” के समय से संदिग्धों के बयानों को समयरेखा के साथ जाँचें। संकेत यहाँ जवाब नहीं बताता; निष्कर्ष केस के सबूतों से निकालें।`,
    ],
    hinglish: [
      `“${first.title}” ko dobara dekhein. Iska time case timeline se compare karein.`,
      `“${first.title}” aur “${second.title}” ko compare karein. Dono evidence mein judi hui detail dekhein.`,
      `“${first.title}” ke time se suspects ke statements ko timeline ke saath check karein. Hint answer nahi batata; conclusion case evidence se nikalein.`,
    ],
  };
  return { level, evidenceIds: level === 1 ? [first.id] : [first.id, second.id], text: (hints[displayLanguage || doc.language] || hints.en)[level - 1] };
}

function notFoundResponse(res, req) {
  return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'That case could not be found.', requestId: req.id } });
}

router.post('/', generationLimiter, generationConcurrencyLimit, asyncRoute(async (req, res) => {
  const parsed = scenarioInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: `Please provide a fictional premise between 30 and ${env.maxScenarioLength} characters, or choose a random case, along with valid options.`, requestId: req.id } });
  }
  const idempotencyKey = req.get('Idempotency-Key') || undefined;
  if (idempotencyKey && !/^[a-z0-9-]{16,80}$/i.test(idempotencyKey)) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'The request key is invalid.', requestId: req.id } });
  }
  const requestHash = idempotencyKey ? createHash('sha256').update(JSON.stringify(parsed.data)).digest('hex') : undefined;
  if (idempotencyKey) {
    const prior = await MysteryCase.findOne({ ownerSessionId: req.sessionId, idempotencyKey }).select('+requestHash').lean();
    if (prior) {
      if (prior.requestHash !== requestHash) return res.status(409).json({ error: { code: 'IDEMPOTENCY_KEY_REUSED', message: 'This request key was already used for a different case.', requestId: req.id } });
      return res.status(200).json({ case: publicCase(prior) });
    }
  }
  const scenario = parsed.data.random ? randomPremise(parsed.data.category) : parsed.data.scenario;
  if (realTarget.test(scenario)) {
    return res.status(400).json({ error: { code: 'FICTIONAL_SCENARIO_REQUIRED', message: 'Please fictionalize the premise and avoid allegations about a real, identifiable person.', requestId: req.id } });
  }

  const generationInput = { ...parsed.data, scenario };
  const data = await generateCase(generationInput, req.id);
  const { solution, ...playerFields } = data;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1_000);
  const caseId = new mongoose.Types.ObjectId();
  let privateRecord;
  let doc;
  try {
    privateRecord = await CaseSolution.create({
      caseId,
      culpritId: solution.culpritId,
      culpritName: playerFields.suspects.find((suspect) => suspect.id === solution.culpritId).name,
      motive: solution.motive,
      method: solution.method,
      solutionSummary: solution.solutionSummary,
      fullExplanation: solution.fullExplanation,
      evidenceReasoning: solution.evidenceReasoning,
      privateSolution: solution.privateSolution,
      expiresAt,
    });
    doc = await MysteryCase.create({
      _id: caseId,
      ownerSessionId: req.sessionId,
      idempotencyKey,
      requestHash,
      title: playerFields.title,
      difficulty: parsed.data.difficulty,
      length: parsed.data.length,
      language: parsed.data.language,
      category: parsed.data.category,
      premise: scenario,
      expiresAt,
      ...playerFields,
    });
  } catch (error) {
    try {
      if (doc) await MysteryCase.deleteOne({ _id: doc._id, ownerSessionId: req.sessionId });
      if (privateRecord) await CaseSolution.deleteOne({ _id: privateRecord._id });
    } catch {
      error.cleanupFailed = true;
    }
    if (idempotencyKey && error?.code === 11000) {
      const prior = await MysteryCase.findOne({ ownerSessionId: req.sessionId, idempotencyKey }).select('+requestHash').lean();
      if (prior?.requestHash === requestHash) return res.status(200).json({ case: publicCase(prior) });
    }
    throw error;
  }

  return res.status(201).json({ case: publicCase(doc) });
}));

router.get('/', asyncRoute(async (req, res) => {
  const cases = await MysteryCase.find({ ownerSessionId: req.sessionId }).sort({ updatedAt: -1 }).limit(100).lean();
  return res.json({ investigations: cases.map(investigationSummary) });
}));

router.get('/:id', asyncRoute(async (req, res) => {
  const displayLanguage = req.query.language;
  if (displayLanguage !== undefined && !['en', 'hi', 'hinglish'].includes(displayLanguage)) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Choose a supported display language.', requestId: req.id } });
  const doc = await MysteryCase.findOne({ _id: req.params.id, ownerSessionId: req.sessionId }).lean();
  if (!doc) return notFoundResponse(res, req);
  return res.json({ case: publicCase(doc, await localizedReveal(doc, displayLanguage, req.id)) });
}));

router.post('/:id/hints', hintLimiter, asyncRoute(async (req, res) => {
  const parsed = hintInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Choose a valid hint level.', requestId: req.id } });
  const { level, language } = parsed.data;
  let doc = await MysteryCase.findOne({ _id: req.params.id, ownerSessionId: req.sessionId });
  if (!doc) return notFoundResponse(res, req);
  const requested = doc.requestedHintLevels || [];
  if ((doc.submittedSuspectId || doc.status === 'completed') && !requested.includes(level)) return res.status(409).json({ error: { code: 'CASE_COMPLETED', message: 'Hints are unavailable after the investigation is complete.', requestId: req.id } });
  if (!requested.includes(level) && level !== Math.max(0, ...requested) + 1) return res.status(409).json({ error: { code: 'HINT_OUT_OF_ORDER', message: 'Request the next hint in order.', requestId: req.id } });
  const solution = await CaseSolution.findOne({ caseId: doc._id }).lean();
  if (!solution) throw new Error('Case solution missing');
  if (!requested.includes(level)) {
    doc = await MysteryCase.findOneAndUpdate(
      { _id: req.params.id, ownerSessionId: req.sessionId, submittedSuspectId: null, requestedHintLevels: { $size: requested.length } },
      { $addToSet: { requestedHintLevels: level } }, { new: true },
    );
    if (!doc) {
      const latest = await MysteryCase.findOne({ _id: req.params.id, ownerSessionId: req.sessionId });
      if (!latest?.requestedHintLevels?.includes(level)) return res.status(409).json({ error: { code: 'HINT_OUT_OF_ORDER', message: 'Request the next hint in order.', requestId: req.id } });
      doc = latest;
    }
  }
  return res.json({ hint: makeHint(doc, solution, level, language), requestedHintLevels: doc.requestedHintLevels });
}));

router.patch('/:id/progress', progressLimiter, asyncRoute(async (req, res) => {
  const parsed = progressInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Please check your notes and reviewed evidence.', requestId: req.id } });
  }

  const doc = await MysteryCase.findOne({ _id: req.params.id, ownerSessionId: req.sessionId });
  if (!doc) return notFoundResponse(res, req);
  if (doc.submittedSuspectId) {
    return res.status(409).json({ error: { code: 'CASE_SUBMITTED', message: 'Progress is locked after the final accusation.', requestId: req.id } });
  }
  if (parsed.data.reviewedEvidence?.some((id) => !doc.evidence.some((item) => item.id === id))) {
    return res.status(400).json({ error: { code: 'INVALID_EVIDENCE', message: 'That evidence item is not part of this case.', requestId: req.id } });
  }

  if (parsed.data.notes !== undefined) doc.notes = parsed.data.notes;
  if (parsed.data.reviewedEvidence !== undefined) doc.reviewedEvidence = parsed.data.reviewedEvidence;
  await doc.save();
  return res.json({ progress: { notes: doc.notes, reviewedEvidence: doc.reviewedEvidence } });
}));

router.post('/:id/accusation', accusationLimiter, asyncRoute(async (req, res) => {
  const parsed = accusationInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Select one suspect before submitting.', requestId: req.id } });
  }

  const doc = await MysteryCase.findOne({ _id: req.params.id, ownerSessionId: req.sessionId });
  if (!doc) return notFoundResponse(res, req);
  if (doc.submittedSuspectId) {
    const existingSolution = await CaseSolution.findOne({ caseId: doc._id }).lean();
    if (!existingSolution) throw new Error('Case solution missing');
    return res.json({ result: await localizedAuthorizedReveal(revealFor(doc, existingSolution), doc.language || 'en', parsed.data.language, req.id) });
  }
  if (!doc.suspects.some((suspect) => suspect.id === parsed.data.suspectId)) {
    return res.status(400).json({ error: { code: 'INVALID_SUSPECT', message: 'Select a suspect from this case.', requestId: req.id } });
  }

  const solution = await CaseSolution.findOne({ caseId: doc._id }).lean();
  if (!solution) throw new Error('Case solution missing');
  const updated = await MysteryCase.findOneAndUpdate(
    { _id: doc._id, ownerSessionId: req.sessionId, submittedSuspectId: null },
    { $set: { submittedSuspectId: parsed.data.suspectId, accusationCorrect: parsed.data.suspectId === solution.culpritId, status: 'completed', completedAt: new Date() } },
    { new: true },
  );
  if (updated) return res.json({ result: await localizedAuthorizedReveal(revealFor(updated, solution), updated.language || 'en', parsed.data.language, req.id) });

  const latest = await MysteryCase.findOne({ _id: doc._id, ownerSessionId: req.sessionId }).lean();
  if (latest?.submittedSuspectId) {
    const latestSolution = await CaseSolution.findOne({ caseId: doc._id }).lean();
    if (!latestSolution) throw new Error('Case solution missing');
    return res.json({ result: await localizedAuthorizedReveal(revealFor(latest, latestSolution), latest.language || 'en', parsed.data.language, req.id) });
  }
  return res.status(409).json({ error: { code: 'ACCUSATION_CONFLICT', message: 'The accusation could not be recorded. Please retry.', requestId: req.id } });
}));

router.delete('/:id', asyncRoute(async (req, res) => {
  const doc = await MysteryCase.findOneAndDelete({ _id: req.params.id, ownerSessionId: req.sessionId });
  if (!doc) return notFoundResponse(res, req);
  await CaseSolution.deleteOne({ caseId: doc._id });
  return res.status(204).end();
}));

export default router;

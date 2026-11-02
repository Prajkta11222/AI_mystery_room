import { z } from 'zod';
import { env } from '../config/env.js';

const id = z.string().min(1).max(100);
const shortText = z.string().min(1).max(500);
const caseText = z.string().min(1).max(4_000);

const suspect = z.object({
  id,
  name: z.string().min(1).max(120),
  role: shortText,
  profile: caseText,
  relationship: caseText,
  alibi: caseText,
});

const timelineEvent = z.object({
  time: z.string().min(1).max(64),
  event: caseText,
});

const evidence = z.object({
  id,
  type: z.enum(['message', 'statement', 'document', 'image', 'cctv']),
  title: z.string().min(1).max(200),
  description: caseText,
  content: caseText,
  timestamp: z.string().min(1).max(64),
  source: z.string().min(1).max(200),
  suspectIds: z.array(id).max(5),
});

const evidenceReasoning = z.object({
  evidenceId: id,
  explanation: caseText,
  implication: z.enum(['supports_culprit', 'weakens_suspect', 'red_herring']),
});

export const scenarioInput = z.object({
  scenario: z.string().trim().max(env.maxScenarioLength).optional(),
  random: z.boolean().default(false),
  category: z.enum(['general', 'locked_room', 'art_theft', 'disappearance', 'historical', 'espionage']).default('general'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  length: z.enum(['Short', 'Medium', 'Long']).default('Short'),
  language: z.enum(['en', 'hi', 'hinglish']).default('en'),
}).strict().superRefine((value, context) => {
  if (value.random && value.scenario !== undefined) context.addIssue({ code: 'custom', path: ['scenario'], message: 'Random cases cannot include a custom premise.' });
  if (!value.random && (!value.scenario || value.scenario.trim().length < 30)) context.addIssue({ code: 'custom', path: ['scenario'], message: 'A custom premise must contain at least 30 characters.' });
});

export const accusationInput = z.object({ suspectId: id, language: z.enum(['en','hi','hinglish']).default('en') }).strict();
export const hintInput = z.object({ level: z.number().int().min(1).max(3), language: z.enum(['en','hi','hinglish']).default('en') }).strict();

export const progressInput = z.object({
  notes: z.string().max(5_000).optional(),
  reviewedEvidence: z.array(id).max(30).optional(),
}).strict().refine((value) => value.notes !== undefined || value.reviewedEvidence !== undefined);

export const generatedCase = z.object({
  title: z.string().min(1).max(200),
  brief: caseText,
  incident: caseText,
  location: z.string().min(1).max(300),
  dateTime: z.string().min(1).max(64),
  objective: caseText,
  suspects: z.array(suspect).min(3).max(5),
  timeline: z.array(timelineEvent).min(3).max(30),
  evidence: z.array(evidence).min(3).max(10),
  solution: z.object({
    culpritId: id,
    motive: caseText,
    method: caseText,
    solutionSummary: caseText,
    fullExplanation: caseText,
    privateSolution: caseText,
    evidenceReasoning: z.array(evidenceReasoning).min(2).max(10),
  }),
});

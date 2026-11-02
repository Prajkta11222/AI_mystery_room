import dotenv from 'dotenv';
import { isIP } from 'node:net';
import { fileURLToPath } from 'node:url';
dotenv.config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });
const production = process.env.NODE_ENV === 'production';
const required = ['MONGODB_URI', 'SESSION_SECRET', 'GEMINI_API_KEY', 'GEMINI_MODEL', 'CLIENT_ORIGIN'];
if (production) for (const key of required) if (!process.env[key]) throw new Error(`${key} is required in production`);
if (production && ((process.env.SESSION_SECRET || '').length < 32 || /replace|your_|example|changeme|change-this/i.test(process.env.SESSION_SECRET || ''))) throw new Error('SESSION_SECRET must be a non-placeholder value of at least 32 characters');
if (production && ['GEMINI_API_KEY', 'GEMINI_MODEL'].some((key) => /replace|your_|example|changeme|change-this/i.test(process.env[key] || ''))) throw new Error('GEMINI_API_KEY and GEMINI_MODEL must be configured with non-placeholder values');
if (production) {
  let origin;
  try {
    origin = new URL(process.env.CLIENT_ORIGIN || '');
  } catch {
    throw new Error('CLIENT_ORIGIN must be a specific HTTPS origin in production');
  }
  if (origin.protocol !== 'https:' || origin.origin !== process.env.CLIENT_ORIGIN) {
    throw new Error('CLIENT_ORIGIN must be a specific HTTPS origin without a path in production');
  }
}
function positiveInteger(name, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) throw new Error(`${name} must be an integer between 1 and ${maximum}`);
  return value;
}

const maxScenarioLength = positiveInteger('MAX_SCENARIO_LENGTH', 1_000, 1_000);
if (maxScenarioLength < 30) throw new Error('MAX_SCENARIO_LENGTH must be at least 30');
const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
if (!Number.isSafeInteger(trustProxyHops) || trustProxyHops < 0 || trustProxyHops > 5) throw new Error('TRUST_PROXY_HOPS must be an integer between 0 and 5');
const mongoDnsServers = (process.env.MONGODB_DNS_SERVERS || '').split(',').map((server) => server.trim()).filter(Boolean);
if (mongoDnsServers.length > 3 || mongoDnsServers.some((server) => !isIP(server))) throw new Error('MONGODB_DNS_SERVERS must contain up to three comma-separated IP addresses');
const geminiModel = process.env.GEMINI_MODEL || '';
const geminiThinkingLevel = process.env.GEMINI_THINKING_LEVEL || 'low';
if (!['minimal', 'low', 'medium', 'high'].includes(geminiThinkingLevel)) throw new Error('GEMINI_THINKING_LEVEL must be minimal, low, medium, or high');

export const env = {
  production,
  port: positiveInteger('PORT', 5000, 65_535),
  trustProxyHops,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_mystery_room',
  mongoDnsServers,
  sessionSecret: process.env.SESSION_SECRET || 'local-development-secret-change-this-before-deployment',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel,
  geminiThinkingLevel,
  geminiTimeoutMs: positiveInteger('GEMINI_TIMEOUT_MS', 90_000, 180_000),
  geminiMaxRetryDelayMs: positiveInteger('GEMINI_MAX_RETRY_DELAY_MS', 30_000, 180_000),
  generationLimit: positiveInteger('CASE_GENERATION_RATE_LIMIT', 5),
  generationWindow: positiveInteger('CASE_GENERATION_RATE_WINDOW_MINUTES', 60),
  maxConcurrentGenerations: positiveInteger('MAX_CONCURRENT_GENERATIONS', 2, 20),
  progressLimit: positiveInteger('CASE_PROGRESS_RATE_LIMIT', 120),
  progressWindow: positiveInteger('CASE_PROGRESS_RATE_WINDOW_MINUTES', 15),
  accusationLimit: positiveInteger('CASE_ACCUSATION_RATE_LIMIT', 10),
  accusationWindow: positiveInteger('CASE_ACCUSATION_RATE_WINDOW_MINUTES', 15),
  hintLimit: positiveInteger('CASE_HINT_RATE_LIMIT', 12),
  hintWindow: positiveInteger('CASE_HINT_RATE_WINDOW_MINUTES', 15),
  maxScenarioLength,
};

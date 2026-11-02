import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createServer } from 'node:http';
import { createHash, createHmac } from 'node:crypto';

process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/ai_mystery_room_e2e';
process.env.SESSION_SECRET = 'e2e-test-session-secret-with-more-than-32-characters';
process.env.GEMINI_API_KEY = 'test-only-key';
process.env.GEMINI_MODEL = 'test-only-model';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.NODE_ENV = 'test';
process.env.CASE_GENERATION_RATE_LIMIT = '6';
process.env.CASE_GENERATION_RATE_WINDOW_MINUTES = '60';
process.env.CASE_ACCUSATION_RATE_LIMIT = '6';

const { default: app } = await import('../src/app.js');
const MysteryCase = (await import('../src/models/MysteryCase.js')).default;
const CaseSolution = (await import('../src/models/CaseSolution.js')).default;
const LegacySessionLease = (await import('../src/models/LegacySessionLease.js')).default;
const { setGeminiTransport, setGeminiRetryWait } = await import('../src/services/geminiService.js');
const originalFetch = globalThis.fetch;
let providerRequest;
let validProviderCalls = 0;
let translationShouldFail = false;

function fakeGeneratedCase() {
  return {
    title: 'The Missing Map', brief: 'A rare map vanishes during an evening reception.', incident: 'The map disappeared from a locked display.', location: 'Fictional Bellweather Archive', dateTime: '2026-10-20T21:00:00.000Z', objective: 'Identify who took the map.',
    suspects: [
      { id: 's1', name: 'Avery Stone', role: 'Curator', profile: 'A careful curator.', relationship: 'Managed the display.', alibi: 'Cataloguing records in the east wing.' },
      { id: 's2', name: 'Blair North', role: 'Donor', profile: 'A local collector.', relationship: 'Loaned another artifact.', alibi: 'Speaking with guests in the lobby.' },
      { id: 's3', name: 'Casey Reed', role: 'Guard', profile: 'A long-serving guard.', relationship: 'Patrolled the archive.', alibi: 'Checking the west entrance.' },
    ],
    timeline: [
      { time: '2026-10-20T20:00:00.000Z', event: 'Guests arrive at the archive.' },
      { time: '2026-10-20T20:30:00.000Z', event: 'The display is checked.' },
      { time: '2026-10-20T21:00:00.000Z', event: 'The map is reported missing.' },
    ],
    evidence: [
      { id: 'e1', type: 'message', title: 'Staff message', description: 'A fictional staff exchange.', content: 'The west door is clear.', timestamp: '2026-10-20T20:40:00.000Z', source: 'Fictional chat export', suspectIds: ['s1'] },
      { id: 'e2', type: 'statement', title: 'Guest statement', description: 'A guest recalls the evening.', content: 'I saw someone leave the gallery.', timestamp: '2026-10-20T21:10:00.000Z', source: 'Fictional witness statement', suspectIds: ['s2'] },
      { id: 'e3', type: 'image', title: 'Display photograph', description: 'A fictional image brief.', content: 'The display is visible from the hall.', timestamp: '2026-10-20T20:30:00.000Z', source: 'Fictional archive image', suspectIds: [] },
      { id: 'e4', type: 'cctv', title: 'Hall camera log', description: 'A simulated camera event.', content: 'A figure enters the gallery.', timestamp: '2026-10-20T20:50:00.000Z', source: 'Simulated CCTV evidence', suspectIds: ['s3'] },
    ],
    solution: { culpritId: 's1', motive: 'They wanted to protect the archive.', method: 'They used their access to the display.', solutionSummary: 'The clues point to the curator.', fullExplanation: 'The staff message and display record narrow the window to the curator.', privateSolution: 'Internal canonical facts.', evidenceReasoning: [ { evidenceId: 'e1', explanation: 'The message places them near the display.', implication: 'supports_culprit' }, { evidenceId: 'e3', explanation: 'The display record fixes the timing.', implication: 'supports_culprit' }, { evidenceId: 'e2', explanation: 'The statement sends suspicion toward another suspect.', implication: 'red_herring' }, { evidenceId: 'e4', explanation: 'The camera timing rules out the guard.', implication: 'weakens_suspect' } ] },
  };
}

test('case API persists progress, hides the solution, and makes accusation reveal idempotent', async (t) => {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  await Promise.all([MysteryCase.deleteMany({}), CaseSolution.deleteMany({}), LegacySessionLease.deleteMany({})]);
  const validGeminiTransport = async (url, options) => {
    validProviderCalls += 1;
    providerRequest = { url: String(url), headers: options.headers };
    const prompt = JSON.parse(options.body).contents[0].parts[0].text;
    if (prompt.includes('Translate the following authorized mystery solution')) {
      if (translationShouldFail) return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"unexpected":"shape"}' }] } }] }), { status: 200 });
      const reasoning = fakeGeneratedCase().solution.evidenceReasoning;
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ motive: 'Hindi motive', method: 'Hindi method', solutionSummary: 'Hindi summary', fullExplanation: 'Hindi explanation', evidenceReasoning: reasoning.map((item) => ({ evidenceId: item.evidenceId, implication: item.implication, explanation: `Hindi: ${item.explanation}` })) }) }] } }] }), { status: 200 });
    }
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(fakeGeneratedCase()) }] } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  setGeminiTransport(validGeminiTransport);
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/cases`;
  let cookie;

  t.after(async () => {
    setGeminiTransport(null);
    setGeminiRetryWait(null);
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
    await Promise.all([MysteryCase.deleteMany({}), CaseSolution.deleteMany({}), LegacySessionLease.deleteMany({})]);
    await mongoose.disconnect();
  });

  const injectedRequest = await originalFetch(baseUrl, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario: { $ne: '' }, difficulty: 'Easy', length: 'Short', ownerSessionId: 'attacker-controlled' }),
  });
  assert.equal(injectedRequest.status, 400);
  const cookieHeader = injectedRequest.headers.get('set-cookie');
  assert.match(cookieHeader, /HttpOnly/i);
  assert.match(cookieHeader, /SameSite=Lax/i);
  const cookieMaxAge = Number(cookieHeader.match(/Max-Age=(\d+)/i)?.[1]);
  assert.ok(cookieMaxAge <= 2_592_000 && cookieMaxAge >= 2_590_000, 'anonymous session cookie should expire in about 30 days');
  assert.doesNotMatch(cookieHeader, /; Secure/i, 'test-mode cookie should remain usable over local HTTP');
  cookie = cookieHeader.split(';')[0];

  const legacyId = 'c'.repeat(64);
  const legacySignature = createHmac('sha256', process.env.SESSION_SECRET).update(legacyId).digest('hex');
  const legacyUpgrade = await originalFetch('http://127.0.0.1:' + server.address().port + '/api/health', {
    headers: { Cookie: `mystery_session=${legacyId}.${legacySignature}` },
  });
  assert.equal(legacyUpgrade.status, 200);
  const upgradedCookie = legacyUpgrade.headers.get('set-cookie').split(';')[0];
  assert.match(upgradedCookie, new RegExp(`^mystery_session=v2\\.${legacyId}\\.`));
  cookie = upgradedCookie;
  const legacyLease = await LegacySessionLease.findById(createHash('sha256').update(legacyId).digest('hex'));
  assert.ok(legacyLease);
  legacyLease.expiresAt = new Date(Date.now() - 1_000);
  await legacyLease.save();
  const replayedExpiredLegacy = await originalFetch('http://127.0.0.1:' + server.address().port + '/api/health', {
    headers: { Cookie: `mystery_session=${legacyId}.${legacySignature}` },
  });
  assert.equal(replayedExpiredLegacy.status, 200);
  const renewedSession = replayedExpiredLegacy.headers.get('set-cookie').split(';')[0];
  assert.doesNotMatch(renewedSession, new RegExp(`^mystery_session=v2\\.${legacyId}\\.`));

  const securityHeaderResponse = await originalFetch('http://127.0.0.1:' + server.address().port + '/api/health');
  assert.equal(securityHeaderResponse.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(securityHeaderResponse.headers.get('x-frame-options'), 'DENY');
  assert.equal(securityHeaderResponse.headers.get('cache-control'), 'no-store');
  assert.match(securityHeaderResponse.headers.get('content-security-policy'), /default-src 'none'/);

  const malformedCookie = await originalFetch('http://127.0.0.1:' + server.address().port + '/api/health', { headers: { Cookie: 'mystery_session=%E0%A4%A' } });
  assert.equal(malformedCookie.status, 200);
  assert.notEqual(malformedCookie.headers.get('set-cookie')?.split(';')[0], 'mystery_session=%E0%A4%A');

  const malformedJson = await originalFetch(baseUrl, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"scenario":"do-not-reflect-this-secret"',
  });
  assert.equal(malformedJson.status, 400);
  const malformedJsonBody = await malformedJson.text();
  assert.equal(malformedJsonBody.includes('do-not-reflect-this-secret'), false);
  assert.equal(malformedJsonBody.includes('SyntaxError'), false);

  const casesBeforeProviderFailure = await MysteryCase.countDocuments({});
  const solutionsBeforeProviderFailure = await CaseSolution.countDocuments({});
  let invalidProviderCalls = 0;
  setGeminiTransport(async () => {
    invalidProviderCalls += 1;
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{invalid json' }] } }] }), { status: 200 });
  });
  const failedGeneration = await originalFetch(baseUrl, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ scenario: 'A fictional conservatory loses a rare plant before a public exhibition.', difficulty: 'Easy', length: 'Short' }),
  });
  setGeminiTransport(validGeminiTransport);
  assert.equal(failedGeneration.status, 502);
  assert.equal((await failedGeneration.json()).error.code, 'AI_INVALID_RESPONSE');
  assert.equal(invalidProviderCalls, 3);
  assert.equal(await MysteryCase.countDocuments({}), casesBeforeProviderFailure, 'invalid provider output must not persist a partial case');
  assert.equal(await CaseSolution.countDocuments({}), solutionsBeforeProviderFailure, 'invalid provider output must not persist a partial solution');

  let transient503Calls = 0;
  setGeminiRetryWait(async () => {});
  setGeminiTransport(async (url, options) => {
    const prompt = JSON.parse(options.body).contents[0].parts[0].text;
    if (prompt.includes('Translate the following authorized mystery solution')) return validGeminiTransport(url, options);
    transient503Calls += 1;
    if (transient503Calls === 1) return new Response('busy', { status: 503, headers: { 'Retry-After': '0' } });
    return validGeminiTransport(url, options);
  });
  const transientResponse = await originalFetch(baseUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ scenario: 'A fictional observatory loses a brass instrument before dawn.', difficulty: 'Easy', length: 'Short' }) });
  assert.equal(transientResponse.status, 201, 'a transient Gemini 503 should recover within the bounded retry policy');
  assert.equal(transient503Calls, 2);
  const transientCase = (await transientResponse.json()).case;
  await originalFetch(`${baseUrl}/${transientCase.id}`, { method: 'DELETE', headers: { Cookie: cookie } });
  setGeminiTransport(validGeminiTransport);

  const createRequest = { scenario: 'A sealed archive loses a rare map on the night of its public unveiling.', difficulty: 'Easy', length: 'Long', language: 'en', category: 'historical' };
  const createResponse = await originalFetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie, 'Idempotency-Key': 'case-create-flow-0001' },
    body: JSON.stringify(createRequest),
  });
  assert.equal(createResponse.status, 201);
  const created = (await createResponse.json()).case;
  const forgedCookieValue = `mystery_session=${'a'.repeat(64)}.${'b'.repeat(64)}`;
  const forgedSession = await originalFetch('http://127.0.0.1:' + server.address().port + '/api/health', { headers: { Cookie: forgedCookieValue } });
  assert.equal(forgedSession.status, 200);
  const alternateCookie = forgedSession.headers.get('set-cookie').split(';')[0];
  assert.notEqual(alternateCookie, forgedCookieValue, 'invalid signatures must receive a freshly generated session');
  const crossSessionRead = await originalFetch(`${baseUrl}/${created.id}`, { headers: { Cookie: alternateCookie } });
  assert.equal(crossSessionRead.status, 404);
  const injectedCaseId = await originalFetch(`${baseUrl}/%24ne`, { headers: { Cookie: cookie } });
  assert.equal(injectedCaseId.status, 400);

  assert.ok(providerRequest);
  assert.equal(new URL(providerRequest.url).search, '', 'Gemini key must not be placed in the request URL');
  assert.equal(providerRequest.headers['x-goog-api-key'], 'test-only-key');
  assert.equal(created.suspects.length, 3);
  assert.equal(created.language, 'en');
  assert.equal(created.category, 'historical');
  assert.equal(created.length, 'Long');
  assert.equal(created.status, 'investigating');
  const callsAfterCreate = validProviderCalls;
  const duplicateCreate = await originalFetch(baseUrl, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie, 'Idempotency-Key': 'case-create-flow-0001' },
    body: JSON.stringify(createRequest),
  });
  assert.equal(duplicateCreate.status, 200);
  assert.equal((await duplicateCreate.json()).case.id, created.id);
  assert.equal(validProviderCalls, callsAfterCreate, 'an idempotent retry must not call Gemini or create another case');
  const randomResponse = await originalFetch(baseUrl, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ random: true, category: 'art_theft', difficulty: 'Easy', length: 'Short', language: 'en' }),
  });
  assert.equal(randomResponse.status, 201);
  const randomCase = (await randomResponse.json()).case;
  assert.equal(randomCase.language, 'en');
  assert.equal(randomCase.category, 'art_theft');
  const before = JSON.stringify(created);
  for (const hidden of ['culpritId', 'privateSolution', 'isRedHerring', 'evidenceReasoning', 'culprit']) assert.equal(before.includes(hidden), false, `pre-submission response leaked ${hidden}`);
  assert.equal(before.includes('test-only-key'), false);

  const unauthorized = await originalFetch(`${baseUrl}/${created.id}`);
  assert.equal(unauthorized.status, 404);
  const ownerLibrary = await originalFetch(baseUrl, { headers: { Cookie: cookie } });
  assert.equal(ownerLibrary.status, 200);
  const listedCases = (await ownerLibrary.json()).investigations;
  assert.equal(listedCases.length, 2);
  assert.ok(listedCases.some((entry) => entry.id === created.id && entry.language === 'en'));
  assert.ok(listedCases.some((entry) => entry.id === randomCase.id && entry.language === 'en'));
  const foreignLibrary = await originalFetch(baseUrl, { headers: { Cookie: alternateCookie } });
  assert.deepEqual((await foreignLibrary.json()).investigations, []);

  const skippedHint = await originalFetch(`${baseUrl}/${created.id}/hints`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ level: 2, language: 'hi' }),
  });
  assert.equal(skippedHint.status, 409);
  const firstHintResponse = await originalFetch(`${baseUrl}/${created.id}/hints`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ level: 1, language: 'hi' }),
  });
  assert.equal(firstHintResponse.status, 200);
  const firstHint = (await firstHintResponse.json()).hint;
  assert.equal(firstHint.level, 1);
  assert.equal(firstHint.evidenceIds.every((id) => created.evidence.some((item) => item.id === id)), true);
  assert.match(firstHint.text, /फिर से देखें/);
  const repeatedHint = await originalFetch(`${baseUrl}/${created.id}/hints`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ level: 1, language: 'hi' }),
  });
  assert.deepEqual((await repeatedHint.json()).hint, firstHint);

  const blockedOrigin = await originalFetch(`${baseUrl}/${created.id}/progress`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: cookie, Origin: 'https://attacker.invalid' },
    body: JSON.stringify({ notes: 'cross-origin write' }),
  });
  assert.equal(blockedOrigin.status, 403);

  const nosqlProgress = await originalFetch(`${baseUrl}/${created.id}/progress`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ notes: 'no operator injection', $set: { ownerSessionId: 'attacker-controlled' } }),
  });
  assert.equal(nosqlProgress.status, 400);

  const invalidEvidence = await originalFetch(`${baseUrl}/${created.id}/progress`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ reviewedEvidence: ['not-in-this-case'] }),
  });
  assert.equal(invalidEvidence.status, 400);

  const progressResponse = await originalFetch(`${baseUrl}/${created.id}/progress`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ notes: 'The timing places the curator near the gallery.', reviewedEvidence: ['e1', 'e3'] }),
  });
  assert.equal(progressResponse.status, 200);

  const refreshResponse = await originalFetch(`${baseUrl}/${created.id}`, { headers: { Cookie: cookie } });
  assert.equal(refreshResponse.status, 200);
  const restored = (await refreshResponse.json()).case;
  assert.equal(restored.notes, 'The timing places the curator near the gallery.');
  assert.deepEqual(restored.reviewedEvidence, ['e1', 'e3']);
  assert.deepEqual(restored.requestedHintLevels, [1]);
  assert.equal(JSON.stringify(restored).includes('culpritId'), false);
  const uncompletedHi = await originalFetch(`${baseUrl}/${created.id}?language=hi`, { headers: { Cookie: cookie } });
  assert.equal(uncompletedHi.status, 200);
  assert.equal((await uncompletedHi.json()).case.reveal, null, 'changing language before accusation must never reveal solution data');

  const invalidGuess = await originalFetch(`${baseUrl}/${created.id}/accusation`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ suspectId: 'unknown' }),
  });
  assert.equal(invalidGuess.status, 400);

  const savedSolution = await CaseSolution.findOne({ caseId: created.id }).lean();
  assert.ok(savedSolution);
  await CaseSolution.deleteOne({ caseId: created.id });
  let serverLog = '';
  const originalConsoleError = console.error;
  console.error = (...values) => { serverLog += values.join(' '); };
  let internalFailure;
  try {
    internalFailure = await originalFetch(`${baseUrl}/${created.id}/accusation`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ suspectId: 's2' }),
    });
  } finally {
    console.error = originalConsoleError;
  }
  assert.equal(internalFailure.status, 500);
  const internalFailureBody = await internalFailure.text();
  assert.equal(internalFailureBody.includes('Case solution missing'), false);
  assert.equal(internalFailureBody.includes('privateSolution'), false);
  assert.equal(serverLog.includes('Case solution missing'), false);
  const { _id, __v, createdAt, updatedAt, ...solutionToRestore } = savedSolution;
  await CaseSolution.create(solutionToRestore);

  const blockedGeneration = await originalFetch(baseUrl, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario: 'A second fictional case prompt for rate-limit testing only.', difficulty: 'Easy', length: 'Short' }),
  });
  assert.equal(blockedGeneration.status, 429);

  const accusation = await originalFetch(`${baseUrl}/${created.id}/accusation`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ suspectId: 's2' }),
  });
  assert.equal(accusation.status, 200);
  const result = (await accusation.json()).result;
  assert.equal(result.isCorrect, false);
  assert.equal(result.selectedSuspectId, 's2');
  assert.equal(result.culprit.name, 'Avery Stone');
  assert.equal(result.evidenceReasoning.length >= 2, true);

  const translatedResult = await originalFetch(`${baseUrl}/${created.id}/accusation`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ suspectId: 's2', language: 'hi' }),
  });
  const translated = (await translatedResult.json()).result;
  assert.equal(translated.fullExplanation, 'Hindi explanation');
  assert.equal(translated.culprit.name, result.culprit.name, 'translation must preserve culprit identity');
  assert.deepEqual(translated.evidenceReasoning.map((item) => [item.evidenceId, item.implication]), result.evidenceReasoning.map((item) => [item.evidenceId, item.implication]), 'translation must preserve evidence references and labels');
  const completedHindiRefresh = await originalFetch(`${baseUrl}/${created.id}?language=hi`, { headers: { Cookie: cookie } });
  assert.equal((await completedHindiRefresh.json()).case.reveal.fullExplanation, 'Hindi explanation');
  translationShouldFail = true;
  const fallbackRefresh = await originalFetch(`${baseUrl}/${created.id}?language=hinglish`, { headers: { Cookie: cookie } });
  const fallbackReveal = (await fallbackRefresh.json()).case.reveal;
  assert.equal(fallbackReveal.translationFallback, true);
  assert.equal(fallbackReveal.fullExplanation, result.fullExplanation, 'invalid translation safely falls back to the canonical authorized language');
  translationShouldFail = false;

  const repeated = await originalFetch(`${baseUrl}/${created.id}/accusation`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ suspectId: 's1' }),
  });
  assert.equal(repeated.status, 200);
  assert.deepEqual((await repeated.json()).result, result);

  const correctAccusation = await originalFetch(`${baseUrl}/${randomCase.id}/accusation`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ suspectId: 's1' }),
  });
  assert.equal(correctAccusation.status, 200);
  assert.equal((await correctAccusation.json()).result.isCorrect, true);
  const completedStoredCase = await MysteryCase.findById(randomCase.id).lean();
  assert.equal(completedStoredCase.reveal, null, 'the private solution must not be duplicated in the player-case document');
  assert.equal(completedStoredCase.accusationCorrect, true);
  const completedCase = await originalFetch(`${baseUrl}/${randomCase.id}`, { headers: { Cookie: cookie } });
  assert.equal((await completedCase.json()).case.status, 'completed');
  const completedHint = await originalFetch(`${baseUrl}/${randomCase.id}/hints`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ level: 1, language: 'en' }),
  });
  assert.equal(completedHint.status, 409);
  const blockedAccusation = await originalFetch(`${baseUrl}/${created.id}/accusation`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ suspectId: 's3' }),
  });
  assert.equal(blockedAccusation.status, 429);

  const lockedProgress = await originalFetch(`${baseUrl}/${created.id}/progress`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ notes: 'attempt to edit after submission' }),
  });
  assert.equal(lockedProgress.status, 409);
  const removed = await originalFetch(`${baseUrl}/${randomCase.id}`, { method: 'DELETE', headers: { Cookie: cookie } });
  assert.equal(removed.status, 204);
  assert.equal(await MysteryCase.findById(randomCase.id), null);
  assert.equal(await CaseSolution.findOne({ caseId: randomCase.id }), null);
  const deletedRead = await originalFetch(`${baseUrl}/${randomCase.id}`, { headers: { Cookie: cookie } });
  assert.equal(deletedRead.status, 404);
});

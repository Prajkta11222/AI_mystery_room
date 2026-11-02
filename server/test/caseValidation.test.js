import test from 'node:test';
import assert from 'node:assert/strict';
import { scenarioInput, accusationInput, progressInput, generatedCase } from '../src/validators/caseSchemas.js';
import { generateCase, setGeminiRetryWait, setGeminiTransport, validateReferences } from '../src/services/geminiService.js';
import { env } from '../src/config/env.js';

const input = { scenario: 'A sealed archive loses a rare map on the night of its public unveiling.', difficulty: 'Easy', length: 'Short' };
const validCase = () => ({
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
});

test('scenario input accepts valid prompts and rejects blank, short, long, and unsupported values', () => {
  assert.equal(scenarioInput.safeParse(input).success, true);
  assert.equal(scenarioInput.safeParse({ ...input, scenario: '   ' }).success, false);
  assert.equal(scenarioInput.safeParse({ ...input, scenario: 'Too short' }).success, false);
  assert.equal(scenarioInput.safeParse({ ...input, scenario: 'x'.repeat(1001) }).success, false);
  assert.equal(scenarioInput.safeParse({ ...input, difficulty: 'Nightmare' }).success, false);
  assert.equal(scenarioInput.safeParse({ ...input, length: 'Long' }).success, true);
  assert.equal(scenarioInput.safeParse({ ...input, length: 'Medium' }).success, true);
  assert.equal(scenarioInput.safeParse({ ...input, language: 'fr' }).success, false);
  assert.equal(scenarioInput.safeParse({ random: true, category: 'art_theft', difficulty: 'Easy', length: 'Short', language: 'hi' }).success, true);
  assert.equal(scenarioInput.safeParse({ random: true, scenario: input.scenario, difficulty: 'Easy', length: 'Short' }).success, false);
  assert.equal(scenarioInput.safeParse({ ...input, scenario: { $ne: '' } }).success, false);
  assert.equal(scenarioInput.safeParse({ ...input, ownerSessionId: 'attacker-controlled' }).success, false);
  assert.equal(accusationInput.safeParse({ suspectId: { $ne: '' } }).success, false);
  assert.equal(progressInput.safeParse({ notes: 'valid notes', $set: { ownerSessionId: 'attacker-controlled' } }).success, false);
});

test('well-formed case validates and references resolve', () => {
  const parsed = generatedCase.parse(validCase());
  assert.doesNotThrow(() => validateReferences(parsed, input));
});

test('case validation rejects missing culprit, invalid references, and duplicate IDs', () => {
  const missingCulprit = validCase();
  missingCulprit.solution.culpritId = 'unknown';
  assert.throws(() => validateReferences(generatedCase.parse(missingCulprit), input), /Invalid culprit reference/);

  const invalidSuspect = validCase();
  invalidSuspect.evidence[0].suspectIds = ['unknown'];
  assert.throws(() => validateReferences(generatedCase.parse(invalidSuspect), input), /Invalid evidence suspect reference/);

  const duplicateEvidence = validCase();
  duplicateEvidence.evidence[1].id = 'e1';
  assert.throws(() => validateReferences(generatedCase.parse(duplicateEvidence), input), /Duplicate IDs/);

  const duplicateSuspect = validCase();
  duplicateSuspect.suspects[1].id = 's1';
  assert.throws(() => validateReferences(generatedCase.parse(duplicateSuspect), input), /Duplicate IDs/);
});

test('culprit leak validation allows contextual name mentions but rejects explicit accusations', () => {
  const contextual = validCase();
  contextual.evidence[0].content = 'Avery Stone signed the visitor register at 20:40.';
  assert.doesNotThrow(() => validateReferences(generatedCase.parse(contextual), input));

  const explicit = validCase();
  explicit.evidence[0].content = 'Avery Stone stole the missing map.';
  assert.throws(() => validateReferences(generatedCase.parse(explicit), input), /explicitly revealed/);
});

test('case validation rejects text that contradicts the selected Hindi or Hinglish script', () => {
  const mystery = generatedCase.parse(validCase());
  assert.throws(() => validateReferences(mystery, { ...input, language: 'hi' }), /does not use Hindi consistently/);
  assert.throws(() => validateReferences(mystery, { ...input, language: 'hinglish' }), /Romanized Hindi consistently/);
});

test('case validation rejects duplicate supporting clues and unordered timeline', () => {
  const repeatedReasoning = validCase();
  repeatedReasoning.solution.evidenceReasoning[1].evidenceId = 'e1';
  assert.throws(() => validateReferences(generatedCase.parse(repeatedReasoning), input), /independent clues/);

  const unorderedTimeline = validCase();
  unorderedTimeline.timeline.reverse();
  assert.throws(() => validateReferences(generatedCase.parse(unorderedTimeline), input), /chronological/);
});

test('case validation rejects missing or non-ISO timestamps', () => {
  const missingEvidenceTime = validCase();
  missingEvidenceTime.evidence[0].timestamp = '';
  assert.equal(generatedCase.safeParse(missingEvidenceTime).success, false);

  const localeEvidenceTime = validCase();
  localeEvidenceTime.evidence[0].timestamp = '10/20/2026 20:40';
  assert.throws(() => validateReferences(generatedCase.parse(localeEvidenceTime), input), /ISO-8601/);

  const invalidCalendarTime = validCase();
  invalidCalendarTime.timeline[0].time = '2026-02-31T20:00:00.000Z';
  assert.throws(() => validateReferences(generatedCase.parse(invalidCalendarTime), input), /ISO-8601/);
});

test('generated case validation caps collection sizes to the game contract', () => {
  const oversized = validCase();
  oversized.evidence = [...oversized.evidence, ...oversized.evidence, ...oversized.evidence];
  assert.equal(generatedCase.safeParse(oversized).success, false);
});

function caseForDifficulty(difficulty) {
  const mystery = validCase();
  if (difficulty === 'Medium' || difficulty === 'Hard') {
    mystery.suspects.push({ id: 's4', name: 'Drew Vale', role: 'Archivist', profile: 'A meticulous archivist.', relationship: 'Maintained the records.', alibi: 'Checking the east wing inventory.' });
    mystery.evidence.push(
      { id: 'e5', type: 'document', title: 'Inventory note', description: 'A fictional inventory record.', content: 'One shelf was checked early.', timestamp: '2026-10-20T20:35:00.000Z', source: 'Fictional archive log', suspectIds: ['s4'] },
      { id: 'e6', type: 'statement', title: 'Volunteer note', description: 'A fictional volunteer statement.', content: 'The west entrance remained clear.', timestamp: '2026-10-20T20:45:00.000Z', source: 'Fictional statement', suspectIds: ['s3'] },
    );
    mystery.solution.evidenceReasoning.push(
      { evidenceId: 'e5', explanation: 'The inventory note creates an alternative lead.', implication: 'red_herring' },
      { evidenceId: 'e6', explanation: 'The volunteer confirms the guard remained outside.', implication: 'weakens_suspect' },
    );
  }
  if (difficulty === 'Hard') {
    mystery.suspects.push({ id: 's5', name: 'Ellis Gray', role: 'Technician', profile: 'A contracted technician.', relationship: 'Serviced the display lights.', alibi: 'Working in the service corridor.' });
    mystery.evidence.push(
      { id: 'e7', type: 'message', title: 'Service message', description: 'A fictional service message.', content: 'The gallery lights were restored.', timestamp: '2026-10-20T20:55:00.000Z', source: 'Fictional message export', suspectIds: ['s5'] },
      { id: 'e8', type: 'cctv', title: 'Corridor camera log', description: 'A simulated camera record.', content: 'A technician remains in the corridor.', timestamp: '2026-10-20T20:58:00.000Z', source: 'Simulated CCTV evidence', suspectIds: ['s5'] },
    );
    mystery.solution.evidenceReasoning.push(
      { evidenceId: 'e7', explanation: 'The message draws suspicion toward the technician.', implication: 'red_herring' },
      { evidenceId: 'e8', explanation: 'The camera record confirms the technician stayed in the corridor.', implication: 'weakens_suspect' },
    );
  }
  mystery.solution.evidenceReasoning = mystery.solution.evidenceReasoning.map((item) => {
    if (difficulty === 'Easy' || item.evidenceId === 'e1' || item.evidenceId === 'e3') return item;
    if (difficulty === 'Medium' && item.evidenceId === 'e5') return { ...item, implication: 'red_herring' };
    return item;
  });
  return mystery;
}

test('Easy, Medium, and Hard cases satisfy suspect, evidence, and clue contracts', () => {
  for (const difficulty of ['Easy', 'Medium', 'Hard']) {
    const mystery = caseForDifficulty(difficulty);
    const parsed = generatedCase.parse(mystery);
    assert.doesNotThrow(() => validateReferences(parsed, { ...input, difficulty }), `${difficulty} case should validate`);
  }
});

test('case validation requires a weakening clue and difficulty-appropriate red herrings', () => {
  const noWeakeningClue = validCase();
  noWeakeningClue.solution.evidenceReasoning = noWeakeningClue.solution.evidenceReasoning.filter((item) => item.implication !== 'weakens_suspect');
  assert.throws(() => validateReferences(generatedCase.parse(noWeakeningClue), input), /weaken/);

  for (const [difficulty, redHerringCount] of [['Medium', 0], ['Hard', 1]]) {
    const mismatch = caseForDifficulty(difficulty);
    let retainedRedHerrings = 0;
    mismatch.solution.evidenceReasoning = mismatch.solution.evidenceReasoning.map((item) => {
      if (item.implication !== 'red_herring') return item;
      if (retainedRedHerrings < redHerringCount) {
        retainedRedHerrings += 1;
        return item;
      }
      return { ...item, implication: 'supports_culprit' };
    });
    assert.throws(() => validateReferences(generatedCase.parse(mismatch), { ...input, difficulty }), /Red-herring count/);
  }
});

test('Gemini repairs malformed JSON and stops after three invalid responses', async () => {
  let calls = 0;
  const retryWaits = [];
  const attemptedPrompts = [];
  const configuredModel = env.geminiModel;
  const configuredThinkingLevel = env.geminiThinkingLevel;
  setGeminiRetryWait(async (milliseconds) => retryWaits.push(milliseconds));
  setGeminiTransport(async (_url, options) => {
    calls += 1;
    attemptedPrompts.push(JSON.parse(options.body).contents[0].parts[0].text);
    const text = calls === 1 ? '{malformed json' : JSON.stringify(validCase());
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 });
  });
  try {
    const generated = await generateCase(input, 'unit-test');
    assert.equal(generated.solution.culpritId, 's1');
    assert.equal(calls, 2);
    assert.match(attemptedPrompts[1], /Previous output: \[The previous response was not valid JSON\.\]/);
    assert.match(attemptedPrompts[1], /Scenario \(fictional premise data\)/);

    calls = 0;
    attemptedPrompts.length = 0;
    const generationConfigs = [];
    env.geminiModel = 'gemini-3.8-flash';
    env.geminiThinkingLevel = 'low';
    setGeminiTransport(async (_url, options) => {
      calls += 1;
      const requestBody = JSON.parse(options.body);
      attemptedPrompts.push(requestBody.contents[0].parts[0].text);
      generationConfigs.push(requestBody.generationConfig);
      if (calls < 3) return new Response('{}', { status: 503, headers: { 'Retry-After': '0' } });
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(validCase()) }] } }] }), { status: 200 });
    });
    const recovered = await generateCase(input, 'unit-test');
    env.geminiModel = configuredModel;
    env.geminiThinkingLevel = configuredThinkingLevel;
    assert.equal(recovered.solution.culpritId, 's1');
    assert.equal(calls, 3, 'transient 503 responses retry at most twice');
    assert.equal(attemptedPrompts[0], attemptedPrompts[1], 'provider errors retry the original prompt instead of a repair prompt');
    assert.deepEqual(generationConfigs[0], { responseMimeType: 'application/json', thinkingConfig: { thinkingLevel: 'low' } }, 'Gemini 3 models use a bounded latency thinking level');
    assert.ok(retryWaits[0] >= 1_000 && retryWaits[1] >= 2_000, 'retry delays use exponential backoff');

    calls = 0;
    retryWaits.length = 0;
    setGeminiTransport(async () => {
      calls += 1;
      return new Response('{"error":{"status":"RESOURCE_EXHAUSTED"}}', { status: 429, headers: { 'Retry-After': '0' } });
    });
    await assert.rejects(generateCase(input, 'unit-test'), (error) => error.status === 429 && error.code === 'AI_RATE_LIMITED');
    assert.equal(calls, 3, 'provider rate limits retain the bounded three-attempt retry policy');
    assert.ok(retryWaits.every((milliseconds) => milliseconds >= 1_000), '429 responses without Retry-After still use bounded backoff');

    calls = 0;
    retryWaits.length = 0;
    setGeminiTransport(async () => {
      calls += 1;
      return new Response('{"error":{"status":"RESOURCE_EXHAUSTED"}}', { status: 429, headers: { 'Retry-After': '45' } });
    });
    await assert.rejects(generateCase(input, 'unit-test'), (error) => error.status === 429 && error.code === 'AI_RATE_LIMITED');
    assert.equal(calls, 1, 'a provider delay beyond the configured retry window fails without hanging or retrying early');
    assert.equal(retryWaits.length, 0, 'long provider delays are not awaited by the request');

    calls = 0;
    retryWaits.length = 0;
    setGeminiTransport(async () => {
      calls += 1;
      if (calls === 1) return new Response('{"error":{"status":"RESOURCE_EXHAUSTED"}}', { status: 429, headers: { 'Retry-After': '5' } });
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(validCase()) }] } }] }), { status: 200 });
    });
    const recoveredFromQuota = await generateCase(input, 'unit-test');
    assert.equal(recoveredFromQuota.solution.culpritId, 's1', 'generation recovers after the provider retry window');
    assert.equal(calls, 2);
    assert.ok(retryWaits[0] >= 5_000, 'recovery waits for the provider Retry-After duration');

    calls = 0;
    setGeminiTransport(async () => {
      calls += 1;
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{invalid' }] } }] }), { status: 200 });
    });
    await assert.rejects(generateCase(input, 'unit-test'), (error) => error.status === 502 && error.code === 'AI_INVALID_RESPONSE');
    assert.equal(calls, 3, 'one initial attempt plus at most two repairs');

    calls = 0;
    setGeminiTransport(async () => {
      calls += 1;
      throw new DOMException('provider timeout', 'AbortError');
    });
    await assert.rejects(generateCase(input, 'unit-test'), (error) => error.status === 503 && error.code === 'GENERATION_UNAVAILABLE');
    assert.equal(calls, 3, 'provider timeout retries remain bounded');

    calls = 0;
    const configuredKey = env.geminiApiKey;
    env.geminiApiKey = '';
    setGeminiTransport(async () => { calls += 1; throw new Error('transport must not be called'); });
    try {
      await assert.rejects(generateCase(input, 'unit-test'), (error) => error.status === 503 && error.code === 'GENERATION_UNAVAILABLE');
      assert.equal(calls, 0, 'missing key fails before a provider request');
    } finally {
      env.geminiApiKey = configuredKey;
    }
  } finally {
    env.geminiModel = configuredModel;
    env.geminiThinkingLevel = configuredThinkingLevel;
    setGeminiTransport(null);
    setGeminiRetryWait(null);
  }
});

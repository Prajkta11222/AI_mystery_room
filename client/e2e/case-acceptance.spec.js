import { test, expect } from '@playwright/test';

test.setTimeout(60_000);

const caseData = {
  id: 'case-acceptance-0001',
  title: 'The Missing Map',
  brief: 'A rare map vanishes during an evening reception.',
  incident: 'The map disappeared from a locked display.',
  location: 'Fictional Bellweather Archive',
  dateTime: '2026-10-20T21:00:00.000Z',
  objective: 'Identify who took the map.',
  suspects: [
    { id: 's1', name: 'Avery Stone', role: 'Curator', relationship: 'Managed the display.', alibi: 'Cataloguing records in the east wing.' },
    { id: 's2', name: 'Blair North', role: 'Donor', relationship: 'Loaned another artifact.', alibi: 'Speaking with guests in the lobby.' },
    { id: 's3', name: 'Casey Reed', role: 'Guard', relationship: 'Patrolled the archive.', alibi: 'Checking the west entrance.' },
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
  notes: '',
  reviewedEvidence: [],
  requestedHintLevels: [],
  submitted: false,
  status: 'investigating',
  difficulty: 'Medium',
  language: 'en',
};

const reveal = (selectedSuspectId) => ({
  isCorrect: selectedSuspectId === 's1',
  selectedSuspectId,
  culprit: { id: 's1', name: 'Avery Stone' },
  motive: 'They wanted to protect the archive.',
  method: 'They used their access to the display.',
  solutionSummary: 'The clues point to the curator.',
  fullExplanation: 'The staff message and display record narrow the window to the curator.',
  evidenceReasoning: [
    { evidenceId: 'e1', explanation: 'The message places them near the display.', implication: 'supports_culprit' },
    { evidenceId: 'e3', explanation: 'The display record fixes the timing.', implication: 'supports_culprit' },
    { evidenceId: 'e2', explanation: 'The statement sends suspicion elsewhere.', implication: 'red_herring' },
    { evidenceId: 'e4', explanation: 'The camera timing rules out the guard.', implication: 'weakens_suspect' },
  ],
});

async function mockApi(page) {
  const state = structuredClone(caseData);
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const body = request.postDataJSON?.() || {};
    if (path === '/api/cases' && request.method() === 'POST') {
      state.language = body.language || 'en';
      return route.fulfill({ json: { case: { ...state } } });
    }
    if (path === `/api/cases/${state.id}` && request.method() === 'GET') {
      return route.fulfill({ json: { case: { ...state } } });
    }
    if (path === `/api/cases/${state.id}/progress` && request.method() === 'PATCH') {
      Object.assign(state, body);
      return route.fulfill({ json: { progress: { notes: state.notes, reviewedEvidence: state.reviewedEvidence } } });
    }
    if (path === `/api/cases/${state.id}/hints` && request.method() === 'POST') {
      const level = body.level;
      state.requestedHintLevels = [...new Set([...state.requestedHintLevels, level])].sort();
      return route.fulfill({ json: { requestedHintLevels: state.requestedHintLevels, hint: { level, text: `Hint ${level}: compare the evidence timing.`, evidenceIds: ['e1'] } } });
    }
    if (path === `/api/cases/${state.id}/accusation` && request.method() === 'POST') {
      state.submitted = true;
      state.status = 'completed';
      state.reveal = reveal(body.suspectId);
      return route.fulfill({ json: { result: state.reveal } });
    }
    if (path === '/api/cases' && request.method() === 'GET') return route.fulfill({ json: { investigations: [state] } });
    return route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND', message: 'Not found' } } });
  });
}

async function openCase(page, language = 'en') {
  await page.addInitScript(() => localStorage.setItem('mystery-tutorial-complete', 'yes'));
  await page.goto('/create', { waitUntil: 'domcontentloaded' });
  if (language !== 'en') await page.getByLabel('Language').selectOption(language);
  await page.getByRole('textbox').fill('A sealed archive loses a rare map during a fictional evening reception.');
  await page.getByRole('button', { name: /Generate case|केस बनाएँ|Case banayein/ }).click();
  await expect(page).toHaveURL(/\/case\/case-acceptance-0001$/);
  await expect(page.getByRole('heading', { name: 'The Missing Map' })).toBeVisible();
}

test.describe('case acceptance', () => {
  test('creates a case, preserves secrecy, saves notes, uses hints, resumes, and locks after a correct accusation', async ({ page }) => {
    await mockApi(page);
    await openCase(page);

    await expect(page.locator('.difficulty-pill')).toHaveText('Medium');
    await expect(page.getByText('Avery Stone')).not.toBeVisible();
    await page.getByRole('tab', { name: 'Evidence' }).click();
    await page.getByRole('button', { name: /Staff message/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Reviewed' }).click();
    await page.getByRole('tab', { name: 'Notes' }).click();
    await page.getByRole('textbox').fill('The timing points toward the curator.');
    await expect(page.getByText('Saved')).toBeVisible();
    await page.getByRole('tab', { name: 'Hints' }).click();
    await page.getByRole('button', { name: 'Reveal next hint' }).click();
    await expect(page.getByText(/Hint 1:/)).toBeVisible();

    await page.reload();
    await page.getByRole('tab', { name: 'Notes' }).click();
    await expect(page.getByRole('textbox')).toHaveValue('The timing points toward the curator.');
    await page.getByRole('tab', { name: 'Suspects' }).click();
    await page.getByRole('button', { name: /Avery Stone/ }).click();
    await page.getByRole('tabpanel').getByRole('button', { name: /Make final accusation/ }).click();
    await page.getByRole('button', { name: /Confirm accusation/ }).click();
    await expect(page.getByRole('heading', { name: 'Your deduction was correct.' })).toBeVisible();
    await page.getByRole('tab', { name: 'Notes' }).click();
    await expect(page.getByRole('textbox')).toBeDisabled();
    await expect(page.getByRole('tabpanel').getByRole('button', { name: /Make final accusation/ })).not.toBeVisible();
  });

  test('supports English, Hindi, and Hinglish creation screens', async ({ page }) => {
    await mockApi(page);
    for (const [language, expected] of [['en', 'Generate case'], ['hi', 'केस बनाएँ'], ['hinglish', 'Case banayein']]) {
      await page.goto('/create');
      await page.locator('select').first().selectOption(language);
      await expect(page.getByRole('button', { name: expected })).toBeVisible();
    }
  });

  test('confirms preference changes and exposes the case difficulty', async ({ page }) => {
    await page.goto('/preferences');
    await page.getByLabel('Language').selectOption('hi');
    await expect(page.getByRole('status')).toContainText('Preference');
  });

  test('shows an incorrect accusation and still locks the investigation', async ({ page }) => {
    await mockApi(page);
    await openCase(page);
    await page.getByRole('tab', { name: 'Suspects' }).click();
    await page.getByRole('button', { name: /Blair North/ }).click();
    await page.getByRole('tabpanel').getByRole('button', { name: /Make final accusation/ }).click();
    await page.getByRole('button', { name: /Confirm accusation/ }).click();
    await expect(page.getByRole('heading', { name: 'The evidence led somewhere else.' })).toBeVisible();
    await expect(page.getByRole('tabpanel').getByRole('button', { name: /Make final accusation/ })).not.toBeVisible();
  });
});

test.describe('accessibility and responsive layout', () => {
  test('supports keyboard tab navigation and modal escape', async ({ page }) => {
    await mockApi(page);
    await openCase(page);
    const tabs = page.getByRole('tab');
    await tabs.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(1)).toBeFocused();
    await page.getByRole('tab', { name: 'Evidence' }).click();
    await page.getByRole('button', { name: /Staff message/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('does not overflow a mobile viewport and exposes labelled controls', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
    await expect(page.getByLabel('Language')).toBeVisible();
    await expect(page.getByRole('link', { name: /Start investigating|जाँच शुरू करें|Start/ })).toBeVisible();
  });
});

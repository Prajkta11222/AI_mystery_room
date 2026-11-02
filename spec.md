# AI Mystery Room

## Product Requirements & Technical Specification

**Version:** 2.1  
**Status:** Proposed implementation baseline  
**Product type:** AI-powered interactive mystery-solving web application  
**Primary goal:** Deliver an immersive, beginner-friendly detective experience with logically consistent AI-generated mysteries, secure gameplay, and a premium user interface.

---

## 1. Product Vision

AI Mystery Room is an interactive detective game where users investigate fictional mysteries by examining suspects, evidence, witness statements, and clues before accusing a suspect and discovering the truth.

The application should combine the adaptability of generative AI with the logical consistency of a well-designed mystery game.

### Core product principle

**Easy to start. Engaging to investigate. Satisfying to solve.**

Users should be able to start investigating without creating an account or learning complicated controls.

### Product objectives

1. Generate engaging, logically consistent fictional mysteries.
2. Make investigation intuitive for first-time users.
3. Support English, Hindi, and Hinglish.
4. Preserve case progress across page refreshes.
5. Provide optional, evidence-grounded hints.
6. Prevent premature disclosure of solutions.
7. Deliver a polished, accessible, responsive interface.
8. Maintain security, reliability, and deployment readiness.

---

## 2. Target Users

### Primary audience

- Casual mystery and detective game enthusiasts.
- Students and young adults.
- Users interested in interactive storytelling.
- Users who enjoy solving puzzles and investigating fictional scenarios.

### Secondary audience

- Experienced mystery solvers.
- Users who prefer Hindi or Hinglish.
- Users who want to create mysteries from their own fictional premises.

### UX principles

- No mandatory registration before playing.
- No unnecessary configuration before starting an investigation.
- No complicated controls for essential actions.
- No forced tutorials.
- No unnecessary animations that interrupt gameplay.
- No artificial urgency, manipulative streaks, or pay-to-win mechanics.

---

## 3. Scope and Priorities

### 3.1 MVP — Required for launch

The MVP must include:

1. Premium, responsive home page.
2. Mystery creation from a user-provided premise.
3. Random mystery generation using predefined categories and premises.
4. Difficulty and case-length selection.
5. English, Hindi, and Hinglish localization.
6. Beginner-friendly investigation interface.
7. Suspects, evidence, witness statements, and case timeline where appropriate.
8. Persistent notes and reviewed-evidence status.
9. Progressive hints.
10. One final accusation per case.
11. Correct or incorrect accusation feedback.
12. Secure solution reveal after a valid accusation.
13. Anonymous investigation history and resume functionality.
14. Accessible loading, error, empty, and success states.
15. Reliable AI integration with validation and bounded retries.
16. Secure backend, database persistence, and deployment configuration.
17. Automated tests and documented manual acceptance tests.

### 3.2 Future phases — Not required for MVP

These features must not delay the core experience:

- Optional user registration and login.
- Password reset and account recovery.
- Cross-device synchronization.
- Detective profiles and cosmetic achievements.
- Detective ranks and statistics.
- Interactive drag-and-drop evidence board.
- Optional ambient audio and advanced animations.
- Daily challenges and leaderboards.
- Community-created or publicly shared cases.
- AI-generated evidence images.
- Multiple accusation attempts.
- Advanced investigation analytics.

Future features must not be represented as completed MVP functionality.

---

## 4. Technology and Architecture

Preserve the existing project architecture unless a documented technical issue requires a change.

### Existing technology stack

- Frontend: React and Vite.
- Backend: Node.js and Express.
- Database: MongoDB with Mongoose.
- AI: Google Gemini API.
- Testing: Existing backend and frontend test frameworks.
- Deployment targets: Vercel frontend and a compatible Node.js backend host.

### Architecture principles

1. The frontend communicates with the backend through documented APIs.
2. The backend owns case generation, validation, hints, accusation evaluation, and solution disclosure.
3. Gemini credentials remain exclusively on the server.
4. MongoDB stores persistent investigation data.
5. Public API responses use explicit allowlists.
6. The canonical solution remains separate from player-visible case data.
7. The frontend never determines whether an accusation is correct.
8. All critical game-state transitions are validated server-side.

Do not replace working components or introduce new frameworks without a demonstrated need.

---

## 5. User Journey

The primary experience follows five stages with clear transitions. See §6.5.1 for the detailed eight-step investigation flow and its UI guidance.

### Stage 1: Discover

The user opens the landing page and sees:

- A short product introduction with a compelling headline and a one-paragraph description.
- A clear **Create a mystery** call-to-action button.
- A language selector.
- A "How it works" section explaining the three phases: Create → Investigate → Decide.
- A fictional-content trust badge and footer.

Users must not need to register to begin.

### Stage 2: Create a Mystery

The user chooses:

- Custom premise or random mystery.
- Category.
- Difficulty.
- Case length.
- Language.

The interface must explain each choice briefly using helper text and short flavour descriptions (see §6.5.3).

The premise field must include an example prompt as placeholder text, a character counter, and clear validation error messages.

Users must be warned not to enter sensitive personal information. The advisory must appear both near the premise field and below the generate button.

### Stage 3: Investigate

The user enters the investigation room and can access sections through tabbed navigation:

- Case overview (timeline, setting, objective) with a prominent next action.
- Suspects (profiles with alibi text visible immediately).
- Evidence (list with review progress counter and detail modal).
- Notes (auto-saving free-text notepad).
- Hints (progressive assistance with level labels and usage counter).

The interface should emphasize the next useful action without forcing a specific investigation order. See §6.5.8 for detailed layout requirements.

### Stage 4: Accuse

The user selects one suspect from the Suspects tab and triggers the accusation from the persistent accusation bar.

A confirmation dialog must:

- Display the selected suspect's name in bold.
- Explain that the accusation is final.
- State that both correct and incorrect valid accusations conclude the investigation.
- Provide "Keep investigating" and "Confirm accusation" actions.

### Stage 5: Reveal

The game displays a reveal banner (see §6.5.8) containing:

- Whether the accusation was correct (visually distinct colours for correct vs. incorrect).
- The canonical culprit's name.
- The motive and method.
- The full explanation of the mystery.
- Per-evidence reasoning with implication labels.
- Hint usage count.
- Actions to review evidence and return to the library.

The solution must never be revealed before a valid final accusation.

---

## 6. Visual Design and UI/UX

### 6.1 Visual direction

Use a premium detective-dossier aesthetic that conveys atmosphere without sacrificing clarity.

#### Design tokens and palette

The application uses the following core tokens (actual CSS custom-property names may differ, but the semantics are authoritative):

| Token | Role | Reference value |
| --- | --- | --- |
| `--bg` | Page background | Near-black (`#10100f`) |
| `--panel` | Card / surface background | Dark graphite (`#171715`) |
| `--panel2` | Elevated surface | Slightly lighter graphite (`#1d1d1a`) |
| `--line` | Borders and dividers | Subtle warm grey (`#30302b`) |
| `--muted` | Secondary / disabled text | Muted stone (`#95948a`) |
| `--paper` | Light-on-dark contrast reference | Warm parchment (`#e8e4d9`) |
| `--gold` | Primary accent | Antique gold (`#d6b273`) |
| `--gold-dark` | Accent variant for borders / subtle emphasis | Deep gold (`#aa8548`) |
| Secondary accent | Restrained crime-scene red | Used sparingly for stamps, error accents, and destructive actions |

#### Typography system

| Usage | Family | Weight | Notes |
| --- | --- | --- | --- |
| Headings and display text | Serif display face (Playfair Display or equivalent) | 500–700 | Large, high-contrast; letter-spacing ≤ −0.03 em |
| Body and UI text | Clean sans-serif (DM Sans or equivalent) | 400–600 | Minimum 12 px body, 10 px captions |
| Metadata, labels, and stamps | Monospace (DM Mono or equivalent) | 400–500 | Uppercase tracking ≥ 0.06 em for labels |

#### Surface and elevation

- Use layered card surfaces with 1 px borders in `--line` colour rather than heavy box shadows.
- Reserve deeper shadows for modals and floating elements only.
- Maintain a clear visual hierarchy: page → panel → card → elevated modal.

#### Spacing and consistency

- Use a consistent spacing scale (multiples of 4 px or 8 px).
- Maintain uniform padding inside cards and panels across all pages.
- Keep button heights, border radii, and font sizes consistent across primary, outline, and dark button variants.

Maintain sufficient contrast and readability (see §15.3).

Avoid excessive decorative elements, glowing effects, visual clutter, and unnecessary motion.

### 6.2 Required pages and views

1. **Landing page** — Hero, value proposition, "how it works" steps, language selector, and entry points.
2. **Mystery creation view** — Premise input or random selection, category, difficulty, case length, and language.
3. **Investigation room** — Tabbed workspace for case overview, suspects, evidence, notes, and hints.
4. **Case resolution view** — Displayed inline within the investigation room after a valid accusation.
5. **Anonymous investigation library** — Card grid of active and completed investigations.
6. **Preferences view** — Language and walkthrough settings.
7. **Not-found page** — Themed 404 with navigation back to the archive.
8. **Optional onboarding walkthrough** — Dismissible card overlay on first case entry.

Authentication pages are deferred to a future phase.

### 6.3 Investigation interface

Organize the investigation into clear tabbed sections:

- **Case:** Timeline, setting, and objectives. Includes a prominent "Review evidence" action and an optional "How to investigate" help trigger.
- **Suspects:** Suspect profiles with name, role, relationship, and alibi. Suspect selection for accusation occurs here.
- **Evidence:** Discoverable evidence list with review status counter (e.g., "3 / 7 reviewed"). Each item opens a detail modal.
- **Notes:** Private free-text notepad with auto-save, character count, and save-status indicator.
- **Hints:** Progressive hint display with level labels (Nudge → Connection → Strong hint) and usage counter.

Use accessible tabs with keyboard arrow-key navigation (`role="tablist"`, `role="tab"`, `aria-selected`). See the existing implementation for reference.

Do not display every panel simultaneously on small screens. On mobile, the tab bar must scroll horizontally and each panel must stack to full width.

#### Required interface states

Every data-driven view must support:

- **Loading:** Centered spinner with contextual label (e.g., "Building your case…" during generation, "Opening investigation…" on page load).
- **Successful content display.**
- **Empty content:** Friendly message with a clear next action (e.g., "Your investigations will appear here" with a "Create a mystery" button).
- **Recoverable error:** Inline error banner with a retry action. Toast errors for non-blocking failures.
- **Disabled actions during pending operations:** Buttons display a spinner and are disabled; no double submissions.
- **Clear confirmation after successful changes:** Auto-save status for notes; "Saved" / "Saving…" / "Could not save · Retry" indicator.

The application must not display fake success states when an operation fails.

### 6.4 Motion and sound

Animations must communicate meaningful changes, such as opening a dossier or revealing a clue.

- Respect reduced-motion preferences.
- Avoid blocking transitions.
- Do not autoplay audio.
- Provide an obvious sound toggle if audio is introduced.
- Ensure essential information remains available without animation or sound.

### 6.5 Beginner-Friendly UX & Visual Design

This section defines requirements for an intuitive, self-explanatory investigation experience. Beginners must understand what to do at every step without reading external documentation.

#### 6.5.1 Investigation flow

The experience follows eight natural steps. The interface must guide users through them using visual cues, contextual labels, and obvious next actions — not by enforcing a rigid sequence.

| Step | What the user does | UI guidance |
| --- | --- | --- |
| 1. Choose a mystery | Select custom premise or random; pick category, difficulty, case length, and language. | Choice buttons with short explanatory labels (e.g., "A clear trail" for Easy). Placeholder premise example pre-filled in textarea. |
| 2. Read the case story | Review the case title, brief, setting, location, date, and objective. | Case metadata grid at the top of the investigation room. The "Case" tab shows the timeline and a prominent "Review evidence →" action. |
| 3. Review suspects | Examine suspect names, roles, relationships, and alibis. | Suspects tab with numbered, selectable cards. Alibi text visible without extra clicks. |
| 4. Investigate evidence | Open each evidence item, read its content, and mark it reviewed. | Evidence tab shows a reviewed counter (e.g., "3 / 7 reviewed"). Unreviewed items show an arrow; reviewed items show a checkmark. Opening an item reveals a detail modal with a "Mark reviewed ✓" action. |
| 5. Record notes | Write observations and connect findings in a private notepad. | Notes tab with auto-save indicator and character count. Helper text explains notes are private. |
| 6. Request hints | Ask for progressive assistance when stuck. | Hints tab shows the current hint level, usage counter, and a "Reveal next hint" button. Disabled state and "All hints used" message after 3/3. |
| 7. Accuse a suspect | Select a suspect and confirm the final accusation. | Accusation bar is persistently visible below the tabbed panel. Confirmation dialog re-states the selected suspect's name and warns that the accusation is final. |
| 8. Reveal the solution | See whether the accusation was correct, review the canonical solution, and understand how the clues connect. | Reveal banner appears at the top of the investigation room with motive, method, full explanation, and per-evidence reasoning. Links to review evidence and return to the library. |

#### 6.5.2 Progress indicators

- The evidence tab label must show the reviewed count (e.g., "Evidence 3/7").
- The hints tab or panel must show the usage count (e.g., "1/3 · Hints used").
- The accusation bar must show the currently selected suspect's name (if any) and clearly indicate whether the case is still active or completed.
- Completed cases must display a distinct visual marker ("Case completed" with a checkmark icon) in both the investigation room header and the library card.

#### 6.5.3 Contextual instructions and helper text

Provide short, in-context helper text rather than relying on a tutorial:

- **Premise field:** Placeholder with a concrete example (e.g., "A botanist vanishes from a locked greenhouse the night before a rare orchid blooms…"). Below the field: "Set a place, an incident, or a strange detail."
- **Difficulty choices:** Each option includes a short flavour description (e.g., Easy → "A clear trail", Hard → "Every detail matters").
- **Case length choices:** Short → "A focused case", Medium → "A little more detail", Long → "A deeper investigation".
- **Notes panel:** "Your notes are private to this investigation."
- **Hints panel:** Brief explanation of how hints work before the first hint is revealed.
- **Accusation bar:** "This ends the investigation whether your accusation is correct or incorrect."
- **Evidence modal:** Footer stamp reminding the user that all evidence is fictional.

#### 6.5.4 Meaningful empty states

Every view that can be empty must display a helpful message and a clear next action:

| View | Empty-state message | Next action |
| --- | --- | --- |
| Investigation library | "Your investigations will appear here." | "Create a mystery →" button |
| Notes (new case) | Placeholder text in the textarea | — (cursor is ready) |
| Hints (none requested) | Explanatory paragraph about how hints work | "Reveal next hint" button |
| Evidence (none — should not occur with valid cases) | "No evidence available." | — |

#### 6.5.5 Onboarding walkthrough

The optional walkthrough appears as a positioned card overlay (not a blocking modal) on first case entry:

- **Title:** "Your first investigation"
- **Body:** Concise explanation of the four core actions (inspect suspects, review evidence, save notes, ask for hints, make an accusation).
- **Actions:** "Got it" (dismiss) and "Skip walkthrough" (dismiss and suppress).
- The walkthrough must not block interaction with the investigation room.
- Users can re-enable it from the Preferences page ("Show walkthrough again").
- Walkthrough dismissal state persists in `localStorage` (`mystery-tutorial-complete`).

#### 6.5.6 Landing page design requirements

The landing page must:

1. Open with a hero section containing:
   - An eyebrow label (e.g., "YOUR NEXT GREAT MYSTERY").
   - A serif display headline conveying the core promise.
   - A one-paragraph description of the experience.
   - A primary "Create a mystery →" call-to-action button.
   - A "fictional cases only" trust badge.
2. Include an illustrative evidence-board visual (CSS-only, no external images required) that establishes the detective aesthetic.
3. Include a "How it works" section with three numbered steps (Create → Investigate → Decide), each with an icon, a heading, and a one-sentence description.
4. Include a footer with the brand, a fictional-content disclaimer, and copyright.
5. Include top-bar navigation with the brand, language picker, and links to Preferences, Library, and Create.

#### 6.5.7 Mystery creation page design requirements

The creation page must:

1. Display a split layout on desktop: an inspirational aside (headline, description, fictional-content note) and the creation form card.
2. Stack vertically on mobile with the form card taking full width.
3. Present the custom / random toggle as clearly labelled choice buttons.
4. Show the premise textarea only when "Your premise" is selected; hide it when "Surprise me" is selected.
5. Display real-time character count with a warning colour near the limit.
6. Show the privacy advisory ("Please do not enter passwords…") both near the premise field and below the generate button.
7. Clearly indicate the form step (e.g., "01 / 01") for future multi-step expansion.
8. Disable the generate button and show a spinner with "Building your case…" text during generation.
9. Preserve the user's premise text if generation fails so they can retry without re-typing.
10. Display validation and API errors inline as a styled error banner.

#### 6.5.8 Investigation room design requirements

The investigation room must:

1. Display a top bar with the brand, case title, case status (investigating / completed), language picker, and navigation links (Preferences, Library, Home).
2. Display the difficulty level as a pill badge in the top bar.
3. Display a case heading section with:
   - An eyebrow label (e.g., "CASE FILE / A7B3C1").
   - The case title in serif display typography.
   - The case brief / premise paragraph.
   - A "fictional case" stamp badge.
4. Display a case metadata grid with scene, location, date/time, and objective. On mobile, collapse from a 4-column row to a 2×2 grid.
5. Use an accessible tab bar for section navigation (Case, Suspects, Evidence, Notes, Hints).
6. Display a persistent accusation bar below the tab panel with a warning message and the accusation button. After completion, replace with a "Case completed ✓" indicator.
7. On the case resolution (post-accusation):
   - Display a coloured reveal banner (green-tinted for correct, amber-tinted for incorrect) with the result, the canonical culprit's name, and hint usage.
   - Below the banner, display motive, method, full solution explanation, and per-evidence reasoning with implication labels ("Supports the solution" / "Misleading clue" / "Weakens a suspect").
   - Provide actions to review evidence and return to the library.

#### 6.5.9 Library page design requirements

The library page must:

1. Display a heading with "Case files / private to this browser", the investigation count (implicit from the grid), a retention notice, and a "Create a mystery →" button.
2. Render investigations as a responsive card grid (auto-fill, minimum 250 px per card).
3. Each card must show: status badge (In progress / Completed), difficulty, language, title, brief, creation date, and action buttons (Continue / View results, Delete).
4. The delete action must use a browser-native confirmation dialog with a localized prompt.
5. Empty state: centered message "Your investigations will appear here" with a clear call to action.
6. Loading state: centered spinner with text.

#### 6.5.10 Evidence modal design requirements

The evidence modal must:

1. Open as a centred overlay with a backdrop blur.
2. Display the evidence type label, title, metadata (timestamp, source), description, and content.
3. For text-based evidence (messages, statements, documents, logs), render content in a styled block with a left border accent.
4. For image or CCTV evidence, display a placeholder pattern with a label ("AI-generated fictional evidence" or "Simulated CCTV evidence") and the content as descriptive text.
5. Include a footer with the "fictional" trust badge and a "Mark reviewed ✓" button.
6. The "Mark reviewed" button must be disabled if the evidence is already reviewed or if the case is completed.
7. Support keyboard dismissal (Escape) and focus trapping.

#### 6.5.11 Confirmation dialog design requirements

The accusation confirmation dialog must:

1. Open as a centred modal with a backdrop.
2. Display an icon, the accusation label, and the selected suspect's name in bold.
3. Re-state the finality warning.
4. Provide two actions: "Keep investigating" (secondary) and "Confirm accusation →" (primary).
5. Disable the confirm button and show a spinner during submission.
6. Support keyboard dismissal (Escape) and focus trapping.

#### 6.5.12 Error and loading state design requirements

- **Full-page loading:** Centred spinner with contextual label. Used during initial case load and generation redirect.
- **Full-page error (no data loaded):** Centred card with the error message, a "Try again" button, and a "Start another case →" link.
- **Toast error (data already loaded):** Fixed-position banner at the bottom of the viewport with the error message and a dismiss button. Must not obscure the accusation bar.
- **Inline error (form validation, API failure):** Styled banner with a left border accent inside the relevant section.
- **Generation-specific errors:** Preserve the user's premise, display a localized error message, and offer a retry. Special messaging for rate-limit errors ("Gemini is temporarily rate-limited… Wait for the provider retry window, then try again.").

#### 6.5.13 Responsive layout requirements

| Breakpoint | Layout behaviour |
| --- | --- |
| > 850 px (desktop) | Full multi-column layouts. Hero: 2-column. Create: 2-column. Investigation: 2-column panels where applicable. |
| 651–850 px (tablet) | Narrower columns, reduced padding, smaller card art. |
| ≤ 650 px (mobile) | Single-column stacked layouts. Tab bar scrolls horizontally. Navigation labels collapse to icons. Case metadata grid becomes 2×2. Modals become near-full-width. Accusation bar stacks vertically. |

All interactive elements must remain at least 44 × 44 CSS pixels (touch target) on mobile, or meet WCAG 2.2 Target Size requirements.

#### 6.5.14 Button hierarchy and interaction patterns

| Variant | Usage | Visual |
| --- | --- | --- |
| Primary (`button-primary`) | Main call-to-action (Create, Confirm, Continue) | Gold background, dark text |
| Outline (`button-outline`) | Secondary action (Keep investigating, Try again) | Transparent background, border, light text |
| Dark (`button-dark`) | Contextual action within panels (Make accusation) | Dark background, gold border, light text |
| Danger (`button-danger`) | Destructive action (Delete investigation) | Transparent background, red-tinted border and text |
| Disabled | Any variant while an operation is pending | Reduced opacity (≈ 0.48), `cursor: not-allowed` |

All buttons must have visible focus indicators (`outline: 2px solid var(--gold)`, offset 3 px).

#### 6.5.15 Preferences page design requirements

The preferences page must:

1. Provide a language selection with a descriptive explanation ("The interface and hints use this preference. Each investigation keeps the language it was created in.").
2. Provide a walkthrough toggle ("Show walkthrough again") that resets the `localStorage` flag.
3. Display a confirmation toast or inline label ("Preference updated in this browser") after a change.
4. Include a retention notice for anonymous investigations.

#### 6.5.16 Not-found page design requirements

The 404 page must:

1. Use the detective aesthetic (dark background, serif heading).
2. Display a themed title (e.g., "This page is off the record.") and a brief message.
3. Provide a "Return to the archive" link back to the landing page.

#### 6.5.17 Visual design acceptance criteria

- [ ] All pages use the documented palette, typography, and surface tokens consistently.
- [ ] Every interactive element has a visible focus indicator.
- [ ] All buttons follow the documented variant hierarchy.
- [ ] Loading, error, and empty states are implemented on every data-driven view.
- [ ] The investigation flow is completable without referencing external documentation.
- [ ] Evidence review progress is visible in the tab label.
- [ ] Hint usage count is visible in the hints panel.
- [ ] The accusation bar is visible without scrolling to the bottom of a long evidence list.
- [ ] The landing page hero, "How it works" section, and footer render correctly at all three breakpoints.
- [ ] The creation form preserves user input after a generation failure.
- [ ] Evidence modals trap focus and support Escape to close.
- [ ] The confirmation dialog re-states the selected suspect's name and the finality warning.
- [ ] The reveal banner visually distinguishes correct from incorrect outcomes.
- [ ] Library cards show status, difficulty, language, and creation date.
- [ ] Empty library displays a helpful message and a create action.
- [ ] Preferences page confirms changes with visible feedback.
- [ ] The 404 page uses the detective aesthetic and links back to the landing page.
- [ ] Touch targets on mobile meet the 44 × 44 px minimum.
- [ ] Responsive layouts follow the documented breakpoint behaviour.

---

## 7. Localization: English, Hindi, and Hinglish

Localization is an MVP requirement.

### 7.1 Supported languages

| Language | Locale identifier | Writing system |
| --- | --- | --- |
| English | `en` | Latin |
| Hindi | `hi` | Devanagari |
| Hinglish | `hinglish` | Romanized Hindi |

Hinglish is a product-specific language option rather than a standard locale.

### 7.2 Language behavior

The language selector must be accessible from the landing page and investigation interface.

When the language changes, the application must:

- Update interface labels.
- Update navigation and button text.
- Use the selected language for newly generated mysteries.
- Display hints and explanations in the selected language.
- Preserve the underlying case identity, culprit, evidence IDs, and game state.
- Avoid silently regenerating a case merely because the display language changed.

The selected language must persist across refreshes.

### 7.3 Case language consistency

Each case has a canonical language.

A case must not unintentionally mix English, Devanagari Hindi, and Romanized Hinglish.

If translation is supported for an existing case, it must preserve:

- Suspect identities.
- Evidence identifiers.
- Timeline facts.
- Alibis.
- The canonical culprit.
- The underlying solution.
- The relationships between clues and the solution.

Translated text must not introduce new evidence or alter the logic of the case.

Translation must not overwrite the canonical solution.

### 7.4 Localization acceptance criteria

- Every visible interface string is localized.
- Language selection survives refresh.
- New cases use the selected language.
- Hindi renders correctly on supported desktop and mobile browsers.
- Hinglish uses Romanized Hindi consistently.
- Language changes do not reset investigation progress.
- Language changes cannot expose hidden solution data.
- Error messages and validation feedback are localized.
- Missing translations fall back gracefully rather than displaying undefined values.

---

## 8. Mystery Generation

### 8.1 Supported categories

The MVP should support a manageable selection, such as:

- Locked-room mysteries.
- Art thefts.
- Disappearances.
- Historical mysteries.
- Fictional espionage.
- General detective cases.

All cases must be fictional.

The application must not generate real-person criminal accusations presented as factual claims.

### 8.2 Difficulty levels

Difficulty affects clue subtlety, reasoning complexity, and the amount of guidance.

| Difficulty | Intended audience | Evidence count | Hint guidance |
| --- | --- | ---: | --- |
| Easy | Beginners | 4–5 items | More explicit |
| Medium | Regular players | 6–7 items | Moderate |
| Hard | Experienced players | 8–10 items | Subtle |

The difficulty-specific evidence counts above are authoritative.

An evidence item is a distinct, player-investigable piece of information. Repeating the same clue in multiple formats does not increase the count.

The final count must be validated server-side.

### 8.3 Case content requirements

Each generated case must contain:

- Unique case identifier.
- Title.
- Short premise.
- Canonical language.
- Difficulty.
- Case length.
- Fictional setting.
- Suspects with stable IDs.
- Suspect statements and alibis.
- Evidence items with stable IDs.
- A canonical culprit.
- A canonical solution.
- Supporting evidence references.
- A coherent explanation of the culprit's actions.
- Sufficient evidence to distinguish the culprit from innocent suspects.

Where appropriate, cases should also contain:

- Locations.
- Timeline events.
- Contradictions.
- Misleading but fair clues.
- Relevant relationships between suspects.

Red herrings must not contradict the canonical truth without a coherent explanation.

### 8.4 Case length

The MVP supports Short, Medium, and Long cases.

Case length controls narrative detail and investigation complexity, but must not violate the evidence-count rules for the selected difficulty.

The exact content limits must be configured and documented rather than left entirely to the model.

### 8.5 Canonical solution consistency

The canonical solution must be established before gameplay begins.

The solution must identify:

- The culprit.
- The method.
- The relevant timeline.
- The motive when appropriate.
- The evidence supporting the conclusion.
- The explanation for major contradictions.

A mystery is invalid if its own evidence materially contradicts its solution without explanation.

### 8.6 Structured generation and validation

The backend must request structured output from Gemini.

Validate the returned data against a server-defined schema.

Validation must include:

- Required fields.
- Field types.
- String-length limits.
- Valid difficulty and language values.
- Unique suspect and evidence IDs.
- Evidence counts appropriate to difficulty.
- Valid solution references.
- Valid suspect references.
- Valid evidence-to-solution references.
- Bounded list sizes.
- Plausible timeline structure where applicable.
- Consistency between culprit, statements, timeline, and evidence.

Schema validation alone is insufficient to prove logical consistency.

The backend must perform deterministic consistency checks and reject cases with unresolved critical contradictions.

Do not expose a partially generated or invalid case to the player.

### 8.7 Bounded retries

Generation must have a finite, documented retry policy. Retryable 429/5xx responses must wait at least the provider's `Retry-After` duration before another attempt.

- Maximum: three total generation attempts, including the initial attempt.
- Use bounded request timeouts.
- Apply bounded backoff between retryable failures.
- Retry only appropriate transient errors.
- Do not repeatedly retry permanent authentication, permission, or invalid-request errors.
- Do not start unlimited parallel generation requests.
- Apply rate limits to case creation.

If all attempts fail, return a safe, understandable error and offer a retry action.

Do not fabricate a successful case response when generation fails.

A curated fallback mystery may be added later, but is not required for the MVP unless explicitly implemented and tested.

### 8.8 Generation reliability metrics

Record privacy-conscious operational metrics, including:

- Generation success and failure counts.
- Failure category.
- Generation latency.
- Retry count.
- Schema-validation failures.
- Logical-consistency rejection count.

Never log API keys, session tokens, or full sensitive user input.

Measure actual performance before establishing numeric service-level targets. Do not claim a success rate or latency target has been achieved without representative test data.

---

## 9. Investigation and Gameplay Rules

### 9.1 Evidence

Evidence must have stable identifiers and readable descriptions.

Each item should include:

- ID.
- Title.
- Description.
- Evidence category.
- Relevant case references.
- Optional timeline association.

Evidence may be reviewed more than once.

Reviewing evidence must not create new facts or alter the canonical solution.

### 9.2 Notes

Users can create, edit, and delete their private investigation notes.

Notes must:

- Persist after refresh.
- Be associated with the correct investigation.
- Be scoped to the current anonymous session or authenticated owner.
- Never be treated as authoritative case evidence.
- Never change accusation evaluation unless a future feature explicitly defines that behavior.

### 9.3 Progressive hints

Hints are an MVP feature.

Each case supports up to three ordered hints.

#### Hint 1: Nudge

Direct attention toward an existing relevant clue or contradiction.

#### Hint 2: Connection

Explain how two or more already available facts relate.

#### Hint 3: Strong hint

Narrow down the reasoning path without directly disclosing the culprit or canonical solution.

Hints must be grounded exclusively in the existing case data.

They must not invent evidence, introduce new suspects, modify alibis, or contradict the canonical solution.

Hints must not reveal facts that the player cannot obtain from the case.

The hint system must use prevalidated case data and deterministic templates or tightly constrained generation. It must not invoke an unrestricted chatbot that can independently invent evidence.

#### Hint state

The server must track which hints have been requested.

Repeated requests for the same hint must not consume additional hint levels or create inconsistent responses.

Hint usage must persist across refreshes.

### 9.4 Beginner onboarding

Provide an optional, skippable walkthrough. See §6.5.5 for detailed design requirements.

The walkthrough should explain:

1. How to inspect suspects.
2. How to review evidence.
3. How to save notes.
4. How to request hints.
5. How to submit a final accusation.

The walkthrough appears as a positioned card overlay (not a blocking modal) on first case entry. Users must be able to dismiss it immediately and access help later from the Case tab or Preferences page.

Do not require users to complete a tutorial before playing.

### 9.5 Accusation rules

The MVP permits exactly one final valid accusation per case.

The backend must:

1. Verify case access.
2. Validate the selected suspect.
3. Verify that the case is still investigable.
4. Evaluate the accusation against the canonical culprit.
5. Record the result.
6. Transition the case to its terminal state.
7. Reveal the canonical solution through an authorized response.

A valid accusation may be correct or incorrect.

**Both correct and incorrect valid accusations complete the investigation and reveal the canonical solution.**

Malformed or unauthorized requests must not count as accusations.

Repeated requests must not duplicate the result or alter the canonical solution.

The interface must clearly explain the finality of the action before submission.

### 9.6 Case resolution

The resolution is displayed inline within the investigation room as a reveal banner (see §6.5.8 for layout details).

The resolution view must display:

- Correct or incorrect accusation with visually distinct styling.
- Canonical culprit's name.
- Full solution explanation.
- Motive and method.
- Per-evidence reasoning with implication labels (supports the solution / misleading clue / weakens a suspect).
- Hint usage count.
- Case completion status.
- Actions to review evidence and return to the library.

The resolution must reference evidence already present in the case.

The MVP does not require a points-based scoring system.

A qualitative summary of the investigation is sufficient.

---

## 10. Anonymous Investigations and Persistence

Anonymous gameplay is required for the MVP.

### 10.1 Anonymous session

The backend must associate investigations with a secure anonymous session.

Use an appropriately generated session identifier and secure cookie configuration.

The session identifier must not contain user secrets or directly expose internal database identifiers.

### 10.2 Saved investigation library

Users must be able to view their investigations in a simple library.

Each entry should display:

- Case title.
- Difficulty.
- Language.
- Creation date.
- Current status.
- Continue or view-results action.

Case statuses are:

- `investigating`
- `completed`

A completed case cannot return to the investigating state through normal gameplay APIs.

### 10.3 Persistence

The backend must persist:

- Case metadata.
- Suspects and evidence.
- Notes.
- Reviewed-evidence state.
- Requested hints.
- Investigation status.
- Accusation result.
- Completion timestamp.
- Canonical solution in private storage.

Refreshing the page must not reset investigation progress.

### 10.4 Retention and deletion

Define a documented anonymous-session retention policy before production release.

Users must be informed when anonymous investigations expire.

Provide a way to delete an investigation or clear the anonymous investigation library.

Deletion must be owner-scoped and must not affect other users' data.

If a case is deleted, associated notes, progress, and private solution records must be handled consistently.

The implementation must not silently retain deleted case content indefinitely.

Authentication and cross-device synchronization are future-phase features.

---

## 11. Canonical Data Model

The following logical model is authoritative. Existing implementation names may differ, but their semantics must match.

### 11.1 MysteryCase

Stores player-visible case content and investigation metadata.

Fields include:

- `id`
- `ownerSessionId`
- `title`
- `premise`
- `category`
- `difficulty`
- `caseLength`
- `language`
- `suspects`
- `evidence`
- `timeline`
- `status`
- `createdAt`
- `updatedAt`
- `completedAt`

The model must not expose the canonical solution or hidden culprit information.

Any stored internal metadata must be separated from the public response schema.

### 11.2 PrivateSolution

Stores the canonical solution separately from player-visible case data.

Fields include:

- `caseId`
- `culpritSuspectId`
- `method`
- `motive`
- `timelineExplanation`
- `reasoning`
- `supportingEvidenceIds`
- `createdAt`

This collection or equivalent private storage must be inaccessible through ordinary player-facing case retrieval.

The backend must validate all referenced IDs.

### 11.3 InvestigationProgress

Stores player progress.

Fields include:

- `caseId`
- `ownerSessionId`
- `notes`
- `reviewedEvidenceIds`
- `requestedHintLevels`
- `status`
- `accusedSuspectId`
- `accusationCorrect`
- `completedAt`
- `createdAt`
- `updatedAt`

The accusation fields must remain unset until a valid accusation is submitted.

The stored accusation result must be immutable after completion through ordinary gameplay APIs.

### 11.4 Internal-only fields

Fields such as these must never be included in player-visible responses before reveal:

- Canonical culprit ID.
- Canonical solution.
- Hidden solution reasoning.
- Internal red-herring classification.
- Private model-validation notes.
- Internal prompt instructions.
- Provider debugging information.

Use explicit response DTOs or allowlists rather than relying on removal of a few known sensitive fields.

---

## 12. API Contract

Use the existing `/api/cases` route structure as the canonical MVP API contract unless the current project already has a fully implemented, documented `/api/v1` contract.

Do not introduce duplicate versioned routes merely for naming consistency.

If API versioning is added later, document compatibility and migration behavior.

### 12.1 Endpoints

#### Health

`GET /api/health`

Returns a minimal service-health response without revealing secrets, database credentials, or internal infrastructure details.

#### Create case

`POST /api/cases`

Accepts:

- Premise or random-generation request.
- Difficulty.
- Case length.
- Language.
- Category.

Returns a validated, player-safe case and initial investigation state.

#### List investigations

`GET /api/cases`

Returns only investigations belonging to the current authorized session.

#### Retrieve case

`GET /api/cases/:id`

Returns player-visible case content and authorized progress.

Before completion, it must not disclose the canonical solution.

#### Update progress

`PATCH /api/cases/:id/progress`

Updates permitted progress fields, such as notes and reviewed evidence.

The server must validate field types, lengths, IDs, and ownership.

Clients must not be allowed to set arbitrary completion or accusation fields.

#### Request hint

`POST /api/cases/:id/hints`

Accepts an allowed hint level and returns the corresponding evidence-grounded hint.

The server controls hint availability and progression.

#### Submit accusation

`POST /api/cases/:id/accusation`

Accepts a suspect ID.

The backend validates the accusation, evaluates it, completes the case, and returns the authorized result and solution.

#### Delete investigation

`DELETE /api/cases/:id`

Deletes an authorized investigation and its associated private data according to the retention policy.

### 12.2 Response consistency

Responses must use consistent JSON structures.

Successful responses must contain only documented fields.

Errors must provide:

- A stable error code.
- A safe, localized user-facing message where appropriate.
- A suitable HTTP status.

Internal stack traces, provider responses, secret values, and database details must not be returned to clients.

---

## 13. Security Requirements

Security requirements apply to every release.

### 13.1 Authentication and ownership

Although account authentication is deferred, anonymous session ownership is mandatory.

- Every private operation must verify session ownership.
- Case IDs must not bypass ownership checks.
- Private solution retrieval must be authorized.
- Completed cases must not be reopened through client-supplied state changes.
- Guessing another case ID must not reveal private data.

### 13.2 Secrets

- Gemini API keys remain server-side.
- Session secrets must be strong and unique.
- `.env` must not be committed.
- `.env.example` must contain variable names and safe placeholders only.
- Secrets must not appear in frontend bundles.
- Secrets must not appear in application logs or error responses.
- Production secrets must be configured through the hosting provider.

### 13.3 Session security

Use secure session mechanisms appropriate to the existing architecture.

For cookie-based sessions:

- Use `HttpOnly`.
- Use `Secure` in production.
- Apply an appropriate `SameSite` policy.
- Set explicit expiration.
- Validate session ownership on every private operation.
- Protect state-changing requests against cross-site request forgery as appropriate.
- Rotate or invalidate sessions when required by the security design.

### 13.4 Input validation

Validate all user input server-side.

Enforce:

- Request-size limits.
- Premise length limits.
- Valid enum values.
- Valid case and suspect identifiers.
- Note-length limits.
- Allowed progress fields.
- Hint-level limits.
- Accusation state rules.

Reject malformed requests safely.

### 13.5 Abuse protection

Apply rate limits to:

- Case generation.
- Hint requests.
- Accusation submission.
- Session creation where appropriate.

Use an appropriate store for the deployment topology.

In-memory rate limiting is acceptable for a single-instance MVP but does not provide shared limits across multiple backend instances.

If multiple instances are used, configure a shared rate-limit store before release.

### 13.6 Browser security

Apply appropriate security headers and a Content Security Policy compatible with the application.

Render user-generated text safely.

Do not insert untrusted input into HTML without appropriate sanitization.

Validate request origins and configure CORS explicitly.

Production CORS must not use unrestricted wildcard origins for credentialed requests.

### 13.7 Logging

Log useful operational information without recording:

- API keys.
- Session secrets.
- Cookies.
- Authentication tokens.
- Full private notes.
- Unnecessary personal data.
- Hidden solutions in routine production logs.

---

## 14. Privacy and Responsible AI

### 14.1 User disclosure

Before users submit custom premises, clearly explain that the premise is processed by an external AI provider.

Advise users not to enter passwords, private personal information, or sensitive real-world allegations.

### 14.2 Fictional content

Mysteries must be clearly presented as fiction.

The product must not present generated criminal allegations about identifiable real people as established facts.

Use fictional names and settings by default.

### 14.3 Data minimization

Collect only information needed for gameplay.

Anonymous sessions should not require unnecessary identity information.

Define retention, deletion, and logging behavior before production launch.

### 14.4 AI output safety

Treat AI output as untrusted input.

Validate generated content before storage or display.

Do not execute model-generated code, HTML, database queries, or commands.

Reject malformed or unsafe outputs.

---

## 15. Accessibility and Responsive Design

Target **WCAG 2.2 Level AA**.

### 15.1 Keyboard accessibility

- All essential controls must be keyboard-accessible.
- Focus order must be logical.
- Focus indicators must be visible.
- Dialogs must manage focus appropriately.
- Escape must close dismissible dialogs when appropriate.
- Focus must return to the triggering control after a dialog closes.

### 15.2 Screen readers

- Use semantic HTML.
- Label form fields.
- Provide accessible names for icon-only controls.
- Associate validation messages with relevant fields.
- Announce important asynchronous status changes.
- Use meaningful headings and landmarks.

### 15.3 Visual accessibility

- Maintain sufficient text contrast (minimum 4.5:1 for body text, 3:1 for large text).
- Do not communicate correctness using color alone. The reveal banner must include text labels ("Your deduction was correct" / "The evidence led somewhere else") in addition to colour differences.
- Support browser zoom and text scaling.
- Respect reduced-motion preferences via `prefers-reduced-motion: reduce`.
- Avoid tiny evidence text and overly dense layouts.
- All interactive elements must have a visible focus indicator (e.g., `outline: 2px solid var(--gold)`, offset 3 px).
- Touch targets on mobile must be at least 44 × 44 CSS pixels.

### 15.4 Responsive behavior

The interface must work on:

- Mobile phones.
- Tablets.
- Desktop screens.

Core gameplay must remain usable on narrow screens without requiring horizontal scrolling for ordinary content.

Evidence, notes, hints, and accusations must be accessible on mobile.

---

## 16. Error Handling and Operational Reliability

### 16.1 AI provider failure

If Gemini is unavailable:

- Return a safe, meaningful error.
- Preserve the user's submitted premise where appropriate.
- Offer a retry action.
- Prevent duplicate submissions caused by repeated clicks.
- Avoid infinite retry loops.
- Do not create a fake successful investigation.

### 16.2 Database failure

If the database is unavailable:

- Do not claim progress was saved.
- Return a safe error.
- Preserve recoverable client input where practical.
- Allow a retry when appropriate.
- Avoid exposing database credentials or internal topology.

### 16.3 Network failure

The frontend must distinguish loading, success, and failure states.

Repeated submissions must not create duplicate cases or accusations when idempotency is required.

Use idempotency keys or equivalent safeguards for operations where retries could duplicate persistent state.

### 16.4 Operational diagnostics

Provide sufficient logs and health checks to diagnose:

- AI provider failures.
- Database connection failures.
- Request validation failures.
- Rate-limit events.
- Unexpected server errors.

The health endpoint must not reveal sensitive internal configuration.

---

## 17. Testing Requirements

Testing must verify both technical correctness and actual gameplay behavior.

### 17.1 Unit tests

Test:

- Input validation.
- Difficulty rules.
- Language selection.
- Evidence-count enforcement.
- Hint progression.
- Accusation evaluation.
- State transitions.
- Public-response filtering.
- Solution access controls.
- Error mapping.

### 17.2 Integration tests

Test:

- Case creation and persistence.
- Database ownership checks.
- Progress updates.
- Notes persistence.
- Reviewed-evidence persistence.
- Hint persistence.
- Correct accusations.
- Incorrect accusations.
- Solution confidentiality.
- Repeat-accusation idempotency.
- Database failures.
- AI provider failures.

Use mocked AI responses for deterministic tests, but do not treat mocks as proof of live provider connectivity.

### 17.3 AI integration tests

Where credentials and quota permit, verify actual Gemini integration.

Check:

- Authentication.
- Model access.
- Structured generation.
- Valid output.
- Evidence counts.
- Logical consistency.
- Safe handling of HTTP 429 and 5xx responses.
- Timeout behavior.
- Retry limits.

If live tests cannot run, report them as unverified.

### 17.4 Browser tests

Verify the complete flow:

1. Open the application.
2. Select a language.
3. Create a mystery.
4. Inspect suspects and evidence.
5. Save notes.
6. Mark evidence reviewed.
7. Request hints.
8. Refresh the page.
9. Resume the investigation.
10. Submit a correct accusation in one case.
11. Submit an incorrect accusation in another.
12. Verify solution secrecy before accusation.
13. Verify the canonical solution after completion.
14. Confirm that completed cases cannot be reopened or modified improperly.

Also verify mobile layout, keyboard navigation, error states, and retry behavior.

### 17.5 Security testing

Test:

- Unauthorized case access.
- Unauthorized solution access.
- Cross-session data access.
- Malformed requests.
- Oversized inputs.
- Stored XSS attempts.
- CSRF protections where applicable.
- Rate-limit behavior.
- Secret exposure in frontend builds and logs.
- Dependency vulnerabilities.

---

## 18. Acceptance Criteria

The MVP is not complete until every required criterion below passes.

### Gameplay

- [ ] Users can start without registering.
- [ ] Users can generate a mystery from a premise.
- [ ] Users can request a random mystery.
- [ ] All three difficulty levels enforce their specified evidence counts.
- [ ] Generated cases have a coherent canonical solution.
- [ ] Invalid cases are rejected rather than presented as playable.
- [ ] Suspects and evidence have stable identifiers.
- [ ] Notes and reviewed evidence persist after refresh.
- [ ] Progressive hints remain consistent with existing evidence.
- [ ] A valid accusation completes the case.
- [ ] Both correct and incorrect accusations reveal the canonical solution.
- [ ] Repeated accusation requests cannot change the result.
- [ ] The solution remains hidden before a valid accusation.

### Localization

- [ ] English, Hindi, and Hinglish are available.
- [ ] Interface text is localized.
- [ ] New mysteries use the selected language.
- [ ] Language selection persists across refresh.
- [ ] Language changes do not reset case progress.
- [ ] Hindi and Hinglish text render correctly.

### Anonymous persistence

- [ ] Investigations are associated with the correct session.
- [ ] The investigation library shows active and completed cases.
- [ ] Users can resume an active case.
- [ ] Users cannot access another session's private investigations.
- [ ] Investigation deletion removes associated data according to policy.

### UX and accessibility

- [ ] The primary gameplay flow is understandable without a mandatory tutorial.
- [ ] Loading and error states are implemented on every data-driven view.
- [ ] Empty states display a helpful message and a clear next action.
- [ ] Retry actions work without creating duplicate records.
- [ ] The interface is usable on mobile and desktop at all documented breakpoints (§6.5.13).
- [ ] Essential controls work with a keyboard.
- [ ] All interactive elements have visible focus indicators.
- [ ] Dialogs have accessible names and focus handling (trap + Escape to close).
- [ ] Reduced-motion preferences are respected.
- [ ] Evidence review progress is visible in the tab label.
- [ ] Hint usage count is visible in the hints panel.
- [ ] The creation form preserves user input after a generation failure.
- [ ] The accusation confirmation dialog re-states the selected suspect's name.
- [ ] The reveal banner visually distinguishes correct from incorrect outcomes.
- [ ] Touch targets on mobile meet 44 × 44 px minimum.
- [ ] All §6.5.17 visual design acceptance criteria pass.

### Security and reliability

- [ ] Gemini credentials remain server-side.
- [ ] Public case responses never expose private solution data.
- [ ] Ownership checks apply to all private operations.
- [ ] Server-side validation rejects malformed requests.
- [ ] Rate limits protect expensive operations.
- [ ] AI failures produce safe, understandable errors.
- [ ] Database failures do not produce false success messages.
- [ ] No known unresolved critical or high-severity security vulnerabilities remain without documented risk acceptance.

### Build and deployment readiness

- [ ] Automated tests pass.
- [ ] Frontend production build passes.
- [ ] Backend starts successfully with documented configuration.
- [ ] Root, server, and client dependency audits are reviewed.
- [ ] `.env.example` matches required runtime variables.
- [ ] No secrets are included in frontend artifacts.
- [ ] CORS and frontend/backend origins are configured correctly.
- [ ] MongoDB Atlas connectivity is verified in the target environment.
- [ ] Live Gemini case generation succeeds in the target environment.
- [ ] Browser staging tests pass.
- [ ] Deployment and rollback instructions are documented.

A successful local build alone does not establish production readiness.

---

## 19. Environment Configuration

Document the actual environment variables used by the implementation.

Expected categories include:

- MongoDB connection string.
- Gemini API key.
- Session secret.
- Backend port.
- Frontend origin.
- Frontend API origin.
- Rate-limit configuration when applicable.
- Proxy configuration when applicable.

The exact variable names in `.env.example` must match the runtime code.

Never include real credentials in the example file.

For production:

- Configure frontend variables in Vercel.
- Configure backend variables in the backend hosting provider.
- Restrict CORS to the exact authorized frontend origin.
- Use HTTPS.
- Configure MongoDB Atlas access appropriately.
- Verify session cookie settings.
- Verify health checks and logs.
- Run a browser smoke test against the deployed staging environment.

Do not deploy automatically as part of ordinary feature implementation.

---

## 20. Future Authentication Design

Authentication is intentionally excluded from the MVP.

When implemented, it must include:

- Secure registration and login.
- Secure password hashing.
- Forgot-password flow.
- Time-limited, single-use reset tokens.
- Generic account-recovery responses that do not reveal account existence.
- Rate limits for login and recovery.
- Session rotation and logout.
- User-owned investigation libraries.
- Account deletion and associated-data handling.
- A documented process for transferring anonymous investigations to an account.

Account recovery must never expose existing passwords.

Anonymous investigations must not be silently lost during account creation.

---

## 21. Future Achievement Design

Achievements are optional and cosmetic.

Potential achievements include:

- First Case Solved.
- Evidence Collector.
- Solved Without Hints.
- Contradiction Finder.
- Master Detective.

Achievements must be based on verified server-side gameplay events.

They must not modify the canonical mystery solution.

Avoid introducing complex currencies, paid hints, streak pressure, or competitive ranking requirements into the MVP.

---

## 22. Future Interactive Evidence Board

A drag-and-drop evidence board is a future enhancement.

When introduced, it should allow players to:

- Pin suspects and evidence.
- Create connections between items.
- Add personal annotations.
- Organize their own theories.
- Review connections before making an accusation.

The board must remain optional.

The ordinary investigation interface must remain sufficient to solve every case.

The board must not reveal hidden relationships or the culprit automatically.

---

## 23. Development Principles

All future implementation work must follow these principles:

1. Treat this specification as the product source of truth.
2. Preserve existing working functionality.
3. Prefer small, testable changes.
4. Do not add features outside the agreed scope without justification.
5. Do not introduce unnecessary dependencies.
6. Never expose secrets.
7. Do not weaken validation to make tests pass.
8. Do not replace actual integration tests with mocks while claiming live verification.
9. Do not delete files without checking their references and purpose.
10. Update documentation when configuration or behavior changes.
11. Report verified results separately from assumptions.
12. Do not claim deployment readiness when critical checks remain unverified.

---

## 24. Definition of Done

The AI Mystery Room MVP is ready for release only when:

- All mandatory MVP features are implemented.
- All acceptance criteria pass.
- Mystery generation produces valid, logically consistent cases.
- Live AI and database integrations are verified in the target environment.
- Complete browser-based gameplay succeeds.
- Solution confidentiality and ownership controls are verified.
- Accessibility and responsive behavior are tested.
- Required builds and security audits are reviewed.
- Environment variables and deployment instructions are documented.
- No unresolved critical release blockers remain.

**Final product promise:** Every player can enter a fictional mystery, investigate at their own pace, receive help when needed, and uncover a coherent solution in their preferred language—without needing to register or learn a complicated interface.

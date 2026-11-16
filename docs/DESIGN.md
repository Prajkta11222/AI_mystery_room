# Design System & UI/UX Specifications — AI Mystery Room

**Document Version:** 2.1  
**Project:** AI Mystery Room  
**Status:** Implemented Baseline  
**Styling Framework:** Vanilla CSS (`client/src/styles.css`) + CSS Custom Properties  
**Iconography:** `lucide-react`  

---

## 1. Design Philosophy: "The Noir Case File"

The visual aesthetic of AI Mystery Room balances **classic detective noir intimacy** with **modern editorial minimalism**. 

- **Atmospheric Palette:** Dark, low-glare charcoal and slate tones paired with warm parchment highlights and forensic gold accents.
- **Editorial Typography:** High-contrast serif headlines evoke vintage casefiles and crime novels, paired with clean sans-serif body text and utilitarian monospace metadata.
- **Direct Tangibility:** Evidence items resemble tangible artifacts (police statements, wiretaps, CCTV log transcripts, dispatch messages) rather than generic web widgets.
- **Cognitive Clarity:** The interface minimizes visual noise during deep deduction, avoiding blinking badges, floating popups, or intrusive animations.

---

## 2. Design Tokens & Color Palette

All styling originates from root tokens defined in `client/src/styles.css`:

```css
:root {
  /* Surfaces & Backgrounds */
  --bg: #10100f;            /* Deep obsidian room background */
  --panel: #171715;         /* Primary container elevation */
  --panel2: #1d1d1a;        /* Secondary raised surface / controls */
  --line: #30302b;          /* Hairline border rule */

  /* Neutral Typography */
  --paper: #e8e4d9;         /* High-contrast off-white reading text */
  --muted: #95948a;         /* Secondary hints, timestamps, subtitles */

  /* Forensic Gold Accents */
  --gold: #d6b273;          /* Primary interactive amber / brand accent */
  --gold-dark: #aa8548;     /* Inset borders, inactive badges, tag rules */

  /* Semantic Alerts */
  --red: #c0524a;           /* Error border, real-person violation */
  --red-dim: #3a1f1c;       /* Error toast background */
  --green: #8fa876;         /* Solved case banner, valid state */
  --green-dim: #1e2a1a;     /* Solved reveal banner gradient start */

  /* Typography Families */
  --sans: 'DM Sans', sans-serif;
  --serif: 'Playfair Display', Georgia, serif;
  --mono: 'DM Mono', monospace;

  /* Transitions & Radii */
  --transition-fast: 0.15s ease;
  --transition-med: 0.25s ease;
  --radius-sm: 2px;         /* Crisp, square-cut architectural corners */

  /* Shadows */
  --shadow-modal: 0 32px 96px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.3);
  --shadow-card: 0 2px 12px rgba(0, 0, 0, 0.15);
}
```

---

## 3. Typography Hierarchy

| Role | Font Family | Weight | Size / Line-Height | Tracking | Usage |
|---|---|---|---|---|---|
| **Display Hero** | `Playfair Display` | 500 | `clamp(58px, 7vw, 86px)` / `0.98` | `-0.045em` | Landing headline ("Every clue has a story") |
| **Section Headings** | `Playfair Display` | 500 | `21px – 39px` / `1.08` | `-0.03em` | Case title, Room headings, Modal titles |
| **Body / Prose** | `DM Sans` | 400 | `12px – 15px` / `1.7 – 1.8` | Normal | Descriptions, suspect profiles, evidence content |
| **Buttons / Links** | `DM Sans` | 600 | `10px – 12px` / `1.2` | `0.01em` | Primary CTAs, tabs, selection cards |
| **Forensic Metadata** | `DM Mono` | 400 / 500 | `7px – 9px` / `1.4` | `0.08em` uppercase | Timestamps, IDs, status stamps, difficulty pills |

---

## 4. Key UI Components & Interaction Specifications

### 4.1 Brand Header (`Brand.jsx`)
- Displays the monogram square icon (`width: 30px; height: 30px`) bordered by `#59564c` with an amber interior glyph.
- Accompanied by uppercase tracked typography (`font-size: 13px; letter-spacing: 0.18em`).
- In live investigations, a glowing emerald indicator (`live-dot`) denotes the active session lease.

### 4.2 XSS-Safe PlainText Component (`PlainText.js`)
- Renders untrusted narrative strings (AI outputs, suspect dialogues, evidence text) strictly escaped as raw strings.
- Guarantees that injected `<script>` or `<img onerror>` tags are treated as plain text without HTML execution.

### 4.3 Investigation Tabs (`CaseRoom.jsx`)
- Sub-navigation bar switching between five focused workspaces:
  1. **Case (`case`):** Briefing, scene overview, incident datetime, location, primary objective.
  2. **Suspects (`suspects`):** Suspect list with roles, profiles, and alibis.
  3. **Evidence (`evidence`):** Evidence cards with review counter and completion progress bar.
  4. **Notes (`notes`):** Private free-text detective scratchpad with auto-save debounce (500ms).
  5. **Hints (`hints`):** Progressive three-tier hint disclosure interface.

### 4.4 Evidence Cards & Modal (`CaseRoom.jsx`)
- **Iconography by Type:**
  - `message`: `MessageSquareText` (chat transcript, intercepted SMS).
  - `statement`: `FileText` (formal witness interview).
  - `document`: `FileText` (contract, ledger, memo).
  - `image`: `ImageIcon` (crime scene photograph description).
  - `cctv`: `Video` (simulated surveillance log).
- **Review Status:** An unreviewed clue displays an arrow icon; upon review via modal, a green checkmark (`reviewed-mark`) confirms inspection.
- **Evidence Modal:**
  - Accessible dialog overlay with backdrop blur (`#080807c9`).
  - Strict keyboard trap (`Tab`, `Shift+Tab`) and `Escape` key dismiss.
  - "Mark as Reviewed" action button updates server state via `PATCH /api/cases/:id/progress`.

### 4.5 Accusation Bar & Confirmation Modal
- **Accusation Bar:** Sticky or bottom-pinned control displaying the currently selected suspect name in gold (`.accuse-selected-name`).
- **Confirmation Dialog (`confirm-card`):**
  - Triggered before any accusation mutation.
  - Displays selected suspect in bold, warning: *"This ends the investigation whether your accusation is correct or incorrect."*
  - Dual action buttons: "Keep investigating" (`button-outline`) and "Confirm accusation" (`button-primary`).

### 4.6 Truth Reveal Banner (`reveal-banner`)
- Displays immediately upon accusation response:
  - **Correct Deduction:** Green gradient border (`border-left: 3px solid var(--green); background: linear-gradient(120deg, var(--green-dim), #1a1b18)`).
  - **Incorrect Accusation:** Amber/rust gradient border (`border-left: 3px solid #c08040; background: linear-gradient(120deg, #2a221c, #1a1b18)`).
- Deconstructs the mystery across:
  - True culprit identity, motive, and method.
  - Full narrative explanation.
  - Clue link breakdown: tags each clue as `supports_culprit`, `weakens_suspect`, or `red_herring`.

---

## 5. Accessibility (A11y) & Usability Standards

1. **Target Sizing:** In mobile viewports (`max-width: 650px`), all interactive controls (buttons, links, select menus, modal close buttons) enforce a minimum touch target of `44px x 44px`.
2. **Focus Visibility:** Clear 2px gold focus ring with 3px offset (`:focus-visible { outline: 2px solid #e2c17f; outline-offset: 3px; }`).
3. **Contrast Compliance:**
   - Body text `#eeeae1` on `#10100f` yields contrast ratio `14.8:1` (exceeds WCAG AAA).
   - Muted text `#95948a` on `#171715` yields contrast ratio `4.9:1` (exceeds WCAG AA for normal text).
4. **Reduced Motion:** Full media query `@media (prefers-reduced-motion: reduce)` disables keyframe transforms, slide-ins, and fade animations, setting transition durations to `0.01ms`.
5. **Screen Reader Friendliness (WCAG 2.2 AA):**
   - Native semantic HTML (`<main>`, `<article>`, `<button>`, `<fieldset>`, `<legend>`, `<dialog>`), explicit ARIA attributes, and `.sr-only` utility text.
   - Dynamic route-based browser `<title>` management across all SPA pages (Landing, Create, Room with case title, Library, Preferences, 404).
   - `aria-live="polite"` regions announcing asynchronous state updates (notes saving status, progressive hint unlocks, and evidence review milestones).
   - Semantic `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, and `aria-valuemax` on the evidence progress indicator.
   - Contextual `aria-label` attributes on evidence cards, action buttons, and form inputs (`textarea[aria-label]`).

---

## 6. Responsive Breakpoint Matrix

| Viewport Width | Layout Mode | Adjustments |
|---|---|---|
| **> 850px** (Desktop) | 2-Column Split | Side-by-side hero art, split dossier panels, expanded metadata grid. |
| **651px – 850px** (Tablet) | Compact Grid | Narrowed margins, compressed file titles, single-column lower panels. |
| **<= 650px** (Mobile) | Single-Column Stack | Stacked layout, bottom-anchored accusation bar, expanded 44px touch targets, collapsed header labels. |

---

## 7. Localization UI Behavior

- **Scripts Supported:** Latin (English, Hinglish) and Devanagari (Hindi).
- **Layout Robustness:** Devanagari typography (`हिन्दी`) naturally has a taller vertical bounding box; line heights (`1.65 – 1.8`) provide ample breathing room to prevent diacritic clipping.
- **Dynamic Language Switcher:** Present on landing, creation, room topbar, and preferences page.
- **Translation Fallback Notice:** If dynamic translation fails on reveal, a non-intrusive warning informs the player that the explanation remains in its generation language.


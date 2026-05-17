# Freshr Frontend — Design Rules

> Local only. Never commit or push this file.

---

## Visual Language

- **Font stack:** `'IBM Plex Mono', monospace` for all UI text. `'Syne', sans-serif` for headings and display text.
- **Color tokens:**
  - `B = #000000` — black (borders, text, shadows)
  - `W = #FFFFFF` — white (backgrounds, inverse text)
  - `G = #84e487` — green accent (CTAs, highlights, active states)
  - `R = #FF4D4D` — red (destructive actions, errors)
- **Border style:** `2px solid #000` on interactive elements, `3px solid #000` on structural containers and page borders.
- **Box shadow style:** Always diagonal — `offset-x offset-y 0 color` (e.g. `4px 4px 0 #000`). Never blurred. The shadow sits bottom-right.

---

## Hover Effects

### Interaction Taxonomy

Every interactive element belongs to one of these types. The hover effect must match the type — not just signal "clickable."

| Type | Example | Hover effect |
|---|---|---|
| Trigger | CTA, Save, Delete, card | Lift (translate + shadow) |
| Navigation link | Back to dashboard, text links | Underline appears |
| Toggle | Grid/list, sidebar collapse | Background fill |
| Utility / icon | SHOW/HIDE, ⋮ menu | Color shifts to black |
| Input | Search bar, form fields | Border turns green |
| Non-interactive | Feature cards, stat blocks | **None** |

---

### Rule: match the affordance to the element type

Different elements communicate different things to the user. The hover effect should match what the element *does*, not just that it's clickable.

---

### 1. Action buttons (CTAs, submit, confirm, destructive)
**Effect:** Diagonal lift — `transform: translate(-3px, -3px)` + box shadow grows to compensate.

This mimics real-world physics (lifting an object from a corner) and matches the existing diagonal box shadow language. It signals "press me, something important will happen."

Applies to:
- All primary CTA buttons (Sign up, Log in, Send, Save, Generate quiz, etc.)
- Submit buttons on forms
- Confirm/Delete buttons in modals

Shadow adjustment on hover is proportional to button size (ratio: vertical padding ÷ 5.3 ≈ lift amount):
- Large buttons (`lg` prop, 16px padding): lift `3px`, shadow `4px → 7px`
- Normal buttons (10px padding): lift `2px`, shadow `4px → 6px`
- Small/compact inline buttons (Save, Cancel, Send — 10px padding but tight context): lift `1px`, resting shadow `1px`, hover shadow `2px`
- The lift amount always equals the shadow growth — this keeps the shadow anchor point visually fixed while the button rises.

On dark backgrounds (e.g. CTA section on landing page):
- Pass `onDark` prop — switches shadow color to `#ffffff` so the lift is visible.

---

### 2. Navigation links and back buttons
**Effect:** Underline appears on hover. No lift.

These are links, not actions. An underline is the universal signal for "this takes you somewhere." A lift would imply a weightier interaction than navigating back.

Applies to:
- "← Back to dashboard" in notebook and profile pages
- "← Back to login" on forgot password page
- Any text-based navigation link

---

### 3. Utility / icon buttons
**Effect:** Subtle color shift (e.g. text goes from `#888` to `#000`). No lift.

These are small helper buttons that don't drive a primary action. They should acknowledge the hover without demanding attention.

Applies to:
- SHOW/HIDE password toggles
- ⋮ (three-dot) menu button — gets a background fill
- Edit link in profile fields (already has underline)

---

### 4. Non-interactive elements (informational cards, decorative blocks)
**Effect:** None. Zero hover styling.

If an element is not clickable, it must give zero visual feedback on hover — no lift, no color change, no tint, nothing. Any hover effect, however subtle, signals interactivity to the user. A false affordance (hover animation on a non-clickable element) creates confusion when the click does nothing. This applies to landing page feature cards, "How it works" steps, stat blocks, and any other purely decorative or informational content.

---

### 5. Input fields (form inputs, search bar)
**Effect:** Border color shifts from black to green on hover. Returns to black on focus (typing) and on mouse leave.

- Default: `border: 2px/3px solid #000`
- Hover (not focused): `borderColor: #84e487`
- Focused/typing: `borderColor: #000` (green dismissed once user is actively typing)
- Transition: `border-color 0.15s`

**Exception — chat input:** The chat input at the bottom of the notebook page gets no hover effect. Its context (send button beside it, persistent workspace) already makes it obviously interactive. Applying green hover there would feel restless during active conversations.

**Why green, not grey:** Grey border signals disabled/unavailable in UI convention. Green is Freshr's "active, alive, go" color — it invites interaction without implying action weight.

**Implementation:** Use `onMouseEnter` (with `document.activeElement` check), `onMouseLeave`, and `onFocus` handlers on the input element directly.

---

### 6. Toggle / switch buttons (view toggles, tab nav)
**Effect:** Background fill on the inactive option only. No lift.

These communicate state, not action weight. The active state is already highlighted; the hover just previews the switch.

Applies to:
- Dashboard grid/list toggle
- ProfileSidebar PROFILE/ACCOUNT tabs

---

## Layout Rules

### Notebook page
- 3-column layout: `Tools (220px) | Chat/Quiz (flex) | Files (260px)`
- No section header labels (TOOLS, CHAT, FILES) — the content defines the sections
- Chat column header: current session name on the left, ⋮ menu on the right
- ⋮ dropdown: floats over content, `position: absolute`, anchored top-right of chat header
- Files column: drop zone acts as the section anchor — no separate header needed
- Bulk delete toggle lives above the file list, only visible when files exist

### General
- No emojis or icon substitutes anywhere in the UI
- Back buttons on in-app pages (Notebook, Profile) use text links, top-left
- Back links on auth pages (Login, Signup, Forgot Password, Reset Password) use text links at the bottom

---

## Button Tiers

Not everything that does something needs to look like a button. Visual weight must match the importance of the action. Four tiers:

| Tier | Visual style | Hover effect | Use for |
|---|---|---|---|
| 1 — Primary | Filled bg, black border, hard shadow | Lift (translate + shadow grows) | The most important action on screen. One per context. |
| 2 — Secondary | White bg, black border, hard shadow | Lift | Supporting actions that matter but don't compete — Cancel, Back |
| 3 — Ghost | Border only, no fill, no shadow | Lift (smaller — 1px lift, 1→2px shadow) | Low-priority actions that shouldn't draw the eye — Unarchive |
| 4 — Utility/control | No border, no shadow | Color shifts `#888 → #000`, or background fill | UI controls that are self-explanatory from context |

### Variant rules (Tier 1 & 2)

| Variant | Background | Text | Shadow color |
|---|---|---|---|
| Default | `#FFFFFF` | `#000000` | `#000000` |
| Primary | `#000000` | `#FFFFFF` | `#84e487` (green — black shadow would be invisible) |
| Danger | `#FF4D4D` | `#000000` | `#000000` |
| Green | `#84e487` | `#000000` | `#000000` |

Primary button uses `fontWeight: 600` (not 700) — white text on black renders heavier optically at the same weight.

### App button map

| Button | Tier | Variant |
|---|---|---|
| Log in, Sign up, Get started | 1 | Green |
| Save, Confirm, Create, Generate quiz | 1 | Primary (black) |
| Delete, Remove | 1 | Danger |
| Cancel, Back (as button) | 2 | Default |
| Unarchive | 3 | Ghost |
| SHOW/HIDE password toggle | 4 | Utility |
| ⋮ three-dot menu | 4 | Utility |
| Sidebar collapse/expand arrow | 4 | Utility |
| Grid/list view toggle | 4 | Control (background fill) |

### Google auth button

Intentionally outside this system. Full width, white background, black border, Google logo left-aligned. No shadow. Stands apart because it represents a third-party brand — it must not look like a Freshr primary action.

---

## Component Notes

### Btn.tsx (landing page)
- Has press effect (mousedown → `translate(2px, 2px)`, shadow shrinks)
- Has hover effect (lift)
- `outline` variant inverts to black on hover
- `green` variant darkens slightly on hover
- On dark backgrounds, pass `onDark` prop — switches shadow color to white

### Modals
- Backdrop: `rgba(0,0,0,0.5)`, `position: fixed; inset: 0`, `z-index: 2000+`
- Card: white bg, `2px solid #000`, `4px 4px 0 #000` shadow, `padding: 32px`, `maxWidth: 380px`
- **Clicking outside the modal (on the backdrop) always dismisses it** — attach `onMouseDown` to the backdrop div, `stopPropagation` on the card div
- **Exception:** Undismissable modals (e.g. Time's Up) do NOT get an `onMouseDown` backdrop handler — the user must take the required action

### ChatColumn session dropdown
- Opens on ⋮ click, closes on outside click
- "+ New chat" at top of dropdown
- Session list below, max height 220px with scroll
- Rename/delete buttons on each session are hover-reveal only
- Active session highlighted black with green left border

---

## Expandable Chip / Tag List Pattern

Used when a list of selectable tags might be too long to show all at once.

### Collapsed state
- Show up to 8 chips with a **max-width of ~120px** each — text truncates with `...` if too long
- This gives a consistent chip size so 2 rows fill predictably
- If there are more than 8 chips, show a `+x more` button at the end of the second row
- `+x more` is styled in `#666` with an underline — clearly different from the black-bordered chips

### Expanded state
- All chips appear inside a fixed-height scrollable box
- Chips have **no max-width** — text wraps naturally inside the chip if long
- A `× Collapse` button appears top-right of the section (utility hover: color shifts `#888 → #000`)

### Rules
- If all chips fit within 8, no expand/collapse button is shown — all chips are always visible
- The `+x more` text is the only expand trigger in collapsed mode (no separate "Show" button)
- Use this pattern anywhere a list of selectable tags could grow unbounded

---

## What Never Goes on GitHub
- `client/docs/` — all files in this folder are local only
- `CLAUDE.md` — project instructions for Claude, local only

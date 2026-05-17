# Quiz Generator — Notes

> Local only. Never commit or push this file.

---

## Build Log

### Done

| Date | What | Commit |
|------|------|--------|
| 2026-04-09 | Quiz Setup screen — topic chip selector (expandable), custom prompt input, settings dropdowns (questions / difficulty / timer / duration), generate button with disabled state | `eba7d1a` |
| 2026-04-09 | Previous Quizzes panel — quiz cards (date, score, difficulty badge, topic tags), empty state, selected card highlight | `eba7d1a` |
| 2026-04-09 | Previous Quiz Detail view — score summary, time taken, per-question breakdown with correct/wrong highlights, Retake Quiz button | `9099f26` |
| 2026-04-09 | Quiz Taking screen — full-screen exam overlay, one question at a time, dot navigation, progress bar, countdown/count-up timer, answer selection (toggle), footer nav (Prev / Exit / Next / Submit), Time's Up modal (undismissable), Unanswered Warning modal, Exit Confirm modal | `6b17cbc` |
| 2026-04-10 | Flag questions — ⚑ Flag/Flagged toggle per question (both exam + practice modes), amber dot in dot strip for flagged questions, flagged indices saved in attempt | pending commit |
| 2026-04-10 | Explanations — collapsible "Show Explanation" panel below answer options, practice mode only | pending commit |
| 2026-04-10 | Take to Chat — ghost button (practice mode only), closes quiz overlay, pre-populates chat input with formatted question block | pending commit |

### In Progress

Nothing currently in flight.

### Pending / TBD

- Wire quiz service to real backend API (currently mock only)
- Decide: question-by-question breakdown in detail view, or just score summary? (resolved: full breakdown, already built)
- How many topics shown before scroll? (resolved: expandable chip pattern, 8 collapsed / all expanded)

---

## Backend TODOs (mock → real wiring)

Features that work with localStorage now but need real backend work before going to production.

| # | Feature | Mock behaviour | What real backend needs |
|---|---------|---------------|------------------------|
| 1 | `QuizQuestion.explanation` | Hardcoded fake text generated in `generateFakeQuestions` in `quiz.mock.ts` | AI-generated explanation per question during quiz creation (Anthropic/RAG pipeline on the server) — `explanation` field on the question model |
| 2 | `QuizAttempt.flagged_questions` | Stored as part of the `QuizAttempt` object in localStorage | Add `flagged_questions` (array of int) column to quiz attempt DB model; persist on submit |
| 3 | Take to Chat — inject question | Pre-populates `ChatColumn` input field via `pendingChatInput` state in `NotebookPage`. User manually sends the message. | Same UI injection works. Optionally trigger an immediate AI response stream after injecting. |
| 4 | Practice mode attempts | Saves as a normal `QuizAttempt` in localStorage (same as exam mode) | Confirm with Safwan: should practice attempts (`timed: false`) be stored separately or flagged differently in the DB? Scoring still works the same way. |

---

## Screens

1. **Quiz Setup** — main landing when user clicks Quiz tab
2. **Quiz Taking** — active quiz screen
3. **Results** — shown after quiz ends (time up or submitted)
4. **Previous Quiz Detail** — shown when user clicks a past quiz card

---

## Quiz Setup Screen

### Layout
- 3-column: Options sidebar (tabs) | Quiz Setup (main) | Previous Quizzes (right panel)
- Files panel is hidden on the quiz tab — not needed here
- Main window content is centered with breathing room on both sides — nothing touching edges
- Four sections separated by horizontal dividers: Topics / Prompt / Settings / Generate button
- Generate Quiz button anchored at the bottom, always in the same position
- Three settings dropdowns (Questions, Difficulty, Timer) on one row
- Timer duration dropdown appears below Timer dropdown only when user selects Yes

### Topics
- App reads all documents in the notebook and extracts topics
- Topics section is collapsed by default — shows first 2-3 topics as a preview with a "Show" expand button
- Expanded state: fixed-height scrollable box, topics wrap into rows, ~3 rows visible before scroll
- Collapsed state still shows selected topics so user doesn't lose track of what they've checked
- User can select multiple topics
- Separate custom prompt input — user can type to describe what they want to be quizzed on
- These are two separate paths, not combined — checkbox selection and custom prompt are independent
- Generate button is disabled until user either selects at least one topic OR types a prompt

### Settings (all dropdowns, default shows "Select a...")
- **Number of questions** — 5, 10, 15, 20
- **Difficulty** — Easy, Medium, Hard
- **Timer** — Yes / No
  - If Yes → second dropdown appears: 5, 10, 15, 20 minutes
  - If No → quiz will show a count-up timer (how long the user is taking), no pressure

### Generate button
- Disabled if: no topic selected AND no prompt typed
- Enabled once either condition is met

---

## Previous Quizzes Panel (right column)

- Shows cards for each past quiz
- Each card shows: date, number of questions, difficulty, score (e.g. 8/10)
- Empty state: "No quizzes yet. Generate your first one."
- Clicking a card → main area changes to Previous Quiz Detail view

### Previous Quiz Detail view
- Replaces the setup column content (main area)
- Shows information about that quiz (questions, answers, score, etc.)
- Two actions: Retake Quiz | Back (returns to setup screen)

---

## Quiz Taking Screen

- Timed (count-up or countdown depending on setting)
- **If countdown runs out:** quiz stops, user is told "Time's up" and can only submit to see results
- User submits when done → goes to Results screen

---

## Results Screen

- Shown after every quiz end (submitted or timed out)
- Shows score and breakdown
- Two actions: Retake | Back to Main Window (quiz setup)

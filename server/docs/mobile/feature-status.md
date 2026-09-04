# Feature Status

This is a living snapshot of what actually works end-to-end vs. what's stubbed or
missing, so anyone picking up mobile work knows what's safe to build on. Update it when a
gap here gets closed or a new one opens — don't let it go stale the way a README
easily does.

## Fully wired (no stubs), on `main`

Notebook list (search/sort/archive/delete/swipe actions/usage cards), notebook create,
notebook header (rename/pin/archive/delete), archive banner, chat (send + SSE streaming
reply, multi-session per notebook with history/rename/delete and typewriter-revealed
replies), quiz (generate/take/review/retake), presentation (generate/view/edit
slides/export to PDF via `expo-print` + `expo-sharing`), audio transcription
(upload/poll/detail/notes/delete), account/profile, onboarding, all four auth screens,
server-file management (swipe-to-delete, multi-select batch delete).

## Branch-local, not on `main`

**Camera scan-to-notes** lives entirely on `feature/mobile-app`:
`server/notebooks/services/photo_scan.py`, `client/mobile/hooks/useScanNotes.ts`,
`client/mobile/lib/scanNotes.ts`, and `FRESHR_TIER_LIMITS.max_photos_per_scan` don't exist
on `main` at all. Don't report it as a mobile gap when working on `main` — it's simply on
a different branch. Once merged: batch-capture up to a per-tier photo limit, a review grid
with per-photo delete/retake, one multipart upload merged server-side into a single PDF
and run through the normal ingestion pipeline, all-or-nothing validation (a single bad
photo fails the whole batch with per-photo reasons).

## Known gaps

- **No automated tests** under `client/mobile` at all.
- **`eas.json`'s `submit.production` is an empty object** — store credentials aren't
  configured, so `eas submit` won't work as-is.
- **No presentation export to PPTX** — mobile only exports to PDF; PPTX generation
  (`pptxgenjs`) is web-only.
- **Payment/billing UI is web-only** — mobile's account screen explicitly defers billing
  to the web app rather than reimplementing the plan picker / Stripe flow natively.
- **Slide typography mismatch** (pre-existing, not a bug to fix casually): web drives
  slide text from a per-deck theme; mobile renders in the system font and exports PDFs in
  Courier New. See [Design System](design-system.md).

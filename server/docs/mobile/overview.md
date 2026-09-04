# Overview

`client/mobile` (`@freshr/mobile`) is the FRESHR study platform's native app: Expo SDK 56 +
React Native 0.85.3, using `expo-router` for navigation, NativeWind v4 for styling, and
React Native Reusables (RNR, shadcn "new-york" style) for UI primitives.

It's one of three packages in the `client/` npm workspace, alongside `web` (the original
React/Vite frontend) and `shared` (`@freshr/shared` — platform-agnostic services and
types). Mobile and web both call the same Django REST API and share the same brand, but
they are two separate builds with no code-sharing beyond `@freshr/shared`'s service layer.

## What it shares with web

- All business logic and API calls: every domain (auth, notebooks, chat, quiz,
  presentation, transcription, account, payment, policy) goes through a
  `createXService(deps)` factory in `@freshr/shared`, which mobile and web each wire up to
  their own platform adapter (axios vs. axios, SecureStore vs. sessionStorage, etc.). See
  [Data Layer & State](data-layer.md).
- The same brand palette and typography, mapped 1:1 through a generated design-token
  layer. See [Design System](design-system.md).

## What's mobile-only or web-only

- Mobile has camera scan-to-notes (branch-local — see [Feature Status](feature-status.md))
  and native audio-transcription upload with progress.
- Web has the full billing/payment UI (plan picker, Stripe redirect pages) and
  presentation export to PDF/PPTX via browser libraries (`jspdf`, `pptxgenjs`,
  `html2canvas`, `reveal.js`). Mobile's presentation export is PDF-only, via
  `expo-print` + `expo-sharing`, and its account screen explicitly defers billing to web.

## Where to start

To actually run the app, see `client/mobile/README.md` in the repo — this site is the
reference material, not the quickstart.

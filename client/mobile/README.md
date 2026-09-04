# FRESHR — Mobile

Expo / React Native app for the FRESHR AI study platform, built with `expo-router`,
NativeWind, and React Native Reusables.

---

## Prerequisites

- Node + npm, and the whole `client/` workspace installed (`npm install` from `client/`,
  not from `client/mobile/` — this package has no standalone lockfile).
- Xcode (for the iOS Simulator) and/or Android Studio (for the emulator).
- The Django backend running locally (see the root `CLAUDE.md`), or point at a deployed
  environment via `EXPO_PUBLIC_API_BASE_URL`.
- A `.env.local` in `client/mobile/` (git-ignored) if you need Google Sign-In or the
  contact form working locally:

  ```
  EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
  EXPO_PUBLIC_WEB3FORMS_ACCESS_KEY=...
  ```

  Without the Google client IDs set, the "Continue with Google" button just hides itself
  — everything else works fine.

## Getting started

```bash
cd client/mobile
npx expo start        # or: npm run dev (same thing, plus -c to clear the Metro cache)
```

Then press `i` for the iOS Simulator or `a` for the Android emulator.

**Physical devices via Expo Go won't work** — Expo Go is capped at SDK 54 and this app is
SDK 56. Development happens in the Simulator/emulator; a real device needs a dev build
(`npx expo run:ios` / `run:android`), which is also required for Google Sign-In (Expo Go
blocks it outright with an in-app alert, since Google rejects its `exp://` redirect URI).

## Project layout

```
client/mobile/
  app/                    — expo-router screens (file-based routing)
    (auth)/                 login, register, forgot-password, verify-email
    (app)/
      notebooks/            index, [id], create modal, chat, quiz, presentation, transcription
      account/
    onboarding.tsx
  components/             — screen composites, by domain (notebook/, chat/, auth/, ui/)
  hooks/                  — use<Domain>Service wrappers around @freshr/shared, useFileUpload, etc.
  lib/                    — deps.ts (service DI), http.ts, session.ts, design/ (design tokens)
  context/AuthContext.tsx — the app's one React context
```

Business logic and API calls live in `@freshr/shared` (`client/shared/`), not here —
mobile only wires that shared layer up to its own HTTP client and session store. See
`hooks/use<Domain>Service.ts` for the pattern, and `lib/deps.ts` for what gets injected.

## Docs

For the deeper reference material — architecture, the design token system, auth flow,
current feature status, and how to build/release without EAS — see the **Client / Mobile**
section of the FRESHR docs site (`server/mkdocs.yml`, served at `http://localhost:8001`
via the local Docker stack):

- [Overview](../../server/docs/mobile/overview.md)
- [Architecture & Navigation](../../server/docs/mobile/architecture.md)
- [Design System](../../server/docs/mobile/design-system.md)
- [Data Layer & State](../../server/docs/mobile/data-layer.md)
- [Auth](../../server/docs/mobile/auth.md)
- [Feature Status](../../server/docs/mobile/feature-status.md)
- [Build & Release](../../server/docs/mobile/build-release.md)
- [Troubleshooting](../../server/docs/mobile/troubleshooting.md)

## Useful scripts

| Script | What it does |
|---|---|
| `npm run dev` | `expo start -c` |
| `npm run tokens` | Regenerate `global.css` / `lib/theme.ts` / the Tailwind tokens module from `lib/design/tokens.ts` |
| `npm run tokens:check` | Fail if the generated files are out of sync with `tokens.ts` |
| `npm run check:tokens` | Fail if any hex colour outside the documented allowlist is used |
| `npm run typecheck` | `tsc --noEmit` |

No automated test suite exists for mobile yet.

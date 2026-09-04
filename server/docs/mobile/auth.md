# Auth

## Session state

`context/AuthContext.tsx` is the app's only React context. It hydrates the session from
SecureStore once at launch, then mirrors it into React state: `isLoggedIn` is derived from
whether an access token is present in `mobileSessionStore`, and the store's
`subscribeToSession` listeners bump a tick counter to force a re-read whenever a
non-React writer (the axios interceptor) changes tokens.

`onboarding` is tracked separately as `'loading' | 'unknown' | OnboardingStatus`, because
the `onboarding_completed` flag isn't part of the cached account and has to be fetched
from `/accounts/me/`. It's re-fetched exactly on login-state transitions (tracked via a
ref, not on every session tick), and reset to `'unknown'` on logout.

See [Architecture & Navigation](architecture.md) for how `onboarding` and `isLoggedIn`
drive the route guard.

## Email/password

Standard JWT flow through `@freshr/shared`'s `auth` service: access tokens live 60
minutes, refresh tokens 1 day (server-side config). See
[Data Layer & State](data-layer.md#http-client-and-auth-refresh) for the refresh
interceptor.

## Google Sign-In

`components/auth/GoogleSignInButton.tsx` uses `expo-auth-session`'s Google provider,
configured from `EXPO_PUBLIC_GOOGLE_{IOS,ANDROID,WEB}_CLIENT_ID` (read via
`app.config.ts` → `Constants.expoConfig.extra`). The button hides itself entirely if none
of those are set, so a dev build without OAuth configured doesn't show a button that can't
work.

**Expo Go is explicitly blocked.** Google rejects Expo Go's `exp://` redirect URI (and
Expo's old auth proxy that used to work around this is gone), so the button detects
`Constants.executionEnvironment === 'storeClient'` and shows an alert telling the
developer to run a dev build (`npx expo run:ios` / `run:android`) instead of launching a
flow that would just fail with a confusing error.

On success, the access token is exchanged for FRESHR JWTs via the shared `googleLogin`
service. New users have no profile yet — their Google name/picture are stashed
(`setGoogleProfile`) for the onboarding form to prefill, and the route guard (not the
button) sends them to `/onboarding`; existing users are routed straight to `/notebooks`
from the button itself, since routing eagerly avoids flashing the tabs before a redirect
that wouldn't happen anyway.

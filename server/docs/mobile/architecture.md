# Architecture & Navigation

## Root layout

`app/_layout.tsx` composes, outside-in:

```
GestureHandlerRootView → ThemeProvider (react-navigation) → AuthProvider → RootNavigator → PortalHost
```

`RootNavigator` waits on two things before it renders the real `<Stack>`: the session
being hydrated (`ready` from `AuthProvider`) and the Instrument Sans font faces loading.
Until both are ready it shows a centered `ActivityIndicator`. A font load failure is
treated as cosmetic — it logs a warning and falls through to the system font rather than
blocking the app.

## Route protection

A `useProtectedRoute` effect, keyed on `expo-router`'s `useSegments()`, does all redirect
logic in one place (no per-screen guards):

| State | Destination |
|---|---|
| Not ready (session still hydrating) | nothing — hold on the spinner |
| Not logged in | `/login` (unless already in the `(auth)` group) |
| Logged in, onboarding status still loading/unknown | nothing — hold, so the app tabs never flash before bouncing to onboarding |
| Logged in, onboarding incomplete or the status check errored | `/onboarding` (hard gate, unless already there) |
| Logged in, onboarding complete | `/notebooks` (out of the auth/onboarding screens) |

Onboarding status isn't part of the cached session, so `AuthContext` fetches it from
`/accounts/me/` whenever login state flips from logged-out to logged-in, and exposes it
as `onboarding: 'loading' | 'unknown' | OnboardingStatus`.

## Route groups

- **`(auth)`** — login, register, forgot-password, verify-email. Plain `Stack`, no tabs.
- **`(app)`** — a `Stack` containing `notebooks` (its own nested `Stack`: `index`, `[id]`,
  `create` modal, `chat`, `quiz`, `presentation`, `transcription`) and `account`.
- **`onboarding.tsx`** sits outside both groups — it's a hard gate a logged-in user with an
  incomplete profile can't route around.

## Bottom navigation

There is no tab bar. `components/notebook/bottomNav.tsx` is a floating icon pill
(Linear-style): fixed **Files** and **Chat** slots, plus a third slot that opens a
dropdown listing every section (Files / Chat / Quiz / Presentation / Audio Transcription /
Account). When a tool screen is active, that third slot adopts the tool's own icon plus a
small chevron, so the bar always reflects where you are.

Active state is derived entirely from `usePathname()` — never from local state or which
tab was tapped last — so it's always correct after a deep link or back-navigation.
Section hops use `router.replace`, not `push`, so the tool screens don't pile up in the
back stack.

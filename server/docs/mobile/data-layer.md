# Data Layer & State

## Service wiring

`lib/deps.ts` assembles a **module-level singleton** `ServiceDeps` object — unlike web,
which builds it via a `useFreshrServiceDeps` hook per render tree:

```ts
export const deps: ServiceDeps = {
  http: mobileHttpClient,      // axios instance
  session: mobileSessionStore, // SecureStore-backed
  config: appConfig,           // Expo env config
  stream: mobileStreamClient,  // react-native-sse
};
```

Every domain gets a one-line hook in `hooks/use<Domain>Service.ts`:

```ts
export function useNotebookService() {
  return useMemo(() => createNotebookService(deps), []);
}
```

Screens call these hooks and never construct a service or touch `deps` directly. Because
`deps` is a singleton, there's no per-screen DI-assembly step the way there is on web.

## HTTP client and auth refresh

`lib/http.ts` builds one shared axios instance (`baseURL` from `appConfig.apiBaseUrl`,
15s timeout) and adapts it to the shared `HttpClient` contract, dispatching on method the
same way web's `createAxiosHttpClient` does — including reading `err.response` the same
shape, so the shared services behave identically on both platforms.

Two interceptors:

- **Request** — attaches `Authorization: Bearer <token>` from the session mirror on every
  call.
- **Response** — on a `401` with a refresh token available, exchanges it via a *bare*
  (non-intercepted) axios call to `/auth/refresh/` so the refresh call itself can't
  recurse into another 401 handler, replays the original request with the new access
  token, and on failure clears tokens + identity + ends the session. That session-end
  notifies `AuthContext`'s subscribers, which is what actually bounces the app back to
  `/login` — the interceptor itself never touches navigation.

## Session store

`lib/session.ts`'s `mobileSessionStore` is the mobile implementation of the shared
`SessionStore` port. `expo-secure-store` is async-only, but the shared services call the
store synchronously (`getAccessToken()`, etc.), so the store keeps an **in-memory mirror**
as the real source of truth: `hydrateSession()` loads it from SecureStore once at launch
(awaited before `AuthProvider` marks itself `ready`), and every setter updates memory
first, then writes through to SecureStore fire-and-forget.

A small `subscribeToSession` listener set is how non-React code — chiefly the axios 401
interceptor — notifies the React tree when auth state changes without needing to reach
into a component tree it has no access to.

## Polling

There's no websocket/push layer for async jobs — screens poll on a plain `setInterval`
while a job is in flight, and stop as soon as nothing is pending:

- **Presentation generation** (`app/(app)/notebooks/presentation.tsx`) — every 3000ms,
  while any presentation is `QUEUED` or `GENERATING`.
- **Audio transcription** (`app/(app)/notebooks/transcription.tsx`) — on a shared
  `LIST_POLL_INTERVAL_MS` constant, while any transcript is `pending`/`processing` or its
  notes are `processing`; the upload flow additionally polls a single transcript until
  done, up to a 10-minute timeout.

## File uploads bypass the shared client

`hooks/useFileUpload.ts` (and the photo-scan upload, on `feature/mobile-app`) call axios
directly instead of going through `mobileHttpClient` / the shared `HttpClient`, because
`HttpClient.request` has no `onUploadProgress` hook and these screens need upload
progress bars.

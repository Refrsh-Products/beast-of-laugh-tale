# Freshr — Frontend

React + TypeScript + Vite frontend for the Freshr AI learning platform.

---

## Getting started

```bash
cd client
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

---

## Mock vs Real backend

The frontend has two data modes controlled by a single environment variable: `VITE_USE_MOCK`.

| Mode | What it does |
|------|-------------|
| `true` | Uses fake data stored in `localStorage` — no backend needed |
| `false` | Makes real HTTP calls to the Django backend at `VITE_API_BASE_URL` |

### Default behaviour

- `npm run dev` → **mock mode on** (via `.env.development`)
- `npm run build` → **real API** (via `.env.production`)

### How to switch to real backend (Safwan / backend devs)

1. Create a file called `.env.local` in the `client/` folder (this file is git-ignored, so it only affects your machine):

```
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:8000
```

2. Make sure the Django backend is running (see `server/` README or use Docker).
3. Run `npm run dev` as normal — login and all notebook actions will hit the real API.

No code changes needed. Delete `.env.local` to go back to mock mode.

---

## Project structure

```
client/
  src/
    storage.ts                  ← localStorage types and helpers (used by mock services)

    services/
      auth/
        AuthService.types.ts    ← interface that both mock and API implement
        AuthService.mock.ts     ← fake auth using localStorage
        AuthService.api.ts      ← real HTTP auth calls
        index.ts                ← picks mock or API based on VITE_USE_MOCK
      notebooks/
        NotebookService.types.ts
        NotebookService.mock.ts
        NotebookService.api.ts
        index.ts

    components/
      dashboard/
        DashboardHeader.tsx     ← search bar + grid/list toggle
        NotebookCard.tsx        ← grid view card
        NotebookRow.tsx         ← list view row
        CreateCard.tsx          ← "new notebook" card (grid)
        CreateRow.tsx           ← "new notebook" row (list)
        NotebookMenu.tsx        ← three-dot dropdown
        MenuRow.tsx             ← single item inside the dropdown
        CreateNotebookModal.tsx ← create dialog
        DeleteNotebookModal.tsx ← delete confirm dialog
        ArchivedSection.tsx     ← archived notebooks block
      sidebar/
        ProfileMenuItem.tsx     ← item in the profile dropdown
      login/
      loading/

    page/
      LoginPage.tsx
      LandingPage.tsx
      dto/                      ← TypeScript shapes for API responses

    DashboardPage.tsx           ← main page (state + handlers only, ~200 lines)
    OnboardingPage.tsx
    Sidebar.tsx
```

---

## How pages use data

Pages import from the service index files — they never import `storage.ts` directly or call axios directly:

```ts
import authService from './services/auth'
import notebookService from './services/notebooks'

// Works in both mock and real mode:
await authService.login(email, password)
const notebooks = await notebookService.list()
```

The service index (`services/auth/index.ts`) reads `import.meta.env.VITE_USE_MOCK` and exports either the mock or the API implementation. Pages don't know or care which one they get.

---

## Adding a new API endpoint

1. Add the URL to `services/freshr-api.ts`
2. Implement the method in the relevant `*Service.api.ts` file
3. Add the same method signature to the `*Service.types.ts` interface
4. Add a matching mock in `*Service.mock.ts` (can just return `Promise.resolve()`)

---

## Environment files

| File | Purpose | Git-tracked? |
|------|---------|-------------|
| `.env.development` | Mock mode on for `npm run dev` | Yes |
| `.env.production` | Real API for builds | Yes |
| `.env.local` | Your personal overrides (e.g. switch to real API locally) | No — git-ignored |

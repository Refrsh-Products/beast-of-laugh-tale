# FRESHR Testing Conventions

**Stack baseline:** Django 6.0.1 · Celery 5.6 · Redis 7 · PostgreSQL 16 + pgvector · Anthropic · Gemini · ZiniPay · React 19 · TypeScript · Vite 7

This document defines how tests are written, where they live, what tooling is used, and what the CI pipeline enforces. It is grounded in the current state of the repo: as of writing, `requirements.txt` contains no test dependencies, `package.json` contains no test scripts, no CI workflows exist, and both `notebooks/tests.py` and `rag/tests.py` are effectively empty stubs that must be deleted and replaced.

---

## 1. Tooling Decisions

### Backend

#### pytest-django

Use **pytest-django** as the test runner, not Django's built-in `manage.py test` / `django.test.TestCase`.

**Why:** The two main friction points in this codebase are (a) async code — `asyncio.run()` is called inside Celery tasks (`rag/tasks.py:16`) and views (`chats/services/rag_retrieval_service.py:12`) — and (b) the need to mock a large number of external services (Anthropic, Gemini, Google OAuth, ZiniPay, PGVector). pytest's fixture system and `pytest-asyncio` handle async cleanly. pytest's `monkeypatch` and `unittest.mock.patch` work identically to Django TestCase but compose better across fixtures. `pytest-django` wraps every test in a transaction by default (`@pytest.mark.django_db(transaction=False)`), which is faster than Django's `TransactionTestCase`. For Celery task tests that need `ALWAYS_EAGER`, pytest fixtures make it trivial to scope that setting to only the tests that need it.

#### factory_boy

Use **factory_boy** for all test object creation.

**Why:** The alternative — calling `Model.objects.create(...)` directly in every test — requires repeating required fields (e.g., `Account` has 7 non-null required fields) and makes refactoring painful. factory_boy integrates with Django ORM and supports `SubFactory`, `LazyAttribute`, and `RelatedFactory` which cover the chains here: `User → Account`, `User → Notebook → NotebookFile`, `Account → Payment`.

#### Coverage

Use **pytest-cov** (wraps `coverage.py`).

**Why:** It integrates with the pytest run directly (`pytest --cov`) and generates both terminal and HTML reports. No separate `coverage run` step needed in CI.

#### Async

Use **pytest-asyncio** for testing async service functions (`rag/services.py`, async RAG retrieval).

#### Install command

```bash
cd server
pip install \
  pytest==8.* \
  pytest-django==4.* \
  pytest-asyncio==0.24.* \
  pytest-cov==6.* \
  factory-boy==3.* \
  Faker==30.* \
  freezegun==1.* \
  responses==0.25.*
```

Add these to a `requirements-dev.txt` file (not `requirements.txt`, which is for runtime dependencies only):

```
# requirements-dev.txt
pytest==8.*
pytest-django==4.*
pytest-asyncio==0.24.*
pytest-cov==6.*
factory-boy==3.*
Faker==30.*
freezegun==1.*
responses==0.25.*
```

`responses` is used to mock `requests`-based HTTP calls (Google OAuth userinfo endpoint in `users/views.py:51`, ZiniPay API in `payments/views.py:75`). `freezegun` is used for subscription expiry date assertions in the payments tests.

---

### Frontend

#### Vitest (not Jest)

Use **Vitest** as the test runner.

**Why:** The project uses **Vite 7** (`vite.config.ts` is the single build config) and `"type": "module"` in `package.json`, meaning the entire codebase is native ESM. Jest requires a Babel transform pipeline and `jest.config` to handle ESM, TypeScript, and Vite-specific imports (like `@tailwindcss/vite`). Vitest reuses the existing `vite.config.ts` directly — no separate transform configuration is needed. It also supports the same `describe`/`it`/`expect` API as Jest, so switching costs are zero.

#### React Testing Library

Use **@testing-library/react** for component tests.

**Why:** It tests components through the DOM as a user would (queries by role, label, text), not by implementation details. This matches the level of testing needed for the notebook, chat, and auth components identified in `TEST_PLAN.md`.

#### MSW (Mock Service Worker)

Use **msw** for mocking API calls in frontend component tests.

**Why:** The frontend uses `axios` (`client/src/services/freshr-api.ts`) and all services go through it. MSW intercepts at the network layer — tests are not coupled to axios internals, and the same handlers can be reused for both component tests and Storybook if that's added later.

#### Playwright

Use **Playwright** for smoke E2E tests (the 5 defined in `TEST_PLAN.md` section 2).

**Why:** The project has no existing E2E setup. Playwright supports TypeScript natively, has a built-in test runner (`@playwright/test`), and can test SSE streaming responses — which is critical for `GET /chats/{id}/messages/stream/`. Cypress cannot test SSE well.

#### Install command

```bash
cd client
npm install --save-dev \
  vitest@3.* \
  @vitest/coverage-v8@3.* \
  @testing-library/react@16.* \
  @testing-library/user-event@14.* \
  @testing-library/jest-dom@6.* \
  jsdom@26.* \
  msw@2.*

# E2E only — install separately, don't block unit test runs
npm install --save-dev @playwright/test@1.*
npx playwright install chromium
```

---

### Performance

#### k6 (not Locust)

Use **k6** for load and stress testing.

**Why:** The two most important performance scenarios identified in `TEST_PLAN.md` are (a) concurrent SSE streams on `GET /chats/{id}/messages/stream/` (holding open HTTP connections) and (b) concurrent Celery ingestion tasks. k6 has first-class support for HTTP streaming and SSE via `http.get` with streaming enabled, and can model exactly N concurrent virtual users holding open connections. Locust is Python-based and handles streaming poorly — it accumulates the full response body before assertions. k6 scripts are JavaScript/TypeScript, which the team already writes.

```bash
# macOS
brew install k6

# Or via Docker (no install needed in CI)
docker run --rm -i grafana/k6 run - < scripts/load/chat_stream.js
```

---

### Fuzz Testing

#### Hypothesis (unit-level) + Schemathesis (API-level)

Use both.

**Hypothesis** for property-based testing of serializer validators, model methods, and the `separate_content_types` helper in `rag/services.py`. It generates inputs programmatically and shrinks failures automatically.

**Schemathesis** for API-level fuzz testing. The project uses `drf-spectacular` (`drf_spectacular` is in `INSTALLED_APPS`) and the schema is served at `GET /api/schema/`. Schemathesis reads that schema and generates valid and invalid inputs for every endpoint automatically — no manual fuzzing setup is needed.

```bash
# Add to requirements-dev.txt
hypothesis==6.*
schemathesis==3.*
```

```bash
# Run Schemathesis against the local dev server
st run http://localhost:8000/api/schema/ \
  --auth-type=jwt \
  --header "Authorization: Bearer <token>" \
  --checks all \
  --max-examples 100
```

---

## 2. Directory Structure

### Backend: centralized `tests/` directory

```
server/
├── tests/
│   ├── conftest.py                  # Root conftest: DB marker, shared fixtures
│   ├── factories.py                 # All factory_boy factories
│   ├── users/
│   │   ├── __init__.py
│   │   ├── test_registration.py
│   │   ├── test_login.py
│   │   ├── test_logout.py
│   │   ├── test_google_auth.py
│   │   └── test_password_reset.py
│   ├── accounts/
│   │   ├── __init__.py
│   │   └── test_account_api.py
│   ├── notebooks/
│   │   ├── __init__.py
│   │   ├── test_notebook_api.py
│   │   └── test_file_upload.py
│   ├── rag/
│   │   ├── __init__.py
│   │   ├── test_ingest_task.py
│   │   └── test_query_api.py
│   ├── chats/
│   │   ├── __init__.py
│   │   ├── test_chat_api.py
│   │   ├── test_message_api.py
│   │   └── test_stream.py
│   └── payments/
│       ├── __init__.py
│       ├── test_initiate.py
│       └── test_webhook.py
├── freshr/
├── users/
├── accounts/
...
```

**Why centralized over co-located:** The Django apps (`users/`, `accounts/`, etc.) each have an existing `tests.py` stub — but those stubs are broken and must be removed. Starting fresh with a centralized `tests/` directory gives three concrete benefits for this project's size:

1. All factories live in one `tests/factories.py` file. With 7 apps that have interrelated models (`User → Account`, `Account → Payment`, `User → Notebook → NotebookFile`), co-located factories would create circular import problems between app test files.
2. A single `conftest.py` at `tests/` scope can define `pytest.ini` settings, the `@pytest.mark.django_db` autouse marker, and shared fixtures like `auth_client` without any app knowing about another app's test utilities.
3. The broken `tests.py` stubs in each app (`notebooks/tests.py`, `rag/tests.py`, etc.) can be deleted cleanly. They are not discovered by pytest (which will be pointed at `tests/`) and will not produce false-positive passes.

After creating `tests/`, delete the stub files:

```bash
rm server/notebooks/tests.py
rm server/rag/tests.py
rm server/accounts/tests.py
rm server/users/tests.py
rm server/chats/tests.py
rm server/payments/tests.py
rm server/flashcard/tests.py
rm server/quiz/tests.py
rm server/presentation/tests.py
```

### Frontend: co-located `__tests__/` folders

```
client/src/
├── components/
│   ├── notebook/
│   │   ├── __tests__/
│   │   │   ├── ChatColumn.test.tsx
│   │   │   ├── FilesColumn.test.tsx
│   │   │   └── ChatMessage.test.tsx
│   │   ├── ChatColumn.tsx
│   │   └── FilesColumn.tsx
│   ├── dashboard/
│   │   ├── __tests__/
│   │   │   └── CreateNotebookModal.test.tsx
│   │   └── CreateNotebookModal.tsx
├── hooks/
│   ├── __tests__/
│   │   ├── useAuthService.api.test.ts
│   │   ├── useAxiosInterceptor.test.ts
│   │   └── useChatService.api.test.ts
│   └── useAuthService.api.ts
├── page/
│   ├── __tests__/
│   │   └── LoginPage.test.tsx
│   └── LoginPage.tsx
└── mocks/
    ├── handlers.ts                  # MSW request handlers
    └── server.ts                    # MSW server setup
```

**Why co-located for frontend:** The frontend has ~30 source files across components, hooks, and pages. At this size, co-located tests are easier to navigate — you see the test right next to the component it covers. A centralized `tests/` directory on the frontend would add a parallel mirrored tree with no benefit. The MSW mock handlers are the one exception: they live in `src/mocks/` (centralized) because they are shared across all component tests.

---

## 3. Naming Conventions

### Backend

**Test files:** `test_{thing_being_tested}.py` — named after the behaviour being tested, not the source file.

```
# Good
tests/users/test_registration.py
tests/payments/test_webhook.py
tests/chats/test_stream.py

# Avoid
tests/users/test_views.py       # too generic — views.py has 5 unrelated views
tests/tests_users.py            # wrong separator convention
```

**Test classes:** Use `class Test{Flow}` for grouping related scenarios. Classes are optional — use them only when multiple tests share a `setup` step (e.g., all webhook tests need a `Payment` object).

```python
class TestWebhookCompletedStatus:
    # all tests here share a pre-existing pending Payment

class TestWebhookInvalidPayloads:
    # all tests here test malformed input paths
```

If tests share no setup, write module-level functions — no class needed.

```python
# test_registration.py — no class needed
def test_register_success(api_client):
    ...

def test_register_duplicate_email(api_client, user_factory):
    ...
```

**Test functions:** `test_{condition}` or `test_{action}_{expected_result}`. Be concrete — state what the input condition is and what the expected output is.

```python
# Good
def test_register_returns_201_with_jwt_tokens(api_client):
def test_register_duplicate_email_returns_400(api_client, user_factory):
def test_webhook_completed_upgrades_account_tier_to_paid(api_client, payment_factory):
def test_ingest_task_sets_failed_status_on_exception(notebook_file_factory):

# Avoid
def test_register():        # no expected result
def test_webhook_ok():      # "ok" is not a behaviour
def test_error_handling():  # which error, which handler?
```

**Fixture functions:** Named after the object they return, optionally suffixed with `_factory` if they return a factory callable.

```python
@pytest.fixture
def user():                  # returns a single User instance
def auth_client(user):       # returns APIClient authenticated as user
def notebook(user):          # returns a Notebook owned by user
def notebook_file(notebook): # returns a NotebookFile in that notebook
def account(user):           # returns an Account linked to user
def payment(account):        # returns a Payment for that account
```

**Factory classes:** `{ModelName}Factory` in `tests/factories.py`.

```python
class UserFactory(factory.django.DjangoModelFactory):
class AccountFactory(factory.django.DjangoModelFactory):
class NotebookFactory(factory.django.DjangoModelFactory):
class NotebookFileFactory(factory.django.DjangoModelFactory):
class ChatFactory(factory.django.DjangoModelFactory):
class ChatMessageFactory(factory.django.DjangoModelFactory):
class PaymentFactory(factory.django.DjangoModelFactory):
```

### Frontend

**Test files:** `{ComponentName}.test.tsx` or `{hookName}.test.ts`, placed in a `__tests__/` folder next to the source.

```
ChatColumn.test.tsx           ← tests for ChatColumn.tsx
useAuthService.api.test.ts    ← tests for useAuthService.api.ts
LoginPage.test.tsx            ← tests for LoginPage.tsx
```

**Test functions:** `it('{should|renders|calls} ...')` style inside `describe` blocks. The `describe` block names the component or scenario; the `it` block states what should be true.

```typescript
describe('ChatColumn', () => {
  it('renders user and chatbot messages with distinct styles', () => { ... })
  it('disables submit button while stream is in progress', () => { ... })
  it('renders bot message with markdown when content contains headers', () => { ... })
})

describe('useAxiosInterceptor — token refresh', () => {
  it('retries the original request after a successful token refresh', async () => { ... })
  it('redirects to /login when refresh also returns 401', async () => { ... })
})
```

**MSW handlers:** Named after the route they mock, in `src/mocks/handlers.ts`.

```typescript
export const handlers = [
  http.post("/auth/login/", loginHandler),
  http.post("/auth/register/", registerHandler),
  http.get("/notebooks/", listNotebooksHandler),
  http.post("/notebooks/:id/files/create", uploadFileHandler),
];
```

---

## 4. Fixtures and Factories Strategy

### Backend: `tests/conftest.py` and `tests/factories.py`

All shared fixtures live in `tests/conftest.py`. Factories live in `tests/factories.py`. Test files import factories directly; they do not import from other test files.

#### `tests/factories.py` — full definition

```python
import factory
from factory.django import DjangoModelFactory
from django.utils import timezone
from datetime import timedelta

class UserFactory(DjangoModelFactory):
    class Meta:
        model = 'users.User'

    email = factory.Sequence(lambda n: f'user{n}@example.com')
    password = factory.PostGenerationMethodCall('set_password', 'testpass123!')
    is_active = True
    registration_method = 'email'


class AccountFactory(DjangoModelFactory):
    class Meta:
        model = 'accounts.Account'

    user = factory.SubFactory(UserFactory)
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    address1 = factory.Faker('street_address')
    city = factory.Faker('city')
    postal_code = factory.Faker('postcode')
    phone = factory.Faker('phone_number')
    tier_plan = 'FREE'
    subscription_status = 'INACTIVE'


class NotebookFactory(DjangoModelFactory):
    class Meta:
        model = 'notebooks.Notebook'

    user = factory.SubFactory(UserFactory)
    title = factory.Sequence(lambda n: f'Notebook {n}')
    pinned = False


class NotebookFileFactory(DjangoModelFactory):
    class Meta:
        model = 'notebooks.NotebookFile'

    notebook = factory.SubFactory(NotebookFactory)
    name = factory.Sequence(lambda n: f'file_{n}.pdf')
    file_type = 'pdf'
    ingestion_status = 'pending'
    # file field: use factory.django.FileField for real file tests


class ChatFactory(DjangoModelFactory):
    class Meta:
        model = 'chats.Chats'

    notebook = factory.SubFactory(NotebookFactory)
    title = factory.Sequence(lambda n: f'Chat {n}')


class ChatMessageFactory(DjangoModelFactory):
    class Meta:
        model = 'chats.ChatMessages'

    chat = factory.SubFactory(ChatFactory)
    role = 'user'
    content = factory.Faker('sentence')
    order_index = factory.Sequence(lambda n: n)


class PaymentFactory(DjangoModelFactory):
    class Meta:
        model = 'payments.Payment'

    account = factory.SubFactory(AccountFactory)
    amount = factory.Faker('pydecimal', left_digits=2, right_digits=2, positive=True)
    billing_interval = 'MONTHLY'
    status = 'PENDING'
    currency = 'USD'
```

#### `tests/conftest.py` — shared fixtures

```python
import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user(db):
    from tests.factories import UserFactory
    return UserFactory()

@pytest.fixture
def auth_client(user):
    """APIClient pre-authenticated as `user` via JWT."""
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
    return client

@pytest.fixture
def account(user):
    from tests.factories import AccountFactory
    return AccountFactory(user=user)

@pytest.fixture
def notebook(user):
    from tests.factories import NotebookFactory
    return NotebookFactory(user=user)

@pytest.fixture
def other_user():
    """A second user — for ownership isolation tests."""
    from tests.factories import UserFactory
    return UserFactory()

@pytest.fixture
def other_notebook(other_user):
    from tests.factories import NotebookFactory
    return NotebookFactory(user=other_user)
```

#### Handling RAG pipeline test data

The RAG pipeline calls three external services: `unstructured` (CPU-heavy PDF parsing), Gemini Embeddings API, and Anthropic Claude API. **Never call real external APIs in automated tests.** The strategy is:

1. **Celery task tests** (`tests/rag/test_ingest_task.py`): Mock `ingest_note_to_rag` entirely with `unittest.mock.patch('rag.tasks.ingest_note_to_rag', new_callable=AsyncMock)`. These tests verify only the task wrapper logic (status transitions, error handling) — not the RAG pipeline internals.

2. **RAG service function tests** (`tests/rag/test_ingest_service.py`): Mock at the boundary of each external call. Patch `partition_pdf` to return a fixed list of `unstructured` element objects, patch `GoogleGenerativeAIEmbeddings` to return a fixed 3072-dim vector, and patch `PGVectorStore.aadd_documents` to be a no-op. Use a fixture that provides a small list of fake `Document` objects:

```python
@pytest.fixture
def fake_rag_documents():
    from langchain_core.documents import Document
    return [
        Document(page_content="Photosynthesis converts light to energy.", metadata={"notebook_id": "...", "user_id": "..."}),
        Document(page_content="Chlorophyll absorbs red and blue light.", metadata={"notebook_id": "...", "user_id": "..."}),
    ]
```

3. **Chat stream tests** (`tests/chats/test_stream.py`): Mock `_stream_llm_response` to return a known sequence of SSE byte strings:

```python
def fake_stream(*args, **kwargs):
    yield b'data: {"text": "Hello"}\n\n'
    yield b'data: {"text": " world"}\n\n'
    yield b'data: [DONE]\n\n'
```

4. **`responses` library** for HTTP mocks. Use `@responses.activate` + `responses.add(...)` to mock the Google userinfo endpoint (`https://www.googleapis.com/oauth2/v3/userinfo`) and the ZiniPay API (`https://api.zinipay.com/v1/payment/create`). Do not use `unittest.mock.patch` for `requests` calls — `responses` is cleaner and produces better error messages when unexpected real calls are made.

---

## 5. How to Run Tests

### pytest.ini (place at `server/pytest.ini`)

```ini
[pytest]
DJANGO_SETTINGS_MODULE = freshr.settings
python_files = test_*.py
python_classes = Test*
python_functions = test_*
testpaths = tests
asyncio_mode = auto
```

`asyncio_mode = auto` means `pytest-asyncio` will automatically handle `async def test_*` functions without requiring `@pytest.mark.asyncio` on every one.

### Commands

**Run all backend tests:**

```bash
cd server
pytest
```

**Run a single test file:**

```bash
pytest tests/payments/test_webhook.py
```

**Run a single test by name:**

```bash
pytest tests/payments/test_webhook.py::TestWebhookCompletedStatus::test_webhook_completed_upgrades_account_tier_to_paid
# or by keyword match:
pytest -k "webhook_completed"
```

**Run with coverage (terminal report):**

```bash
pytest --cov=. --cov-report=term-missing --cov-omit="*/migrations/*,*/venv/*,manage.py,*/settings.py"
```

**Run with coverage (HTML report — opens in browser):**

```bash
pytest --cov=. --cov-report=html --cov-omit="*/migrations/*,*/venv/*,manage.py"
open htmlcov/index.html
```

**Run only fast unit tests (no DB):**

```bash
pytest -m "not django_db"
```

**Run only integration tests (requires real DB):**

```bash
pytest -m "django_db"
```

**Run with verbose output:**

```bash
pytest -v
```

**Run with no output capture (useful for debugging `print` statements):**

```bash
pytest -s
```

---

**Vitest setup — add to `client/vite.config.ts`:**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: {
    allowedHosts: [".ngrok-free.app"],
  },
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/mocks/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["src/mocks/**", "src/**/*.types.ts", "src/**/*.dto.ts"],
    },
  },
});
```

**Add to `client/package.json` scripts:**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test"
  }
}
```

**Run all frontend unit tests (watch mode):**

```bash
cd client
npm test
```

**Run frontend tests once (CI mode):**

```bash
npm run test:run
```

**Run a single frontend test file:**

```bash
npx vitest run src/components/notebook/__tests__/ChatColumn.test.tsx
```

**Run frontend with coverage:**

```bash
npm run test:coverage
```

**Run E2E tests:**

```bash
npm run test:e2e
```

**Run a single E2E test:**

```bash
npx playwright test tests/e2e/auth.spec.ts
```

---

**Run performance tests (k6):**

```bash
# Requires a running server at localhost:8000
k6 run scripts/load/chat_stream.js

# With a specific VU count and duration
k6 run --vus 50 --duration 30s scripts/load/chat_stream.js
```

**Run Schemathesis fuzz tests:**

```bash
# Requires a running server at localhost:8000 with a valid token
st run http://localhost:8000/api/schema/ \
  --header "Authorization: Bearer $(cat .test-token)" \
  --checks all \
  --max-examples 50
```

---

## 6. CI/CD Pipeline Outline

No GitHub Actions workflows currently exist in the repository. Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: pgvector/pgvector:pg16 # same image as docker-compose.yml
        env:
          POSTGRES_DB: freshr_test
          POSTGRES_USER: freshr
          POSTGRES_PASSWORD: freshr
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U freshr"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 10

      redis:
        image: redis:7-alpine # same image as docker-compose.yml
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 5

    defaults:
      run:
        working-directory: server

    env:
      DB_HOST: localhost
      DB_PORT: 5432
      DB_NAME: freshr_test
      DB_USER: freshr
      DB_PASSWORD: freshr
      REDIS_URL: redis://localhost:6379/0
      CONNECTION_STRING: postgresql+psycopg://freshr:freshr@localhost:5432/freshr_test
      DJANGO_SETTINGS_MODULE: freshr.settings
      # External API keys — set as GitHub secrets, used only if explicitly needed
      # Tests must mock all external calls; these are safety nets only
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      GOOGLE_API_KEY: ${{ secrets.GOOGLE_API_KEY }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: pip
          cache-dependency-path: server/requirements.txt

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r requirements-dev.txt

      - name: Run migrations
        run: python manage.py migrate --noinput

      - name: Run tests with coverage
        run: |
          pytest \
            --cov=. \
            --cov-report=xml \
            --cov-report=term-missing \
            --cov-omit="*/migrations/*,*/venv/*,manage.py,*/settings.py,*/admin.py,*/apps.py" \
            --cov-fail-under=70 \
            -q

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        with:
          name: backend-coverage
          path: server/coverage.xml

  frontend:
    runs-on: ubuntu-latest

    defaults:
      run:
        working-directory: client

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: npm
          cache-dependency-path: client/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests with coverage
        run: npm run test:coverage

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        with:
          name: frontend-coverage
          path: client/coverage/

  # E2E runs separately on-demand or nightly — NOT on every PR (too slow)
  e2e:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: [backend, frontend]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
      - name: Install Playwright
        working-directory: client
        run: |
          npm ci
          npx playwright install chromium --with-deps
      - name: Start backend (Docker Compose)
        run: docker compose up -d --wait
      - name: Run E2E tests
        working-directory: client
        run: npx playwright test
      - name: Stop services
        run: docker compose down
```

### What blocks a merge

| Condition                                      | Action                                                                                                 |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Any backend test fails                         | Block merge                                                                                            |
| Any frontend test fails                        | Block merge                                                                                            |
| Backend coverage < 70% (`--cov-fail-under=70`) | Block merge — raise threshold by 5% each quarter until 85%                                             |
| E2E tests fail                                 | Does NOT block PRs (E2E runs on main push only) — opens a GitHub issue automatically via `gh` CLI step |
| Schemathesis finds a 500 error                 | Block merge (add as a separate manual-trigger job)                                                     |

The 70% initial threshold is intentional — the test suite starts from zero. Setting it too high on day one means the pipeline blocks every PR until all tests exist. Increment it as the suite grows.

---

## 7. Rules and Guardrails

### Max test execution time targets

| Suite                               | Target             | Enforced by                                                |
| ----------------------------------- | ------------------ | ---------------------------------------------------------- |
| Backend unit tests (no DB)          | < 5s total         | `pytest -m "not django_db"` run separately                 |
| Backend integration tests (with DB) | < 60s total        | CI `--timeout=120` flag (add `pytest-timeout` to dev deps) |
| Single test function                | < 2s               | `pytest-timeout` per-test default                          |
| Frontend unit tests                 | < 15s total        | Vitest `--reporter=verbose` shows per-file times           |
| E2E suite (5 smoke tests)           | < 3 minutes        | Playwright `timeout: 30000` per test                       |
| k6 load test                        | Defined per script | Not time-capped — results reviewed manually                |

### When to mock vs use real services

| Dependency                                            | Policy                                                                          | Reason                                                                                                                                                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Anthropic API**                                     | Always mock                                                                     | External cost, non-deterministic output, test suite can't run offline                                                                                                                     |
| **Google Gemini Embeddings**                          | Always mock                                                                     | Same — and `connection_string` to pgvector is required to actually store them                                                                                                             |
| **Google OAuth userinfo endpoint** (`googleapis.com`) | Always mock with `responses` library                                            | Cannot control what Google returns in CI                                                                                                                                                  |
| **ZiniPay API**                                       | Always mock with `responses` library                                            | No sandbox environment documented                                                                                                                                                         |
| **PostgreSQL database**                               | Real in integration tests; `@pytest.mark.django_db`                             | The pgvector extension and `JSONB` `->>'field'` raw SQL in `rag/services.py` will not work with SQLite                                                                                    |
| **Redis / Celery**                                    | Use `CELERY_TASK_ALWAYS_EAGER = True` in test settings                          | Tasks run synchronously inline — no broker needed. Verify dispatch with `unittest.mock.patch` on `.delay`. Only use a real Redis connection if testing Celery retry behavior specifically |
| **PGVector `rag_embeddings` table**                   | Mock `PGVectorStore.aadd_documents` and `PGVectorStore.asimilarity_search`      | Requires a live pgvector connection AND a real embedding model; keep in a separate `tests/rag/test_integration_rag.py` marked `@pytest.mark.slow` and excluded from normal CI runs        |
| **`unstructured` PDF parser**                         | Always mock `partition_pdf` / `partition_image`                                 | Requires `poppler`, `tesseract`, and heavy ML models installed; adds minutes to test time                                                                                                 |
| **File system (media uploads)**                       | Use Django's `SimpleUploadedFile` in tests; override `MEDIA_ROOT` to a temp dir | Don't pollute the real `server/media/` directory with test files                                                                                                                          |

Add this to `tests/conftest.py` to isolate media files in tests:

```python
@pytest.fixture(autouse=True)
def temp_media_root(tmp_path, settings):
    settings.MEDIA_ROOT = tmp_path / "media"
```

Add this to `tests/conftest.py` to enforce eager Celery:

```python
@pytest.fixture(autouse=True)
def celery_eager(settings):
    settings.CELERY_TASK_ALWAYS_EAGER = True
    settings.CELERY_TASK_EAGER_PROPAGATES = True
```

### What NOT to test

Do not write tests for:

- **Django ORM mechanics** — do not test that `Model.objects.create()` persists a row. That is Django's job. Test that your _view_ or _service_ creates the right row with the right values.
- **DRF serializer `fields`** — do not test that `ModelSerializer` returns a field you listed in `Meta.fields`. Test that it _rejects invalid input_ or _correctly computes a derived field_.
- **Migration files** — `0001_initial.py`, `0002_*.py` etc. are auto-generated; do not test them.
- **`admin.py` files** — all admin files in this project are stubs (`admin.py` in every app is empty or registers nothing relevant). Skip.
- **`apps.py` files** — `AppConfig` subclasses require no tests.
- **`__str__` methods** — not worth testing unless the representation has business logic. `Notebook.__str__` returning `self.title` does not need a test.
- **`wsgi.py` / `asgi.py`** — framework boilerplate.
- **`freshr/celery.py`** — three lines of Celery app setup with no custom logic.
- **Commented-out apps** — `presentation`, `quiz`, `flashcard` are excluded from `freshr/urls.py`. Write no tests until their routes are active.
- **Type annotations and DTOs** — `client/src/page/dto/*.dto.ts` are TypeScript type definitions. TypeScript itself enforces their correctness at compile time; no runtime tests needed.
- **Mock files** — `client/src/services/*/**.mock.ts` are development stubs. They should not be tested; they should be replaced by MSW handlers in tests.
- **`localStorage` / `sessionStorage` reads in hooks** — test the _behavior_ (e.g., "after login the user is redirected to /dashboard"), not the mechanism (e.g., "localStorage.setItem was called with key 'access'"). Storage is an implementation detail of `client/src/storage.ts`.

### Other guardrails

- **One assertion per logical concept, not per line.** A test that registers a user can assert the status code, the presence of `tokens.access`, and the existence of the DB row — these are all part of one logical outcome. Don't split into three separate tests.
- **No `time.sleep()` in tests.** Use `freezegun` for time-dependent logic (subscription expiry dates). If a test needs to wait for an async operation, that operation should be mocked synchronously.
- **No `print()` debugging left in test files.** Use pytest's `-s` flag when debugging locally. Committed test files must not print to stdout.
- **No shared mutable state between tests.** Each test must be independent. Never set module-level variables in test files as side effects of a test run.
- **Parametrize over duplicated test logic.** If three tests differ only in input values (e.g., testing `MONTHLY`, `YEARLY`, and an invalid interval), use `@pytest.mark.parametrize`.
- **Keep the `tests/factories.py` file the single source of truth for object construction.** If you find yourself calling `User.objects.create(...)` directly in a test, move it to `UserFactory` instead.

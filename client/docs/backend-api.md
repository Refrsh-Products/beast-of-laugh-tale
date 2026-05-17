# Freshr Backend — Frontend Reference

> Read-only reference for frontend development. Do not modify backend files.

---

## Project Structure

| App | Responsibility |
|-----|---------------|
| `users` | Auth, JWT, Google OAuth, password reset |
| `accounts` | User profiles, tier plans, usage quotas |
| `notebooks` | Notebook + file CRUD, ingestion status |
| `rag` | Vector embeddings, topic discovery, RAG queries |
| `chats` | Chat sessions + messages, streaming |
| `quiz` | Quiz generation, submission, retake |
| `payments` | Stripe + ZiniPay integration |
| `presentation` / `flashcard` | Stub apps — not implemented yet |

---

## Authentication

- **JWT** via `djangorestframework-simplejwt`
- **Access token lifetime:** 60 minutes
- **Refresh token lifetime:** 1 day
- **Username field:** email (not username)
- **Header:** `Authorization: Bearer <access_token>`
- Logout blacklists the refresh token

### Endpoints

| Method | URL | Auth | Notes |
|--------|-----|------|-------|
| POST | `/auth/login/` | No | `{email, password}` → `{access, refresh, user}` |
| POST | `/auth/register/` | No | `{email, password, password_confirm}` |
| POST | `/auth/google-login/` | No | `{token}` → `{tokens, user, profile, new_user}` |
| POST | `/auth/logout/` | Yes | `{refresh_token}` |
| POST | `/auth/password-reset/` | No | `{email}` — always returns success |
| POST | `/auth/password-reset/confirm/` | No | `{uid, token, new_password, new_password_confirm}` |
| POST | `/auth/token/refresh/` | No | `{refresh}` → `{access}` |

**Google OAuth note:** If a user previously registered via email, attempting Google login returns 403.

---

## Accounts

| Method | URL | Auth | Notes |
|--------|-----|------|-------|
| GET/POST | `/users/accounts/` | Yes | Create or list accounts |
| GET/PUT/PATCH/DELETE | `/users/accounts/me/` | Yes | Your own profile |
| GET | `/users/accounts/me/usage/` | Yes | Quota usage |

### Account object
```json
{
  "id": "uuid",
  "user": "uuid",
  "first_name": "string",
  "last_name": "string",
  "profile_picture_url": "string",
  "address1": "string",
  "address2": "string",
  "city": "string",
  "postal_code": "string",
  "phone": "string",
  "tier_plan": "FREE | PAID",
  "billing_interval": "MONTHLY | YEARLY | null",
  "subscription_status": "ACTIVE | INACTIVE | CANCELLED | EXPIRED",
  "subscription_start_date": "datetime | null",
  "subscription_end_date": "datetime | null",
  "onboarding_completed": "boolean",
  "storage_bytes_used": "integer",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Usage object (`/users/accounts/me/usage/`)
```json
{
  "plan": "Free | Pro",
  "notebooks": { "used": 2, "limit": 3 },
  "storage": { "used_bytes": 1048576, "limit_bytes": 524288000 },
  "daily_quizzes": { "used": 1, "limit": 5 }
}
```

---

## Notebooks

| Method | URL | Auth | Notes |
|--------|-----|------|-------|
| GET/POST | `/notebooks/` | Yes | List or create |
| GET/PATCH/DELETE | `/notebooks/<uuid>/` | Yes | Single notebook |
| GET | `/notebooks/<uuid>/files` | Yes | List files |
| POST | `/notebooks/<uuid>/files/create` | Yes | Upload file (multipart) |
| DELETE | `/notebooks/<uuid>/files/delete/<uuid>/` | Yes | Delete file |
| GET | `/notebooks/<uuid>/topics` | Yes | `[{id, name}, ...]` |

### Notebook object
```json
{
  "id": "uuid",
  "user": "uuid",
  "title": "string",
  "created_at": "datetime",
  "updated_at": "datetime",
  "pinned": "boolean"
}
```

### NotebookFile object
```json
{
  "id": "uuid",
  "name": "string",
  "file": "url",
  "file_type": "string",
  "ingestion_status": "pending | processing | ready | failed",
  "ingestion_error": "string",
  "uploaded_at": "datetime",
  "updated_at": "datetime"
}
```

**Ingestion status:** Poll this field after upload — there is no webhook or SSE. Path: `pending → processing → ready / failed`.

---

## Quiz

| Method | URL | Auth | Notes |
|--------|-----|------|-------|
| GET | `/quizzes/?notebook=<uuid>` | Yes | List sessions for notebook |
| POST | `/quizzes/?notebook=<uuid>` | Yes | Create quiz session |
| GET | `/quizzes/favourites/` | Yes | Favourite sessions |
| GET/PATCH/DELETE | `/quizzes/<uuid>/` | Yes | Single session (with questions) |
| POST | `/quizzes/<uuid>/submit/` | Yes | Submit answers |
| POST | `/quizzes/<uuid>/retake/` | Yes | New session from original |

### Create quiz payload
```json
{
  "topic": "Machine Learning",
  "topic_id": "uuid (optional)",
  "difficulty": "EASY | MEDIUM | HARD",
  "quiz_type": "TIMED | PRACTICE",
  "num_questions": 10,
  "time_limit": 600
}
```

### QuizSession object (list)
```json
{
  "id": "uuid",
  "title": "string",
  "topic": "string",
  "difficulty": "EASY | MEDIUM | HARD",
  "quiz_type": "TIMED | PRACTICE",
  "num_questions": 10,
  "score": "float (0.0–1.0) | null",
  "status": "IN_PROGRESS | COMPLETED | ABANDONED",
  "is_favourite": "boolean",
  "started_at": "datetime",
  "completed_at": "datetime | null"
}
```

### QuizSession object (detail — includes questions)
```json
{
  "id": "uuid",
  "notebook": "uuid",
  "source_session": "uuid | null",
  "title": "string",
  "topic": "string",
  "difficulty": "EASY | MEDIUM | HARD",
  "quiz_type": "TIMED | PRACTICE",
  "num_questions": 10,
  "time_limit": 600,
  "score": "float | null",
  "status": "IN_PROGRESS | COMPLETED | ABANDONED",
  "is_favourite": "boolean",
  "started_at": "datetime",
  "completed_at": "datetime | null",
  "generated_at": "datetime",
  "questions": [...]
}
```

### QuizQuestion object
```json
{
  "id": "uuid",
  "question_text": "string",
  "question_type": "MCQ | TRUE_FALSE",
  "choices": ["Option A", "Option B", "Option C", "Option D"],
  "correct_answer": "Option B",
  "explanation": "string",
  "user_answer": "string | null",
  "is_correct": "boolean | null",
  "time_taken": "integer (seconds) | null",
  "order_index": "integer"
}
```

**Critical:** `correct_answer` is returned by the API even before the quiz is submitted. The frontend is responsible for not showing it to the user during an active quiz.

**Before submit:** `user_answer` and `is_correct` are both `null`.
**After submit:** both are populated.

**TRUE_FALSE questions:** `choices` is an empty array. `correct_answer` is exactly `"True"` or `"False"`.

### Submit payload
```json
{
  "answers": [
    { "question_id": "uuid", "user_answer": "Option B" },
    { "question_id": "uuid", "user_answer": "True" }
  ]
}
```

### Score
`score` is a decimal between 0.0 and 1.0. Multiply by 100 for percentage, multiply by `num_questions` for correct count.

---

## Chats

| Method | URL | Auth | Notes |
|--------|-----|------|-------|
| GET/POST | `/chats/?notebook=<uuid>` | Yes | List or create chat sessions |
| GET/PATCH/DELETE | `/chats/<uuid>/` | Yes | Single chat |
| GET/POST | `/chats/<uuid>/messages/` | Yes | List or send message |
| GET | `/chats/<uuid>/messages/stream/` | Yes | SSE stream of response |

### Chat object
```json
{
  "id": "uuid",
  "notebook_id": "uuid",
  "title": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### ChatMessage object
```json
{
  "id": "uuid",
  "role": "user | chatbot",
  "content": "string",
  "token_count": "integer | null",
  "order_index": "integer",
  "sent_at": "datetime",
  "is_deleted": "boolean"
}
```

### Streaming
- Connect to `/chats/<uuid>/messages/stream/` via SSE
- Each chunk: `data: {"text": "..."}\n\n`
- Final: `data: [DONE]\n\n`
- Content-Type: `text/event-stream`

---

## RAG

| Method | URL | Auth | Notes |
|--------|-----|------|-------|
| POST | `/rag/query/` | Yes | `{notebook_id, user_query}` → `{success, results: [strings]}` |

---

## Presentations

| Method | URL | Auth | Notes |
|--------|-----|------|-------|
| GET | `/presentation/?notebook=<uuid>` | Yes | List presentations for a notebook |
| POST | `/presentation/?notebook=<uuid>` | Yes | Create + enqueue generation → `202 Accepted` |
| GET | `/presentation/favourites/` | Yes | List favourited presentations (optional `?notebook=<uuid>`) |
| GET/PATCH/DELETE | `/presentation/<uuid>/` | Yes | Single presentation (GET = poll for status + slides) |
| PATCH | `/presentation/<uuid>/slides/<uuid>/` | Yes | Manually edit a slide |
| POST | `/presentation/<uuid>/slides/<uuid>/refine/` | Yes | AI-refine a slide with user feedback |

### Create presentation payload
```json
{
  "topic": "Machine Learning",
  "topic_id": "uuid (optional)",
  "custom_prompt": "Focus on supervised learning (optional)",
  "slide_count": 10,
  "text_length": "BRIEF | BALANCED | DETAILED"
}
```
- `slide_count` must be between 3 and 30
- `topic` + `topic_id` are both optional — omitting both (or passing "All Topics") generates across all notebook content
- Returns `202 Accepted` immediately — generation runs async in the background

### Presentation object (list — no slides)
```json
{
  "id": "uuid",
  "title": "string",
  "topic": "string",
  "slide_count": 10,
  "text_length": "BALANCED",
  "status": "QUEUED | GENERATING | COMPLETED | FAILED",
  "is_favourite": "boolean",
  "generated_at": "datetime",
  "completed_at": "datetime | null"
}
```

### Presentation object (detail — includes slides)
```json
{
  "id": "uuid",
  "notebook": "uuid",
  "title": "string",
  "topic": "string",
  "custom_prompt": "string",
  "slide_count": 10,
  "text_length": "BALANCED",
  "status": "QUEUED | GENERATING | COMPLETED | FAILED",
  "error_message": "string",
  "is_favourite": "boolean",
  "generated_at": "datetime",
  "completed_at": "datetime | null",
  "slides": [...]
}
```

### PresentationSlide object
```json
{
  "id": "uuid",
  "order_index": 0,
  "layout": "string",
  "title": "string",
  "bullets": ["string", "..."],
  "speaker_notes": "string",
  "images": []
}
```

### PATCH slide payload (manual edit)
```json
{
  "title": "string",
  "layout": "string",
  "bullets": ["string"],
  "speaker_notes": "string",
  "images": []
}
```

### POST slide refine payload (AI edit)
```json
{ "feedback": "Make the bullets shorter and more punchy" }
```
- Synchronous — takes ~3–5s. Returns updated slide object.
- Preserves the slide's `images` list.

### PATCH presentation payload (update metadata only)
```json
{ "title": "string", "is_favourite": true }
```

### Polling
- Poll `GET /presentation/<uuid>/` after create until `status` is `COMPLETED` or `FAILED`
- No webhook or SSE — same pattern as file ingestion status

---

## Payments

| Method | URL | Auth | Notes |
|--------|-----|------|-------|
| POST | `/payments/initiate/` | Yes | ZiniPay — returns `{payment_url}` |
| POST | `/payments/stripe/initiate/` | Yes | Stripe — returns `{payment_url}` |
| GET | `/payments/` | Yes | Payment history |
| POST | `/payments/webhook/` | No | ZiniPay webhook (internal) |
| POST | `/payments/stripe/webhook/` | No | Stripe webhook (internal) |

### Payment flow
1. POST to initiate endpoint with `{billing_interval: "MONTHLY" | "YEARLY"}`
2. Redirect user to returned `payment_url`
3. On success: poll `account.tier_plan` + `subscription_status` — webhook updates them server-side
4. Subscription duration: MONTHLY = 30 days, YEARLY = 365 days

---

## Usage Quotas

| Tier | Notebooks | Files per notebook | Storage | Daily quizzes | Daily presentations |
|------|-----------|--------------------|---------|---------------|---------------------|
| FREE | 3 | 2 | 500 MB | 5 | 2 |
| PAID | Unlimited | Unlimited | 5 GB | Unlimited | Unlimited |

- Daily quiz and presentation counters reset at UTC midnight
- Storage bytes used is incremented on upload but **not decremented on delete** (known limitation)
- `subscription_status` must be `ACTIVE` and `subscription_end_date` must be in the future for PAID tier to apply

---

## Known Limitations & Quirks

### Quiz
- `is_correct` and `user_answer` are `null` until submitted — the quiz history view cannot show per-question results for sessions that were never properly submitted
- `correct_answer` is exposed in the API response before submission — frontend must not reveal it during an active quiz
- Time limit is not enforced server-side — the frontend owns the countdown timer
- No partial submission — all answers must be sent at once

### Files
- File deletion does not decrement `storage_bytes_used` — quota shows inflated usage
- Ingestion status must be polled — no push notification

### Chat
- `order_index` gaps are expected if messages are soft-deleted (`is_deleted: true`)
- Chat title defaults to empty string — set a meaningful title on create

### Timezones
- All datetimes are stored in **Asia/Dhaka** timezone
- Daily quota resets at UTC midnight

### Misc
- `GOOGLE_OAUTH_CLIENT_SECET` — typo in the backend env var name (SECET not SECRET), match exactly
- Flashcard app is an empty stub — not implemented
- Presentation generation is async (Celery task) — poll `status` until `COMPLETED` or `FAILED`
- Slide `images` field is always an empty list for now — image generation not yet wired up
- Topic fallback: if a topic filter returns 0 RAG chunks, backend silently retries at notebook level — frontend cannot detect this

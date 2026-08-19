<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->

<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![Proprietary License][license-shield]][license-url]
[![Website][website-shield]][website-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/Refrsh-Products/beast-of-laugh-tale">
    <img src="client/web/public/brand/logomark-on-dark.svg" alt="FRESHR logo" width="80" height="80">
  </a>

<h3 align="center">FRESHR</h3>

  <p align="center">
    FRESHR turns your lecture slides, PDFs and handwritten notes into a study notebook you can ask questions, take quizzes from, and build slide decks with — every answer cited back to your own material.
    <br />
    <a href="CLAUDE.md"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://freshr.cc">View Demo</a>
    &middot;
    <a href="https://github.com/Refrsh-Products/beast-of-laugh-tale/issues/new?labels=bug">Report Bug</a>
    &middot;
    <a href="https://github.com/Refrsh-Products/beast-of-laugh-tale/issues/new?labels=enhancement">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

[![FRESHR][product-screenshot]](https://freshr.cc)

FRESHR is an AI study platform. Students upload their own course material — lecture slides, PDFs, DOCX files, photos of handwritten notes — into **notebooks**. A Retrieval-Augmented Generation (RAG) pipeline extracts, chunks, summarizes and embeds that material into a PGVector store scoped per user _and_ per notebook, and every AI feature reads from that store. Nothing is answered from generic model knowledge alone; the source is always the student's own uploads.

Built on top of that retrieval layer:

- **Chat / tutoring** — multi-session per notebook, server-sent-event streaming replies grounded in the notebook's material.
- **Quizzes** — generated from notebook content, with take / submit / review / retake and a favourites list.
- **Presentations** — AI-generated slide decks, editable in-app, exportable to PDF and PPTX.
- **Audio transcription** — upload a lecture recording, poll for the transcript, then generate structured notes from it.
- **Accounts, tiers and billing** — JWT auth (email + Google), email verification and password reset, per-plan usage limits, and a ZiniPay checkout flow with webhook-driven upgrades.

The repository is a two-half monorepo: `server/` (Django REST API, Celery workers) and `client/` (npm workspaces — `shared` platform-agnostic business logic, `web` React SPA, and `mobile`, an Expo app whose source lives on the `feature/mobile-app` branch). `client/shared` has no build step: both platforms import its TypeScript source directly and inject their own HTTP/session/config/stream adapters, so a domain change lands on web and mobile at once.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

- [![Django][Django]][Django-url]
- [![DRF][DRF]][DRF-url]
- [![Python][Python]][Python-url]
- [![Postgres][Postgres]][Postgres-url]
- [![pgvector][Pgvector]][Pgvector-url]
- [![Celery][Celery]][Celery-url]
- [![Redis][Redis]][Redis-url]
- [![React][React.js]][React-url]
- [![TypeScript][TypeScript]][TypeScript-url]
- [![Vite][Vite]][Vite-url]
- [![TailwindCSS][Tailwind]][Tailwind-url]
- [![Expo][Expo]][Expo-url]
- [![Anthropic][Anthropic]][Anthropic-url]
- [![Gemini][Gemini]][Gemini-url]
- [![Docker][Docker]][Docker-url]

Key versions: Django 6.0.1 · DRF 3.16.1 · Python 3.13 · PostgreSQL 16 (pgvector image) · Celery 5.6.2 · Redis 7 · React 19.2 · Vite 7 · React Router 7 · Tailwind v4 · Expo SDK 56.

AI models in use: `claude-haiku-4-5` (chunk summaries, chat, quiz and presentation generation), `claude-sonnet-4-6` (notes from transcripts), `gemini-2.5-flash` (audio transcription), `gemini-embedding-001` (3072-dim embeddings).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->

## Getting Started

The backend runs in Docker (the RAG pipeline needs Tesseract, Poppler, libmagic and OpenCV, which only exist inside the server image). The web client runs on the host with Vite.

### Prerequisites

- [Docker](https://www.docker.com/get-started) and Docker Compose — required for the API, Celery, Postgres and Redis
- Node.js 20+ and npm — for the web client
  ```sh
  npm install npm@latest -g
  ```
- Python 3.13 — only if you want to run the server test suite outside Docker
- An **Anthropic API key** and a **Google Gemini API key**

### Installation

1. Get an API key at [console.anthropic.com](https://console.anthropic.com) and [aistudio.google.com](https://aistudio.google.com/app/apikey)

2. Clone the repo

   ```sh
   git clone https://github.com/Refrsh-Products/beast-of-laugh-tale.git
   cd beast-of-laugh-tale
   ```

3. Create `server/.env` — Django loads it with `python-dotenv`, and the mounted `./server` volume makes it visible inside the containers

   ```sh
   ANTHROPIC_API_KEY=your_anthropic_api_key
   GOOGLE_API_KEY=your_google_gemini_api_key
   SECRET_KEY=any_long_random_string
   DEBUG=True
   FRONTEND_URL=http://localhost:5173
   BACKEND_URL=http://localhost:8000
   # Optional — features degrade gracefully without them
   RESEND_API_KEY=            # transactional email (verification, password reset)
   GOOGLE_OAUTH_CLIENT_SECRET=
   ZINIPAY_API_KEY=
   USE_MOCK_PAYMENT_GATEWAY=true
   ```

   > `DB_*`, `REDIS_URL` and `CONNECTION_STRING` are injected by `docker-compose.local.yml` and must **not** be set here.

4. Start the local backend stack

   ```sh
   docker compose --env-file .env.local -p freshr-local -f docker-compose.local.yml up -d
   ```

   This brings up Postgres+pgvector (host port `5433`), Redis (`6379`), gunicorn on `:8000` (migrations run on boot), a Celery worker, Dozzle on `:8080` and mkdocs on `:8001`.

5. Configure the web client — `client/web/.env`

   ```sh
   VITE_API_BASE_URL=http://localhost:8000
   VITE_GOOGLE_AUTH_CLIENT_ID=your_google_oauth_client_id
   VITE_WEB3FORMS_ACCESS_KEY=your_web3forms_key
   ```

6. Install workspace packages and start Vite

   ```sh
   cd client
   npm install
   npm run dev
   ```

   The SPA is served at `http://localhost:5173`.

7. Change the git remote url to avoid accidental pushes to the base project
   ```sh
   git remote set-url origin <your-fork-url>
   git remote -v # confirm the changes
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->

## Usage

**Where things live once the stack is up**

| Surface                 | URL                             |
| ----------------------- | ------------------------------- |
| Web app (Vite)          | `http://localhost:5173`         |
| API root                | `http://localhost:8000/api/v1/` |
| Swagger UI              | `http://localhost:8000/docs/`   |
| ReDoc                   | `http://localhost:8000/redocs/` |
| OpenAPI schema          | `http://localhost:8000/schema/` |
| Django admin            | `http://localhost:8000/admin/`  |
| Container logs (Dozzle) | `http://localhost:8080`         |
| Server docs (mkdocs)    | `http://localhost:8001`         |

Everything under `/api/v1/` is versioned by `API_VERSION` in `server/freshr/settings.py`. `admin/`, `docs/`, `redocs/` and `schema/` sit deliberately _outside_ `/api/` — nginx proxies only `/api/` to Django in production, so those routes are reachable in local development only.

**API surface at a glance** (all paths relative to `/api/v1/`, all protected routes need `Authorization: Bearer <access_token>`):

| Group            | Endpoints                                                                                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth/`          | `register/`, `login/`, `logout/`, `google-login/`, `token/refresh/`, `verify-email/`, `verify-email/confirm/`, `password-reset/`, `password-reset/confirm/` |
| `users/`         | `accounts/`, `accounts/me/`, `accounts/me/usage/`                                                                                                           |
| `notebooks/`     | list & create, `<id>`, `<id>/archive`, `<id>/unarchive`, `<id>/files`, `<id>/files/create`, `<id>/files/delete/<file_id>/`, `<id>/topics`                   |
| `rag/`           | `query/`                                                                                                                                                    |
| `chats/`         | list & create, `<chat_id>/`, `<chat_id>/messages/`, `<chat_id>/messages/stream/` (SSE)                                                                      |
| `quizzes/`       | list & create, `favourites/`, `<quiz_id>/`, `<quiz_id>/submit/`, `<quiz_id>/retake/`                                                                        |
| `presentation/`  | list & create, `favourites/`, `<presentation_id>/`                                                                                                          |
| `transcription/` | `<notebook_id>/audio/transcribe`, `.../transcripts`, `.../transcripts/<id>`, `.../transcripts/<id>/update`, `.../transcripts/<id>/generate-notes`           |
| `payments/`      | `initiate/`, `webhook/`, list                                                                                                                               |
| `policies/`      | `<slug>/` (public)                                                                                                                                          |
| `referral/`      | `validate/`                                                                                                                                                 |

**Running the server test suite** — pytest needs Postgres, so point it at the dockerized one on host port `5433`:

```sh
cd server && source venv/bin/activate && DB_HOST=localhost DB_PORT=5433 DB_NAME=freshr DB_USER=freshr DB_PASSWORD=freshr pytest
```

Tests all live in `server/tests/` (not per-app) and coverage is on by default — add `--no-cov` for a fast single-file run.

**Running the web test suite**

```sh
cd client/web && npx vitest run
```

**Triggering a Celery task by hand** — `celery call` is broken in this repo (`django_celery_results` imports models before `django.setup()`), so use the Django shell:

```sh
docker compose -p freshr-local exec web python manage.py shell -c "from rag.tasks import ingest_note_task; ingest_note_task.delay()"
```

**Building the web image manually**

```sh
docker build -f client/web/Dockerfile -t freshr-web ./client
```

**Reading production logs** — Dozzle is not exposed publicly; tunnel to it over SSH and open `http://localhost:8888`:

```sh
ssh -L 8888:localhost:8888 deploy@163.61.236.102
```

**Scheduled jobs (subscription expiry)** — an hourly host `crontab` entry downgrades paid accounts once their subscription lapses, by running `accounts.tasks.expire_subscriptions` inside the prod web container and appending to `/var/log/freshr-expire-subscriptions.log`. Each run now logs a heartbeat line you can confirm with:

```sh
grep expire_subscriptions /var/log/freshr-expire-subscriptions.log | tail
```

A health-check command reports (and exits non-zero on) any paid account stuck past its end date — wire it into a monitor or an alert-only cron:

```sh
docker exec freshr-prod-web-1 python manage.py check_expired_subscriptions
```

Full details — the crontab line, Celery Beat alternative, observability and troubleshooting — are in [`server/docs/scheduled-jobs.md`](server/docs/scheduled-jobs.md).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ROADMAP -->

## Roadmap

- [x] Auth (email + Google), email verification, password reset
- [x] Notebooks, file upload, archive/delete
- [x] RAG ingestion pipeline (OCR → chunking → summarization → embeddings → PGVector)
- [x] SSE streaming chat with multi-session history
- [x] Quiz generation, taking, review and retake
- [x] AI presentation builder with PDF and PPTX export
- [x] Audio transcription and AI notes generation
- [x] Per-tier usage limits and ZiniPay billing
- [x] Campus Champions referral validation
- [ ] Mobile app merged to `main` (currently on `feature/mobile-app`; only `package.json` is tracked here)
  - [ ] EAS `submit.production` store credentials
  - [ ] PPTX export parity with web
- [ ] Photo scan-to-notes on `main` — camera batch capture, per-photo clarity/relevance validation, merged-PDF ingestion
- [ ] Per-file rename endpoint (`renameFile` in `client/shared/src/services/notebooks.ts` is still a no-op stub)
- [ ] Automated test coverage for `client/mobile`
- [ ] Server test coverage beyond `users` and `presentation`

See the [open issues](https://github.com/Refrsh-Products/beast-of-laugh-tale/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->

## Contributing

This is a private product repository, so contributions come from the team rather than from forks. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, open an issue with the tag "enhancement" first so the approach can be agreed on before code is written.

1. Branch off `main` using the existing convention (`<name>/feat/<slug>`, `<name>/fix/<slug>`)
   ```sh
   git checkout -b sheikh/feat/AmazingFeature
   ```
2. Keep shared business logic in `client/shared` — both web and mobile import it directly, with no build step
3. Add or update tests (`server/tests/` for the API, `client/web/src/**/*.test.tsx` for the SPA) and run them locally
4. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
5. Push to the Branch (`git push origin sheikh/feat/AmazingFeature`)
6. Open a Pull Request — merging to `main` triggers the staging build-and-deploy workflow

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Top contributors:

<a href="https://github.com/Refrsh-Products/beast-of-laugh-tale/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Refrsh-Products/beast-of-laugh-tale" alt="contrib.rocks image" />
</a>

<!-- LICENSE -->

## License

Copyright (c) 2026 REFRSH. All rights reserved. Confidential and proprietary — unauthorized copying or distribution via any medium is strictly prohibited. See [`LICENCE`](LICENCE) for the full text.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->

## Contact

REFRSH — [team@freshr.cc](mailto:team@freshr.cc) · [freshr.cc](https://freshr.cc)

Project Link: [https://github.com/Refrsh-Products/beast-of-laugh-tale](https://github.com/Refrsh-Products/beast-of-laugh-tale)

Lead Developer: [sakifhossain71@gmail.com](mailto:sakifhossain71@gmail.com)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->

## Acknowledgments

- [Unstructured](https://unstructured.io/) — hi-res document extraction and OCR
- [LangChain](https://www.langchain.com/) + [langchain-postgres](https://github.com/langchain-ai/langchain-postgres) — retrieval plumbing
- [pgvector](https://github.com/pgvector/pgvector) — vector storage inside Postgres
- [drf-spectacular](https://drf-spectacular.readthedocs.io/) — OpenAPI schema and Swagger UI
- [shadcn/ui](https://ui.shadcn.com/) and [React Native Reusables](https://reactnativereusables.com/) — component foundations
- [Dozzle](https://dozzle.dev/) — container log viewing
- [Best-README-Template](https://github.com/othneildrew/Best-README-Template) — the structure of this file

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/Refrsh-Products/beast-of-laugh-tale.svg?style=for-the-badge
[contributors-url]: https://github.com/Refrsh-Products/beast-of-laugh-tale/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/Refrsh-Products/beast-of-laugh-tale.svg?style=for-the-badge
[forks-url]: https://github.com/Refrsh-Products/beast-of-laugh-tale/network/members
[stars-shield]: https://img.shields.io/github/stars/Refrsh-Products/beast-of-laugh-tale.svg?style=for-the-badge
[stars-url]: https://github.com/Refrsh-Products/beast-of-laugh-tale/stargazers
[issues-shield]: https://img.shields.io/github/issues/Refrsh-Products/beast-of-laugh-tale.svg?style=for-the-badge
[issues-url]: https://github.com/Refrsh-Products/beast-of-laugh-tale/issues
[license-shield]: https://img.shields.io/badge/license-proprietary-19392E.svg?style=for-the-badge
[license-url]: https://github.com/Refrsh-Products/beast-of-laugh-tale/blob/main/LICENCE
[website-shield]: https://img.shields.io/badge/-freshr.cc-B4FF6E.svg?style=for-the-badge&logo=safari&logoColor=19392E
[website-url]: https://freshr.cc
[product-screenshot]: client/web/public/brand/full-logo-on-dark.svg

<!-- Shields.io badges. You can a comprehensive list with many more badges at: https://github.com/inttter/md-badges -->

[Django]: https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white
[Django-url]: https://www.djangoproject.com/
[DRF]: https://img.shields.io/badge/DRF-A30000?style=for-the-badge&logo=django&logoColor=white
[DRF-url]: https://www.django-rest-framework.org/
[Python]: https://img.shields.io/badge/Python%203.13-3776AB?style=for-the-badge&logo=python&logoColor=white
[Python-url]: https://www.python.org/
[Postgres]: https://img.shields.io/badge/PostgreSQL%2016-4169E1?style=for-the-badge&logo=postgresql&logoColor=white
[Postgres-url]: https://www.postgresql.org/
[Pgvector]: https://img.shields.io/badge/pgvector-336791?style=for-the-badge&logo=postgresql&logoColor=white
[Pgvector-url]: https://github.com/pgvector/pgvector
[Celery]: https://img.shields.io/badge/Celery-37814A?style=for-the-badge&logo=celery&logoColor=white
[Celery-url]: https://docs.celeryq.dev/
[Redis]: https://img.shields.io/badge/Redis%207-FF4438?style=for-the-badge&logo=redis&logoColor=white
[Redis-url]: https://redis.io/
[React.js]: https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://react.dev/
[TypeScript]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[Vite]: https://img.shields.io/badge/Vite%207-646CFF?style=for-the-badge&logo=vite&logoColor=white
[Vite-url]: https://vite.dev/
[Tailwind]: https://img.shields.io/badge/Tailwind%20v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
[Expo]: https://img.shields.io/badge/Expo%20SDK%2056-000020?style=for-the-badge&logo=expo&logoColor=white
[Expo-url]: https://expo.dev/
[Anthropic]: https://img.shields.io/badge/Claude-D97757?style=for-the-badge&logo=anthropic&logoColor=white
[Anthropic-url]: https://www.anthropic.com/
[Gemini]: https://img.shields.io/badge/Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white
[Gemini-url]: https://ai.google.dev/
[Docker]: https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white
[Docker-url]: https://www.docker.com/

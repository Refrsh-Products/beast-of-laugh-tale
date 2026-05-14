# Freshr

**Freshr** is an AI-powered learning platform that helps students learn smarter. Upload your documents, and Freshr will index them into a vector database, enabling intelligent, context-aware interactions with your study materials including AI-generated quizzes, flashcards, and RAG-based tutoring.

---

## Table of Contents

- [Product Overview](#product-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Running with Docker (Recommended)](#running-with-docker-recommended)
  - [Running Locally (Without Docker)](#running-locally-without-docker)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [License](#license)

---

## Product Overview

Freshr is designed for students who want to get more out of their study materials. The platform allows users to organize their documents into **notebooks**, upload files (PDFs, DOCX, images, and more), and leverage AI to interact with that content in meaningful ways.

At the core of Freshr is a **Retrieval-Augmented Generation (RAG)** pipeline that processes uploaded documents, generates vector embeddings, and stores them in a PostgreSQL vector database (PGVector). This enables similarity-based search across a user's study materials — scoped and isolated per user and notebook — forming the foundation for AI tutoring, quiz generation, and more.

The backend is built with **Django REST Framework**, uses **Celery + Redis** for asynchronous document indexing, and integrates **Anthropic Claude** and **Google Gemini** APIs for AI-powered features.

---

## Features

### Implemented (MVP Phase 1)

- **User Authentication & Authorization**
  - Email-based registration and login
  - JWT access and refresh token flow (access: 60 min, refresh: 1 day)
  - Password reset via email with tokenized links
  - Custom user model with UUID primary keys and subscription tier support (`FREE`, `MONTHLY`, `YEARLY`)
  - Last login tracking

- **Notebook Management**
  - Create and delete notebooks tied to authenticated users
  - Each notebook acts as an isolated workspace for uploaded study materials

- **File Management**
  - Upload files (PDFs, DOCX, images, etc.) to specific notebooks
  - Automatic content extraction and caching
  - File deletion with associated vector data cleanup

- **RAG (Retrieval-Augmented Generation)**
  - Asynchronous document ingestion via Celery workers
  - High-resolution PDF extraction using the Unstructured library (with OCR via Tesseract)
  - Title-based smart chunking (max 3000 chars, soft limit 2400 chars)
  - AI-enhanced chunk summarization using **Claude Haiku** (multimodal: text + images)
  - Vector embedding via **Google Gemini** (`gemini-embedding-001`, 3072 dimensions)
  - Embeddings stored in **PostgreSQL with PGVector**
  - Metadata-filtered similarity search — results are scoped per user and notebook
  - Top-5 relevant document retrieval per query
  - `is_indexed` flag on `NotebookFile` to track ingestion status

- **Account Management**
  - User profile/account CRUD with one-to-one user relationship

- **Interactive API Documentation**
  - Swagger UI at `/api/docs/`
  - ReDoc at `/api/redocs/`
  - OpenAPI schema at `/api/schema/`

### Planned (Phase 2 & 3)

- AI-generated quizzes from notebook content
- Flashcard generation
- AI presentation builder
- Learning progress tracking & analytics
- Citations and research tools
- Advanced AI chat/tutoring interface
- Paid subscription billing integration

---

## Tech Stack

| Layer                      | Technology                                  |
| -------------------------- | ------------------------------------------- |
| **Backend Framework**      | Django 6.0.1 + Django REST Framework 3.16.1 |
| **Language**               | Python 3.13                                 |
| **Authentication**         | JWT via `djangorestframework-simplejwt`     |
| **Primary Database**       | PostgreSQL 16                               |
| **Vector Database**        | PGVector (PostgreSQL extension)             |
| **Task Queue**             | Celery 5.6.2                                |
| **Message Broker / Cache** | Redis 7                                     |
| **LLM — Summaries**        | Anthropic Claude Haiku 4.5                  |
| **LLM — Embeddings**       | Google Gemini (`gemini-embedding-001`)      |
| **RAG Framework**          | LangChain Core + LangChain PostgreSQL       |
| **Document Parsing**       | Unstructured, PyMuPDF, PDFMiner.six         |
| **OCR**                    | Tesseract OCR                               |
| **Image Processing**       | OpenCV, Pillow                              |
| **API Documentation**      | drf-spectacular (OpenAPI/Swagger)           |
| **Containerization**       | Docker + Docker Compose                     |

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/) — **required for the RAG pipeline**
- A **Google Gemini API key** (for embeddings)
- An **Anthropic API key** (for AI-enhanced summaries)

> **Note on Python version:** If running locally without Docker, Python 3.13 is required.

---

### Running with Docker (Recommended)

> **The RAG pipeline depends on system-level dependencies** (Tesseract OCR, Poppler, libmagic, OpenCV) that are only available inside the Docker container. If you want to use document indexing and vector search, **Docker is required**.

**1. Clone the repository**

```bash
git clone https://github.com/your-org/freshr.git
cd freshr
```

**2. Create the environment file**

Copy the example env file and fill in your API keys:

```bash
cp server/.env.example server/.env
```

Then edit `server/.env`:

```env
GOOGLE_API_KEY=your_google_gemini_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

> The `CONNECTION_STRING` and `REDIS_URL` are pre-configured for the Docker network in `docker-compose.yml` and do not need to be changed for local Docker use.

**3. Build and start all services**

```bash
docker compose up --build
```

This starts five services:

- `postgres` — PostgreSQL 16 with PGVector extension
- `redis` — Redis 7 for Celery broker and result backend
- `web` — Django development server on port `8000`
- `celery` — Celery worker for asynchronous document indexing
- `celery-beat` — Celery Beat scheduler for periodic tasks (e.g., subscription expiry)

**4. Access the API**

Once all services are healthy, the API is available at:

```
http://localhost:8000
```

Swagger UI: `http://localhost:8000/api/docs/`

**5. Stopping the services**

```bash
docker compose down
```

To also remove all volumes (resets the database):

```bash
docker compose down -v
```

---

### Running Locally (Without Docker)

> **Important:** Running locally does **not** support the RAG pipeline. Document indexing, vector search, and all Celery-based features require Docker. Use this setup only for working on authentication, notebooks, or account management features.

**1. Clone the repository**

```bash
git clone https://github.com/your-org/freshr.git
cd freshr/server
```

**2. Create a virtual environment and install dependencies**

```bash
python3.13 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**3. Set up PostgreSQL and Redis**

Ensure you have a running PostgreSQL instance and Redis server. Create a database named `freshr` with a user `freshr`.

**4. Create the environment file**

```bash
cp .env.example .env
```

Update `.env` with your local database connection string and API keys:

```env
CONNECTION_STRING=postgresql+psycopg://freshr:freshr@localhost:5432/freshr
GOOGLE_API_KEY=your_google_gemini_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

**5. Run migrations and start the server**

```bash
python manage.py migrate
python manage.py runserver
```

**6. (Optional) Start Celery worker and beat scheduler**

In a separate terminal (with the virtualenv activated):

```bash
celery -A freshr worker -l info
celery -A freshr beat -l info
```

---

## Environment Variables

| Variable            | Description                                                                   | Required |
| ------------------- | ----------------------------------------------------------------------------- | -------- |
| `GOOGLE_API_KEY`    | Google Gemini API key for document embeddings                                 | Yes      |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI-enhanced chunk summaries                             | Yes      |
| `CONNECTION_STRING` | SQLAlchemy-format PostgreSQL connection string                                | Yes      |
| `REDIS_URL`         | Redis connection URL (default: `redis://redis:6379/0`)                        | No       |
| `FRONTEND_URL`      | Frontend base URL for password reset links (default: `http://localhost:3000`) | No       |
| `SECRET_KEY`        | Django secret key — override in production                                    | No       |

---

## API Documentation

The API is fully documented with OpenAPI. Once the server is running, visit:

| Interface          | URL                                 |
| ------------------ | ----------------------------------- |
| Swagger UI         | `http://localhost:8000/api/docs/`   |
| ReDoc              | `http://localhost:8000/api/redocs/` |
| Raw OpenAPI Schema | `http://localhost:8000/api/schema/` |

### Quick Reference

| Method   | Endpoint                        | Description                    |
| -------- | ------------------------------- | ------------------------------ |
| `POST`   | `/auth/register/`               | Register a new user            |
| `POST`   | `/auth/token/`                  | Obtain JWT tokens              |
| `POST`   | `/auth/token/refresh/`          | Refresh access token           |
| `POST`   | `/auth/password-reset/`         | Request password reset email   |
| `POST`   | `/auth/password-reset/confirm/` | Confirm password reset         |
| `POST`   | `/notebooks/create/`            | Create a notebook              |
| `DELETE` | `/notebooks/delete/<id>/`       | Delete a notebook              |
| `POST`   | `/notebooks/<id>/file/create`   | Upload file to notebook        |
| `DELETE` | `/notebooks/file/delete/<id>/`  | Delete a notebook file         |
| `POST`   | `/rag/query/`                   | Query notebook content via RAG |

All protected endpoints require the `Authorization: Bearer <access_token>` header.

---

## License

This project is licensed under the terms of the [LICENSE](LICENSE) file included in this repository.

## How to access Dozzle

### The SSH Tunnel (Most Secure / Recommended)

On your laptop, run this command:
ssh -L 8888:localhost:8888 deploy@163.61.236.102

Now, open your browser and go to http://localhost:8888.

Your computer thinks Dozzle is running locally, but it’s actually securely pulling the data through your encrypted SSH connection.

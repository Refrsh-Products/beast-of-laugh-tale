# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Bangladeshi university students (1st year through postgrad), studying across all disciplines. They are preparing for exams, completing assignments, and trying to keep up with lecture material — often in mixed Bangla/English instruction. They are cost-conscious, mobile-first in daily life, and largely new to using AI tools for academics. Secondary: any university student globally, as the product expands beyond Bangladesh.

## Product Purpose

FRESHR turns a student's own lecture materials — PDFs, slides, handwritten notes, audio recordings — into an interactive study workspace: AI chat grounded in their sources, practice quizzes, presentation drafts, and structured notes from audio. Every AI answer cites back to the student's own material.

The product exists because general-purpose AI tools (ChatGPT, Gemini, NotebookLM) are not built for learning — they hand out answers. FRESHR is built to help students _learn_, not just get answers. Success means students retain more, study more efficiently, and feel confident going into exams.

## Positioning

A student-exclusive AI study platform that is grounded in the student's own course material and designed around guided learning rather than answer delivery. Unlike general-purpose AI, FRESHR's AI tutor guides students toward answers rather than giving them directly — the pedagogical commitment is structural, not cosmetic. Unlike international alternatives, FRESHR is priced in local currency (BDT via bKash), understands Bangla+English mixed content, and is built by students on a campus in Dhaka.

## Operating Context

- Students upload lecture PDFs, DOCX, PPTX, XLSX, images, handwritten notes, and TXT/MD files into per-course **notebooks**.
- A RAG pipeline (LlamaParse → chunking → Gemini embeddings → PGVector) indexes uploads so all AI features draw from the student's own material.
- **Chat**: SSE-streamed AI tutor that cites sources, supports multiple sessions per notebook.
- **Quiz**: generate MCQ quizzes (5–20 questions, three difficulty levels, practice or timed mode) from notebook content.
- **Presentations**: generate slide decks from notebook content, export to PDF (mobile) or PPTX/PDF (web).
- **Audio Transcription** (paid): upload lecture recordings (mp3/m4a/wav/mp4, up to 500 MB), get Bangla+English transcription, then generate structured study notes.
- **Camera scan-to-notes** (on `feature/mobile-app` branch, not yet on `main`): photograph handwritten notes, validate with Gemini, merge to PDF, ingest.
- Students manage notebooks (create, rename, archive, pin, delete) and files (upload, delete, batch-select).

## Capabilities and Constraints

### Server-enforced tier limits (source of truth)

| Limit                 | FREE  | PAID      |
| --------------------- | ----- | --------- |
| Notebooks             | 3     | Unlimited |
| Files per notebook    | 2     | Unlimited |
| Max file size         | 10 MB | 50 MB     |
| Quizzes per day       | 5     | Unlimited |
| Presentations (total) | 2     | Unlimited |
| Storage               | 60 MB | 2,000 MB  |
| Audio transcription   | No    | Yes       |

Note: The web pricing page advertises different storage figures (500 MB free, 5 GB/10 GB paid). The server values above are the enforced truth; pricing copy should be updated to match.

### Billing

- Two paid intervals: **PRO** (monthly, ৳350/mo) and **SCHOLAR** (semester/4-month, ৳300/mo = ৳1,200 one-time). Both map to the same PAID tier for limits.
- Payment via bKash through ZiniPay gateway. No international payment method.
- Campus Champions referral programme: admin-created codes give a configurable discount (default 10%).
- 7-day money-back guarantee.

### Technical constraints

- Django 6 + DRF backend, Celery + Redis for async jobs, Postgres + PGVector.
- Client monorepo: `@freshr/shared` (platform-agnostic services/types), `@freshr/web` (React + Vite + Tailwind v4), `@freshr/mobile` (Expo SDK 56 + expo-router + NativeWind + RNR).
- AI providers: Anthropic Claude (chat, quiz, presentation, topics), Google Gemini (embeddings, transcription, photo validation), LlamaParse (document parsing).
- Mobile: no automated tests, no store submission configured yet, Google Sign-In requires dev build.

### Open/undecided

- Pricing page copy does not match server limits (known gap).
- No international payment method.
- Camera scan feature not merged to main.

## Brand Commitments

- **Name**: FRESHR (product) by Constellate (company). Wordmark rendered in all-caps.
- **Palette**: Timber Green (primary dark green), Sulu (bright yellow-green accent), Ecru (warm off-white). Defined in `client/mobile/lib/design/brand.ts` and `client/web/src/index.css`.
- **Typography**: Instrument Sans (all weights).
- **Logo**: SVG wordmark and logomark variants at `client/web/public/brand/`.
- **Voice**: Direct, student-peer, confident without hype, financially empathetic, transparent about limitations. Conversational encouragement over formal instruction. Competitive positioning names competitors explicitly rather than using vague superlatives.
- **Tagline**: "The AI for university students."
- **Footer origin line**: "Made on a campus in Dhaka."
- **BETA badge** shown in dashboard navigation.

## Evidence on Hand

- Five named student testimonials from Independent University, Bangladesh (IUB), quoted "the week before finals" — real students, not invented.
- 58 curated Bangladeshi university names in the onboarding selector.
- No press coverage, case studies, or external benchmarks to reference. Future work must not fabricate these.
- Landing page comparison claim ("Better than NotebookLM or ChatGPT?") is framed as an invitation to try, not a proven benchmark.

## Product Principles

1. **Guided learning over answer delivery.** The AI tutor guides students toward understanding rather than handing out answers directly. This pedagogical stance is structural — it shapes prompts, quiz design, and chat behavior.
2. **Grounded in the student's own material.** Every AI feature draws from the student's uploaded course content, with citations. FRESHR never generates ungrounded claims or pulls from the open web.
3. **Affordable and accessible for Bangladeshi students.** Local currency pricing, bKash payment, Bangla+English support, and cost-conscious tier design. Bangladesh-first, expanding later.
4. **Honest product, honest copy.** Only claim what the product actually does today. No fabricated testimonials, no inflated metrics, no features-as-marketing that don't ship.
5. **One workspace, all study tools.** Chat, quizzes, presentations, transcription, and files live inside the notebook — not scattered across separate apps or workflows.

## Accessibility & Inclusion

No specific accessibility standard has been formally committed to. Both platforms use standard framework accessibility primitives (React ARIA, React Native accessibility props) but no audit has been performed. Bangla+English bilingual content support is a core product requirement. Minimum age: 13 (privacy policy) / 18 or parental consent (terms of service).

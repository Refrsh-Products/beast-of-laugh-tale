# FRESHR Prompt Evaluation Plan

**Stack baseline:** Django 6.0.1 · Celery 5.6 · PostgreSQL 16 + pgvector · Claude Haiku 4.5 / Sonnet 4.6 · Gemini 2.5 Flash · LlamaParse · numpy 2.3 / pandas 3.0 / scipy 1.17

This document defines how to change a prompt and *know* whether the change was an improvement. It covers the prerequisite refactor, the evaluation dataset, the metric set, the statistics needed to tell signal from noise, and the harness that runs it all.

It is grounded in the current state of the repo. As of writing: there are **10 prompts across 7 files**, every one of them a hardcoded f-string welded to its API call; there is no prompt versioning, no eval harness, no `server/evals/` directory, and no record tying any generated quiz or deck back to the prompt that produced it. Quiz generation additionally **falls back to a hardcoded mock quiz on any failure**, which will silently corrupt results unless it is disabled during evaluation.

The prompt inventory itself is not repeated here — see the AI prompt map for file/line locations and verbatim text.

---

## 1. What Makes This Measurable

### 1.1 The advantage: most outputs are structured JSON

Seven of the ten prompts demand a strict JSON shape, and several encode **numeric targets in the prompt text itself**. That means a large share of quality is machine-checkable with no model and no human:

| Prompt rule (verbatim from the prompt) | Becomes this metric |
|---|---|
| "Generate exactly {num_questions} quiz questions" | Question-count accuracy |
| "MCQ: exactly 4 choices" | Choice-count compliance |
| "correct_answer must be the full text of one of the choices" | Answer-in-choices rate |
| "aim for roughly 70% MCQ, 30% TRUE_FALSE" | Type-mix deviation |
| "Aim for roughly 50-70% of the {slide_count} slides to use an image-bearing layout" | Visual-density adherence |
| "image_queries length must match the layout's image count exactly" | Image-query arity compliance |
| "Each bullet should be ~8 / ~15 / ~25 words" | Bullet-length MAE vs target |
| "Each topic should be 3-7 words" | Topic-length compliance |
| "Return ONLY a valid JSON object — no markdown" | Raw-parse rate (see §4.2) |

**Why this matters:** these metrics are free, deterministic, and reviewable by a non-engineer. They should carry the first pass of every experiment, with model-graded judging reserved for what they cannot see.

### 1.2 Blocker A — prompts are welded to their API calls

Only three of the ten prompts can be evaluated as-is. The rest interleave prompt construction, the API call, parsing, and error handling in one function:

| Prompt | Current shape | Refactor needed |
|---|---|---|
| Chat persona | `build_study_assistant_prompt(context)` — already a pure function | None |
| Notes | `NOTES_SYSTEM_PROMPT` — module constant | None |
| Transcription | `TRANSCRIPTION_PROMPT` — module constant | None |
| Deck outline / draft / revise | Build inline, then call shared `_call_llm_json` | Light — extract the f-string |
| Topic extraction | Build + call + parse in one function | Medium |
| Quiz (both) | Build + call + parse + **silent mock fallback** | Heaviest |

### 1.3 Blocker B — the mock fallback will corrupt every quiz result

`quiz/services/quiz_generation.py` catches every exception and returns `generate_quiz_mock(...)`. A prompt variant that fails to produce valid JSON 30% of the time will still return five well-formed questions about mitochondria, LIFO stacks, and merge sort. **Schema-compliance would score near 100% for a prompt that is badly broken.**

This is the single highest-risk trap in the whole plan. Phase 0 must add a strict mode that raises instead of falling back, and the harness must additionally assert that no result title begins with `Mock Quiz:` as a backstop.

### 1.4 Blocker C — no output is traceable to a prompt version

Nothing stored alongside a `QuizSession` or `Presentation` records which prompt produced it. Until that exists, an online (in-product) comparison is impossible and all evaluation must be offline. Adding a nullable `prompt_version` column to the generated-artifact tables is cheap and unlocks §7.3 later.

---

## 2. Phase 0 — Make Prompts Addressable

The goal is a registry the harness can enumerate, where selecting a variant changes nothing else about the call.

### 2.1 Target shape

One `prompts.py` per app, holding pure functions that return a string and nothing else:

```python
# quiz/prompts.py
from typing import Callable, Protocol

class QuizPromptFn(Protocol):
    def __call__(self, *, topic: str, num_questions: int,
                 difficulty: str, context: str) -> str: ...

def v1_baseline(*, topic, num_questions, difficulty, context) -> str:
    """Shipped prompt as of 2026-08-10. Do not edit — clone to a new variant."""
    ...

def v2_explicit_grounding(*, topic, num_questions, difficulty, context) -> str:
    ...

QUIZ_PROMPTS: dict[str, QuizPromptFn] = {
    "v1_baseline": v1_baseline,
    "v2_explicit_grounding": v2_explicit_grounding,
}

ACTIVE = "v1_baseline"
```

The service then takes an optional override and a strict flag:

```python
def _call_llm_for_quiz(topic, num_questions, difficulty, context,
                       *, prompt_variant: str | None = None,
                       strict: bool = False) -> GeneratedQuiz:
    prompt = QUIZ_PROMPTS[prompt_variant or ACTIVE](
        topic=topic, num_questions=num_questions,
        difficulty=difficulty, context=context,
    )
    ...
    except Exception:
        if strict:
            raise                      # evaluation path — never mask a failure
        return generate_quiz_mock(...) # production path — unchanged
```

**Why a registry rather than a database table:** prompts stay in version control, so `git blame`, code review, and rollback all work unchanged. A database-backed prompt store is the right answer once non-engineers edit prompts directly, but it is a much larger change and is not required to run experiments.

### 2.2 Rules for variants

- **Never edit a shipped variant in place.** Clone it, change one thing, give it a new key. Editing in place destroys the ability to reproduce past results.
- **Change one variable per variant.** A variant that rewrites the persona *and* adds few-shot examples *and* reorders the rules tells you nothing about which change helped.
- Keep the variant key descriptive (`v3_fewshot_distractors`, not `v3_new`).
- Record the prompt's SHA-256 in every result row so a result can always be traced to exact text.

### 2.3 Definition of done for Phase 0

- [ ] `prompts.py` exists for `quiz`, `presentation`, `rag`, `chats`, `transcription`
- [ ] Every shipped prompt is registered as `v1_baseline`, byte-identical to today's text
- [ ] `strict=True` disables the quiz mock fallback
- [ ] Existing tests in `server/tests/` still pass unchanged
- [ ] Generation is verified unchanged in behaviour — same input, same output shape

---

## 3. The Evaluation Dataset

### 3.1 Sourcing — do not use student uploads

Notebook files are personal academic material uploaded by identifiable users. **Do not copy production user documents into an eval corpus.** Build the corpus from material you control:

- Openly licensed university lecture notes and textbook chapters (OpenStax, MIT OCW, university course pages)
- Slide decks and PDFs authored by the team
- For transcription: recordings made by the team, or consented recordings, covering Bangla/English code-switching
- Anything a user has explicitly consented to donate, recorded as such

Store the corpus outside the repo if it is large; commit only the manifest and hashes.

### 3.2 Composition

Coverage matters more than volume. Target **60–100 items per task**, deliberately stratified rather than sampled at random:

| Axis | Levels to include |
|---|---|
| Subject | STEM-heavy (formulas, diagrams), humanities (prose), mixed |
| Document quality | Clean digital PDF, scanned/OCR-noisy, slide deck, handwritten-scan |
| Length | Short (< 3 pages), medium, long (> 30 pages) |
| Language | English-only, Bangla/English mixed (transcription especially) |
| Parameters | Every difficulty; question counts at 1, 5, 20, 50; slide counts at 3, 12, 30; all three text lengths |
| Adversarial | Near-empty context, off-topic query, context with contradictions, context with prompt-injection-looking text |

The adversarial slice is where prompt differences show up most sharply and where the baseline is most likely to be quietly bad. It should be at least 15% of each dataset.

### 3.3 Format

One JSONL file per task. The `context` is **frozen text**, not a live RAG call — otherwise retrieval drift is confounded with prompt changes.

```jsonl
{"item_id": "quiz-018", "task": "quiz_single_topic", "inputs": {"topic": "Krebs Cycle", "num_questions": 8, "difficulty": "HARD", "context": "..."}, "meta": {"subject": "biology", "doc_quality": "clean_pdf", "slice": "core"}, "notes": "context deliberately omits ATP yield figures"}
```

**Why freeze the context:** it makes runs reproducible and cheap, isolates the prompt as the only variable, and lets you hand-build adversarial contexts that retrieval would never return.

Retrieval quality is a separate problem with its own metrics (recall@k, MRR) and should get its own dataset later — do not entangle the two.

### 3.4 Versioning and holdout

- Version datasets as `quiz_v1.jsonl`; never mutate a version in place.
- Split **70% development / 30% holdout**. Iterate freely on dev; touch the holdout only to confirm a final candidate. This is the only defence against overfitting prompts to a fixed set of documents.
- Re-check the holdout gap at every promotion. A candidate that wins big on dev and ties on holdout was tuned to the dataset, not improved.

---

## 4. Metrics

### 4.1 Three tiers

| Tier | What it measures | Cost | Runs on |
|---|---|---|---|
| **1 — Deterministic** | Schema, counts, ratios, lengths, duplicates | Free | Every generation |
| **2 — Model-graded** | Groundedness, correctness, difficulty calibration, distractor quality | ~$ per run | Every generation |
| **3 — Human** | Ground truth on a sample; validates Tier 2 | Expensive | 50-item sample per judge |

Tier 1 is a **gate**, not a ranking: a variant that drops below baseline on any hard-constraint metric is rejected regardless of how well it judges. Tier 2 produces the ranking. Tier 3 exists to prove Tier 2 can be trusted.

### 4.2 Tier 1 — deterministic checks

**Measure compliance on the raw model output, before the code's own repair steps.** The services strip markdown fences, pad or truncate `image_queries`, and clamp titles. Those repairs hide instruction-following failures that are real quality signals. Record both `raw_*` (pre-repair) and `final_*` (post-repair) — a variant that needs less repair is genuinely better behaved.

**Quiz** (both variants)

| Metric | Definition | Type |
|---|---|---|
| `raw_json_parse_rate` | Parses as JSON with no fence-stripping | Hard gate |
| `question_count_accuracy` | `returned == requested` | Hard gate |
| `mcq_choice_arity` | Every MCQ has exactly 4 choices | Hard gate |
| `answer_in_choices` | `correct_answer` exactly matches one choice | Hard gate |
| `tf_wellformed` | TRUE_FALSE has `choices == []` and answer in {True, False} | Hard gate |
| `type_mix_deviation` | \|actual MCQ share − 0.70\| | Soft |
| `duplicate_rate` | Pairs with embedding cosine > 0.95 | Soft |
| `explanation_nonempty` | Share of questions with a non-empty explanation | Soft |
| `mock_fallback_rate` | **Must be 0.** Non-zero invalidates the run | Integrity |

**Presentation**

| Metric | Definition | Type |
|---|---|---|
| `slide_count_accuracy` | `len(slides) == slide_count` | Hard gate |
| `layout_validity` | Every layout in `LAYOUTS` | Hard gate |
| `raw_image_query_arity` | `len(image_queries) == LAYOUTS[layout].image_count` before padding | Hard gate |
| `visual_density` | Share of image-bearing slides; target band 0.50–0.70 | Soft |
| `bullet_length_mae` | Mean abs. error vs 8 / 15 / 25 words for BRIEF / BALANCED / DETAILED | Soft |
| `generic_title_rate` | Titles matching `^(Introduction\|Conclusion\|Overview of\|Summary)` | Soft |
| `layout_field_compliance` | body-text has `body_text`; quote has both quote fields; two-images has exactly 2 bullets ≤12 words; full-image caption <15 words | Soft |
| `order_index_valid` | 0-based and sequential | Hard gate |

**Topic extraction**

`topic_count ≤ 5` · `word_count ∈ [3,7]` per topic · pairwise distinctness (cosine < 0.9) · generic-topic rate against the prompt's own bad examples (`Science`, `Biology`, `Chapter 1`) · raw JSON-array parse rate.

**Notes generation**

Required headings present (`## Logistics` only when the transcript contains logistical content; `### Key Concepts` / `### Details` / `### Examples` per topic) · markdown parses · **truncation rate** (`stop_reason == "max_tokens"`, a live risk at 8192 tokens) · English-output rate via Bengali-script character ratio · formula preservation.

**Chat**

Mostly Tier 2, plus one targeted behavioural check the prompt explicitly promises: feed a context of `No specific notebook context found.` and assert the reply declines to answer. Report `appropriate_refusal_rate` on the adversarial slice — this is the cheapest, sharpest chat metric available.

### 4.3 Tier 2 — model-graded

**Judge configuration**

- **Judge with Sonnet 4.6, grading Haiku output.** Never let a model judge its own output at the same capability level.
- Judge temperature **0**.
- Require the judge to **quote the supporting span** before scoring. Forcing evidence extraction materially reduces sloppy grading.
- Judge one dimension per call. Combined rubrics blur into a halo score.

**Two complementary modes**

1. **Pairwise preference** — show both variants' outputs for the same input, **randomize which is labelled A and B**, ask which better satisfies the rubric. Report win rate. Position bias is real and randomization is the fix; also run a small order-swapped subset to quantify residual bias.
2. **Absolute rubric scoring** — 1–5 against a written rubric. Weaker discrimination, but comparable across time, which pairwise is not. Use it for the long-run regression baseline.

**Dimensions**

| Task | Dimension | Rubric anchor |
|---|---|---|
| All generative | **Groundedness** | Every factual claim traceable to the supplied context; count unsupported claims per output |
| Quiz | Answer correctness | Is the marked answer actually correct given the context |
| Quiz | Distractor plausibility | Wrong options should be plausible-but-wrong, not absurd or trivially eliminable |
| Quiz | Difficulty calibration | Does the item match the requested EASY/MEDIUM/HARD band |
| Quiz | Coverage | Do questions span the context rather than clustering on one passage |
| Deck | Narrative coherence | Do slides build in a sensible order without redundancy |
| Deck | Layout appropriateness | Does the chosen layout suit the content, per the rulebook's use-when/avoid-when |
| Chat | Faithfulness / helpfulness / appropriate refusal | Answers only from context; declines when context is thin |
| Notes | Completeness | Are all explained concepts from the transcript captured |

**Groundedness is the priority metric.** Every generative prompt in the codebase explicitly claims it ("Base every question on the provided content only", "Do NOT introduce facts, names, or numbers absent from the provided content"). It is the quality the prompts promise and the one users are least able to detect on their own.

### 4.4 Tier 3 — validating the judge

An unvalidated LLM judge is a number generator. Before any judge result is used to make a shipping decision:

1. Sample 50 outputs spanning the quality range.
2. Have two team members label them independently against the same rubric.
3. Compute human–human agreement first — if humans disagree, the rubric is broken, not the judge.
4. Compute judge–human agreement (Cohen's κ for categorical, Spearman ρ for ordinal).
5. **Accept the judge only at κ ≥ 0.6 / ρ ≥ 0.7.** Below that, rewrite the rubric and repeat.

Re-validate whenever the rubric or judge model changes. Record the validation in the results directory alongside the runs it licenses.

### 4.5 Guardrails

Tracked on every run; a regression here can veto an otherwise-winning variant:

- **Cost** — input/output tokens and USD per generation. A longer prompt that wins by 2pp on groundedness may not be worth 40% more tokens on every request.
- **Latency** — p50 and p95 wall time. Deck generation already runs one call per slide; prompt growth multiplies across slides.
- **Failure rate** — exceptions, timeouts, unparseable output.
- **Truncation rate** — outputs hitting `max_tokens`.

---

## 5. Experiment Design

### 5.1 Paired, replicated, pre-registered

- **Paired:** every variant sees the identical item set. Never compare across different inputs.
- **Replicated:** temperatures run 0.3–0.5 for quiz and deck prompts, so a single run per item is noise. Use **n = 3 replicates** per item per variant; average within item to get one score per item, then compare at the item level. (Topic extraction runs at temperature 0 and needs fewer replicates.)
- **Pre-registered:** before running, write down the primary metric, the minimum effect worth shipping, and the stop rule. Post-hoc metric selection across ~15 metrics will manufacture a "winner" from noise every time.

A pre-registration is three lines in the experiment config:

```yaml
experiment: quiz_v2_explicit_grounding
primary_metric: groundedness_mean
minimum_effect: +0.05          # below this, not worth the token cost
guardrails: [answer_in_choices, question_count_accuracy, cost_usd_per_gen]
secondary: [distractor_plausibility, difficulty_calibration, duplicate_rate]
```

### 5.2 Statistics

`numpy`, `pandas`, and `scipy` are already in `requirements.txt` — no new dependencies.

- **Paired bootstrap over items** (10,000 resamples) for the difference in means. Report the point estimate and a 95% CI. This works for both proportions and continuous scores and makes no normality assumption.
- **Report the CI, not just a p-value.** "Groundedness +0.07, 95% CI [0.02, 0.12]" is decision-ready; "p = 0.03" is not.
- **Ship on the CI lower bound** clearing your minimum effect, not on the point estimate.
- **Correct for multiple comparisons** (Holm–Bonferroni) across secondary metrics. The primary metric is exempt because it was pre-registered.
- For pairwise judge results, a binomial test on the win rate against 0.5, excluding ties.

```python
def paired_bootstrap(a: np.ndarray, b: np.ndarray, n: int = 10_000, seed: int = 0):
    """a, b: per-item scores, same length, same order (paired)."""
    rng = np.random.default_rng(seed)
    diff = b - a
    idx = rng.integers(0, len(diff), size=(n, len(diff)))
    boot = diff[idx].mean(axis=1)
    return float(diff.mean()), (float(np.percentile(boot, 2.5)),
                                float(np.percentile(boot, 97.5)))
```

### 5.3 How many items

With 60–100 items you can resolve roughly a 6–10 percentage-point difference on a proportion — adequate for the coarse prompt changes worth making, and not enough for 1–2pp tuning. **Do not chase differences smaller than your resolution.**

Run a pilot on 20 items first to measure the actual item-level variance, then size the real run from that rather than from this rule of thumb.

---

## 6. The Harness

### 6.1 Layout

`pytest.ini` sets `testpaths = tests`, so a sibling `evals/` directory is **not** collected by the test suite. That separation is deliberate: evals are slow, cost money, and are legitimately non-deterministic. They must never gate a normal `pytest` run.

```
server/evals/
  __init__.py
  run.py                  # CLI entry point
  config/                 # one YAML per experiment (pre-registration)
  datasets/
    quiz_v1.jsonl
    presentation_v1.jsonl
    chat_v1.jsonl
    corpora/manifest.json
  metrics/
    deterministic.py      # Tier 1
    judge.py              # Tier 2 rubrics + judge client
    stats.py              # bootstrap, Holm-Bonferroni
  runners/                # one per task; calls the service in strict mode
  cache/                  # keyed by sha256(model + prompt + params)
  results/                # append-only JSONL, one dir per run_id
  README.md
```

### 6.2 CLI

```bash
cd server && source venv/bin/activate
python -m evals.run \
  --config evals/config/quiz_v2_explicit_grounding.yaml \
  --split dev \
  --replicates 3
```

```bash
python -m evals.run --config evals/config/quiz_v2_explicit_grounding.yaml --split holdout --replicates 3
```

```bash
python -m evals.report --run-id 2026-08-14T10-22-run7 --format markdown
```

**Response caching is mandatory.** Key on `sha256(model + prompt_text + params + replicate_index)`. Re-running a report, adding a metric, or re-judging existing outputs must not re-spend on generation. Expect roughly 480 generations for an 80-item, 3-replicate, 2-arm experiment, plus judge calls on each.

### 6.3 Result row

One JSON object per generation, append-only:

```json
{
  "run_id": "2026-08-14T10-22-run7",
  "experiment": "quiz_v2_explicit_grounding",
  "task": "quiz_single_topic",
  "variant": "v2_explicit_grounding",
  "prompt_sha256": "9f2c...",
  "item_id": "quiz-018",
  "replicate": 2,
  "split": "dev",
  "model": "claude-haiku-4-5-20251001",
  "params": {"temperature": 0.3, "max_tokens": 4096},
  "raw_output": "...",
  "parsed_ok": true,
  "used_fallback": false,
  "metrics": {"question_count_accuracy": 1.0, "answer_in_choices": 1.0, "groundedness": 0.86},
  "tokens": {"input": 4211, "output": 1877},
  "latency_ms": 5410,
  "cost_usd": 0.0121,
  "error": null
}
```

Storing `raw_output` is what lets you add a metric later and recompute across every historical run without regenerating.

---

## 7. Shipping a Prompt

### 7.1 Promotion checklist

A variant replaces `ACTIVE` only when all of the following hold:

- [ ] Every Tier 1 hard gate is **≥ baseline** (no regression on schema compliance)
- [ ] `mock_fallback_rate == 0` and `used_fallback` false across the run
- [ ] Primary metric improves, with the **95% CI lower bound above the pre-registered minimum effect**
- [ ] No guardrail regression: cost/generation, p95 latency, failure rate, truncation rate
- [ ] Result **replicates on the holdout split**
- [ ] If the decision rests on a judge, that judge has a current κ ≥ 0.6 validation
- [ ] Adversarial slice does not regress
- [ ] The winning variant and its result summary are committed together

### 7.2 Regression baseline

On promotion, freeze the new scores as the baseline in `evals/results/baselines/`. Every future experiment reports against it. Run the full baseline on a schedule (monthly, and before any model version change) — **model updates move prompt performance even when the prompt text is untouched**, and this is the only way to notice.

### 7.3 Offline is a proxy — close the loop later

Everything above measures prompt output quality, not learning outcomes. Once §1.4's `prompt_version` column exists, this codebase already emits useful implicit signals:

- **Slide revision rate** — how often students invoke the revise-slide feedback box. Fewer revisions per deck is a direct, unprompted quality signal for the draft prompt.
- **Quiz retake rate and score distribution** — a quiz that everyone aces may be too easy regardless of the requested difficulty.
- **Chat follow-up rate** — repeated rephrasing of the same question suggests unhelpful answers.
- **Transcription notes regeneration** — a direct dissatisfaction signal.

Treat these as the eventual arbiter and the offline metrics as the fast proxy. Do not run online experiments until offline evaluation is trustworthy — online iteration is far slower and exposes students to regressions.

---

## 8. Phasing

| Phase | Work | Exit criteria |
|---|---|---|
| **0** | Prompt registry, strict mode, `prompt_version` column | Prompts selectable by key; quiz fallback disable-able; existing tests green |
| **1** | Corpus + `quiz_v1.jsonl`, Tier 1 metrics, harness skeleton, caching | Baseline Tier 1 numbers for all 10 prompts, committed |
| **2** | Judge rubrics, judge client, 50-item human validation | κ ≥ 0.6 on the primary rubric |
| **3** | First real A/B — recommend starting with the chat persona | A promotion decision made against §7.1 |
| **4** | Remaining datasets, regression baselines, scheduled baseline run | Baselines frozen; monthly run scheduled |

**Start with the chat persona.** It is three sentences, already a pure function, has zero refactor cost, carries no tone/length/formatting instruction at all, and touches every user of the product. It is the largest expected gain for the smallest setup, and it exercises the whole harness end to end before the heavier quiz refactor.

---

## 9. Traps

- **The mock fallback (§1.3).** Highest risk in this plan. Verify `used_fallback` is false on every row before reading any quiz result.
- **Judging with the model under test.** Haiku grading Haiku inflates scores. Judge with Sonnet.
- **Position bias in pairwise judging.** Randomize A/B order; measure residual bias on a swapped subset.
- **Overfitting to the dev set.** The holdout is the control. A large dev win with a holdout tie means the prompt was tuned to those documents.
- **Metric shopping.** Fifteen metrics and no pre-registration guarantees a false winner. Pre-register or don't ship.
- **Goodhart.** Schema compliance is necessary, not sufficient. A prompt can hit every structural target and still produce boring, poorly grounded questions — which is exactly why groundedness is the primary metric and why §7.3 exists.
- **Silent repair masking failures.** Fence-stripping and `image_queries` padding hide non-compliance. Always measure raw output.
- **Model drift.** Pinned model IDs change behaviour on provider updates. Re-baseline on any model change before attributing a shift to a prompt.
- **Prompt injection from document content.** Uploaded documents flow into `{context}` unfiltered. Keep injection-shaped items in the adversarial slice so a prompt change that weakens resistance is caught.
- **Comparing across changed retrieval.** Frozen contexts exist for this reason. If retrieval changes, re-baseline rather than comparing across the change.

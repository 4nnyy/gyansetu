<p align="center"><img src="assets/logo.png" width="88" alt="GyanSetu logo"></p>

# GyanSetu

**Understand the concept behind the answer.**

GyanSetu is a web-based AI study companion built by **Aniket Kumar Gupta**. It helps learners ask questions in English, Hindi or Hinglish, understand the meaning of each step, and practise a related problem without leaving the conversation.

Built as a solo project for **Technosphere 2026**.

[GitHub upload](docs/GITHUB-UPLOAD.md) · [Demo guide](docs/DEMO.md) · [Architecture](docs/ARCHITECTURE.md) · [Judge questions](docs/JUDGE-QA.md) · [Evaluation](evaluation/LIVE-REVIEW-8.2.5.md)

## The problem

A correct final answer does not tell a learner why a formula applies, what its symbols mean, or how to solve the next question independently. GyanSetu brings those follow-ups into one focused study flow.

## What it does

| Learner need | GyanSetu behaviour |
| --- | --- |
| “Start from the basics” | Learn mode asks for prerequisite concepts, symbol meanings, conditions and worked reasoning. Exam mode requests a concise answer. |
| “I still do not understand” | Simplify and Explain a step work on the selected answer and its original context. |
| “Let me try” | Practice offers a related question, Check answer reviews an attempt, and Show solution is a separate action. |
| “Revise this answer” | Recap sends a short request containing only the selected question and answer. |
| “My question is in a photo” | Upload, preview, zoom and reuse a photo. Relevant follow-ups retain its reference. |
| “Explain in my language” | Auto, English, Hindi and Hinglish preferences, with explicit language requests taking precedence. |
| “Keep the interface simple” | Study tools stay collapsed. Copy/Edit use a compact message menu, with long-press, right-click and keyboard paths. |
| “Continue later” | Chats and preferences stay in this browser. Photos use IndexedDB. There is no account or cross-device sync. |

Voice input and Listen depend on browser support and permissions.

## Current status

- **Source version:** 8.2.5.
- **Last checked public demo:** [gyansetu-by-4niket.vercel.app](https://gyansetu-by-4niket.vercel.app/).
- That URL served **8.1.1** on 17 October 2026. It is an older live example, not validation of the 8.2.5 source.
- **173 automated tests passed** in the recorded Node 24 run. Provider mocks test application behaviour; they do not establish AI correctness, capacity or handwriting accuracy.
- Latest-source live AI review, real-device checks and a budgeted concurrency test remain pending.

See the [dated review](evaluation/LIVE-REVIEW-8.2.5.md) for the ten controlled live attempts, timing limitations and answer-quality findings.

## Technology

| Layer | Implementation |
| --- | --- |
| Interface | HTML, CSS and vanilla JavaScript |
| Backend | Node.js 24, Vercel serverless function at `/api/chat` |
| AI services | Groq-hosted models and Google Gemini, configured through server environment variables |
| Answer display | Vendored marked 18.1.0, restricted Markdown rendering and on-demand MathJax 3.2.2 |
| Browser storage | localStorage for chats/preferences, IndexedDB for photos |
| Tests | Node test runner, linkedom and fake-indexeddb |

The project uses hosted models. It does **not** train its own foundation model. The project contribution is the tutoring workflow, context handling, interface, request routing and recovery logic.

## Run locally

Use **Node.js 24.x**. Open the folder containing `package.json`, `index.html` and `vercel.json`.

```sh
npm ci
npm test
```

To exercise the full frontend and serverless API locally:

1. Copy `.env.example` to `.env.local`.
2. Fill in at least one valid server-side provider key.
3. Run the Vercel development environment:

```sh
npx vercel dev
```

Follow the CLI's project selection prompts and use the local URL it prints. Opening `index.html` alone does not run `/api/chat`. See the [official Vercel dev reference](https://vercel.com/docs/cli/dev).

### Environment variables

| Variable | Purpose |
| --- | --- |
| `GROQ_API_KEY` | Groq text and vision requests |
| `GEMINI_API_KEY` | Gemini requests, preferred for photos |

At least one valid key is required for AI answers; configuring both enables independent provider fallback. Never put keys in HTML, browser JavaScript, screenshots or Git commits. The included `.gitignore` excludes real environment files and retains only `.env.example`.

## Deploy

The app has no frontend compilation step. Keep `api/`, `assets/`, `lib/`, `index.html`, `package.json` and `vercel.json` at the project root. Configure the two environment variable names above in the intended Vercel environment.

Use a preview first and test text, recap, photo, retry and language behaviour before promoting. Detailed steps are in [START-HERE.md](START-HERE.md). This repository upload does not itself deploy or update an existing website.

## Repository guide

| Path | Responsibility |
| --- | --- |
| `index.html`, `assets/` | Conversation UI, rendering, photo storage/viewer, onboarding and message controls |
| `api/chat.js` | Request handling, provider routing, time budget, recovery and response headers |
| `lib/tutor.js`, `lib/recap.js` | Teaching policy and selected-answer recap instructions |
| `lib/request-security.js`, `lib/image.js` | Request and image validation |
| `lib/quality.js` | Mechanical response checks and bounded repair |
| `tests/` | Automated application tests |
| `evaluation/` | Human-review scenarios and dated observations |
| `docs/` | Demo, architecture, judge Q&A and release history |

## Reliability and privacy

Requests use a bounded server deadline and configured fallback routes. At most one eligible automatic recovery is allowed; explicit short cooldowns are respected. Exhausted quota or invalid credentials cannot be fixed by retrying.

Chat history is browser-local, but answering a question sends its relevant text and any attached photo to the configured AI service. The app is not an offline AI model. Basic request checks and safe rendering are included; authentication, shared abuse limits, per-user quotas and production monitoring are still planned.

Read [SECURITY-AND-RELEASE.md](SECURITY-AND-RELEASE.md) for the current controls and remaining release work.

## Roadmap

- Validate the latest source with real students, teachers and phones.
- Measure response times, failure types and cost under a controlled pilot.
- Add verified access, shared quotas and answer reporting.
- Evaluate learning through an unseen question after an explanation.
- Consider an Android package after the web experience is validated.

These are planned improvements, not existing features.

## Creator and licensing

Created by **Aniket Kumar Gupta**, independent developer.

No project-wide open-source license has been selected. The vendored marked library retains its [MIT license](assets/vendor/marked-LICENSE.txt); see [third-party details](assets/vendor/README.md).

Detailed change notes are preserved in [RELEASE-HISTORY.md](docs/RELEASE-HISTORY.md).

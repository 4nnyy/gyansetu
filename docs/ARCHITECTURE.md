# Architecture

Source version 8.2.5.

## Request flow

1. The browser collects the question, response mode, language preferences and relevant conversation context. Images are validated and prepared before sending.
2. A same-origin JSON POST reaches `api/chat.js`. The endpoint validates the request, normalizes context and resolves response language.
3. Creator-only questions can return a fixed developer attribution. Other requests build a tutoring policy, or a dedicated short recap policy.
4. Text requests prefer Groq. Image requests prefer Gemini, with an independent configured alternative when available. Credentials remain on the server.
5. Mechanical response checks can trigger a bounded repair. The browser safely renders the returned Markdown and mathematical notation.
6. The browser saves chat state locally and image bytes in IndexedDB. Relevant image references are reused on photo follow-ups.

## Responsibilities

| Module | Purpose |
| --- | --- |
| `api/chat.js` | Provider adapters, routing, request budget and failure recovery |
| `lib/tutor.js` | Normalized teaching context and mode-specific instructions |
| `lib/recap.js` | Concise revision of the selected answer |
| `lib/quality.js` | Truncation, markup, script and repetition checks |
| `lib/service-status.js` | Service error classification and cooldown metadata |
| `lib/identity.js` | Developer attribution |
| `lib/image.js` | Image type, signature and payload checks |
| `lib/request-security.js` | Request-origin, content-type and body boundaries |
| `assets/answer-renderer.js` | Restricted Markdown and math rendering |
| `assets/photos.js`, `assets/photo-viewer.js` | IndexedDB, image references, preview and reuse |
| `assets/reply-language.js` | Client-side language selection |
| `assets/message-menu.js` | Copy/Edit/Select text interaction |
| `assets/onboarding.js` | First-visit guide and replay |

## Provider configuration

Model names are defined in `api/chat.js`. Current source configures Groq text with `openai/gpt-oss-120b`, Groq vision with `qwen/qwen3.8-27b`, and Gemini candidates `gemini-3.8-flash`, `gemini-3.7-flash`, `gemini-3.6-flash`. These are source settings, not a guarantee that an account can access every model.

## Bounded recovery

The server has a 35-second overall budget; the Vercel function is configured for 45 seconds and the browser stops waiting at 40 seconds. A configured independent provider can be tried when appropriate. At most one automatic recovery follows for eligible transient failures or an explicit 1–3 second cooldown, with the supplied wait honoured.

Unknown or longer rate limits, daily quota, authentication/payment failures and insufficient remaining time do not gain an automatic retry. The code does not cycle sibling models to evade a shared service limit.

## Data and security boundaries

The app has no login or central chat database. Browser-local storage is specific to the browser and origin. Questions, relevant context and attached images still travel to configured AI providers for inference.

CSP, safe response rendering, body/image checks and same-origin request validation reduce specific risks. They are not authentication or a shared abuse limiter. There is no verified concurrency capacity, end-to-end privacy certification or automatic factual correctness checker.

## Intentional scope

No foundation-model training, retrieval knowledge base, autonomous agent, mastery scoring, cloud synchronization or Android AAB is included. These terms should not be used to describe the current implementation.

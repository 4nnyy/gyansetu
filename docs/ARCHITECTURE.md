# Architecture

GyanSetu has a buildless HTML/CSS/JavaScript interface and a Node.js serverless API on Vercel. There is no central chat database.

## Request flow

1. The browser sends a question, mode, language preference and relevant conversation context to `/api/chat`.
2. The endpoint validates the request and any image, normalizes context and selects the response language.
3. A normal question uses the tutoring instructions. Recap uses a smaller request containing only the selected question and answer.
4. Text requests prefer Groq; photo requests prefer Gemini. A configured alternative can handle eligible failures.
5. The response is checked for mechanical defects, then rendered as restricted Markdown and mathematical notation.
6. Chat state is saved in localStorage and photos in IndexedDB.

## Modules

| Module | Responsibility |
| --- | --- |
| `api/chat.js` | Provider adapters, routing, deadlines and recovery |
| `lib/tutor.js` | Conversation context and teaching instructions |
| `lib/recap.js` | Selected-answer revision |
| `lib/quality.js` | Truncation, markup, language and repetition checks |
| `lib/service-status.js` | Error classification and cooldown metadata |
| `lib/request-security.js`, `lib/image.js` | Request and image validation |
| `assets/answer-renderer.js` | Markdown and math rendering |
| `assets/photos.js`, `assets/photo-viewer.js` | Photo storage and preview |
| `assets/reply-language.js` | Language selection shared by client and server |
| `assets/message-menu.js`, `assets/onboarding.js` | Message controls and first-visit guide |

## Reliability

The server has a 35-second request budget, inside the 45-second Vercel function limit. The browser stops waiting after 40 seconds.

Recovery is limited to one eligible retry after configured fallbacks. A known short cooldown is respected. Invalid credentials, exhausted quota and unknown or long rate limits do not trigger automatic retries. Responses with observable formatting or truncation defects can receive one repair attempt within the remaining budget.

Model IDs and routing live in `api/chat.js`. Provider access, account quota and answer accuracy must be checked on the deployed app.

## Security and storage

- Provider keys are read from server environment variables.
- The endpoint checks method, content type, origin, body size and image payloads.
- API responses use `no-store`. Model-supplied HTML is not executed.
- A Content Security Policy restricts scripts, framing and network destinations.
- Chats and photos remain local to their browser and origin. Requests still send relevant content to AI providers.

The endpoint currently has no user authentication or shared rate limiter. Origin checks are not authentication. Add verified access, shared quotas and monitoring before a wider rollout.

Inline scripts in `index.html` are covered by CSP hashes. After changing them, run `npm run security:headers` and `npm test`, then commit the updated `vercel.json` with the source.

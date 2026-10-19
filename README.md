# GyanSetu

A study companion for understanding concepts, practising questions and revising in English, Hindi and Hinglish.

Built by **Aniket Kumar Gupta**, independent developer.

## Features

- **Learn and Exam modes** for detailed explanations or concise answers.
- **Explain a step, Simplify and Practice** for working through an answer.
- **Recap** for revising a selected answer without restarting the lesson.
- **Photo questions** with preview, zoom and follow-up context.
- **Language preferences** and browser-local chat history.
- A compact message menu for copy and edit; study tools stay collapsed.

Voice input and read-aloud depend on browser support.

## Development

Requires Node.js 24.

```sh
npm ci
npm test
cp .env.example .env.local
npx vercel dev
```

Set at least one provider key in `.env.local` before starting the development server:

| Variable | Purpose |
| --- | --- |
| `GROQ_API_KEY` | Text and vision requests |
| `GEMINI_API_KEY` | Gemini requests, preferred for photos |

Keys stay on the server. Configuring both services enables provider fallback. Keep real environment files out of Git.

## Deployment

Use the existing Vercel project and connect this repository under **Settings → Git**. Set `main` as its production branch and configure the environment variables above in Vercel.

Once connected, pushes to `main` deploy to the existing production URL; other branches create previews. Changes must be committed and pushed to GitHub to trigger a deployment. There is no need to delete the project or upload another ZIP.

The app uses the **Other** framework preset, Node.js 24 and the repository root. `npm run build` copies the interface and assets into `public/`, the only directory served as static files. Server modules stay outside that directory. Check the core flows in [Testing](docs/TESTING.md) before releasing a preview.

## Project structure

| Path | Purpose |
| --- | --- |
| `index.html`, `assets/` | Chat interface, answer rendering and browser storage |
| `api/chat.js` | Serverless endpoint and provider routing |
| `lib/` | Teaching instructions, context, validation and error handling |
| `tests/` | Automated regression tests |
| `scripts/`, `evaluation/cases.js` | Security-header maintenance and answer review tools |

See [Architecture](docs/ARCHITECTURE.md) for request flow and implementation details.

## Status and privacy

Source version: **8.2.5**. The automated suite covers application behaviour using provider mocks; live answer quality and device checks are separate. The latest source still needs a live deployment check.

Chats and photos are stored in the current browser. Relevant questions, context and attached photos are sent to the configured AI service for answers. The app has no account or cross-device sync. Shared usage limits and production monitoring remain to be added before a wider public rollout.

The project uses hosted AI models. Third-party licensing is documented in [assets/vendor](assets/vendor/README.md). No project-wide open-source license has been selected.

# Judge questions and honest answers

Prepared for Aniket Kumar Gupta, GyanSetu, Technosphere 2026.

## What problem are you solving?

Students can receive the final answer yet remain confused about the meaning of a symbol or the reason for a step. GyanSetu keeps explanation, targeted follow-up, practice and recap inside one conversation.

## Who is the first user?

A learner revising independently who needs beginner-friendly explanations in English, Hindi or Hinglish. This is the intended audience, not a measured user-base claim.

## How is it different from a general chatbot?

Its contribution is a focused study workflow: selected-answer context, Explain a step, Practice with a separate attempt/check flow, recap and language preferences. General chatbots can also explain concepts. The stronger claim to test is whether this workflow helps a learner solve a new problem with less effort.

## Did you build your own AI model?

No. The app uses hosted models through Groq and Google Gemini. I built the application, tutoring workflow, context management, interface, provider routing and recovery logic with AI-assisted development tools.

## What did you personally own?

Product scope, the learner journey, integration decisions, evaluation and final responsibility for the project. Be ready to walk through the code you understand. Do not claim every line was written without assistance.

## Why this stack?

HTML, CSS and vanilla JavaScript keep this prototype buildless. A Node serverless endpoint separates provider credentials from the browser. The current scope does not need a large frontend framework or a central account database.

## What happens when an API fails?

The app classifies the failure, uses appropriate configured fallback, preserves the question and bounds recovery. Explicit short cooldowns are respected. Quota exhaustion, invalid keys and prolonged service failures remain real limits.

## Why did earlier questions sometimes fail or feel slow?

The observed live app returned one service-limit message in ten controlled attempts; a later retry succeeded. Photo inference was noticeably slower in that small sample. Runtime provider logs were unavailable, so the exact account limit and bottleneck were not confirmed.

## What evidence supports the project?

The recorded source test run has 173 passes. A separate older-live-build review records ten controlled attempts, nine answers and one visible service-limit failure. It also records incorrect or overgeneralized content. These are application checks and small observations, not a benchmark or proof of improved learning.

## How do you prevent hallucinations?

Instructions request grounding in the question, clarification of ambiguous images, and cautious claims. Mechanical checks detect some response defects. They cannot guarantee factual correctness; human evaluation and answer reporting are needed.

## How are student data and API keys handled?

Keys stay in server environment variables. Chats/preferences stay in localStorage and photos in IndexedDB on that browser. Relevant prompts/context and attached photos are sent to the configured AI service to answer the question. There is no cross-device account sync.

## Can it support thousands of students?

That capacity has not been tested. Before a wider launch I need verified access, an atomic shared rate limiter, per-user quotas, provider budgets, monitoring and a controlled concurrency test.

## What is the cost or business model?

No defensible per-student cost or revenue has been measured yet. Cost depends on model, token usage, photo requests and provider limits. The next step is a small pilot that measures those costs before deciding free limits or pricing.

## How will you measure learning?

Give a learner a new question after the explanation, assess their reasoning and compare completion outcomes with an agreed baseline. This is a proposed evaluation, not an existing feature or proven result.

## What is next?

Validate 8.2.5 live on real phones with students and teachers, measure reliability and cost, add verified access/quotas and reporting, and only then consider Android packaging.

## Is GitHub the same as deployment?

No. GitHub hosts and versions the source. Vercel runs the web app and serverless endpoint. Uploading this source does not change the current website unless a separate deployment integration is configured.

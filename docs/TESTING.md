# Testing

## Automated checks

```sh
npm ci
npm test
node scripts/security-headers.js --check
```

The Node test suite covers request validation, provider failure handling, recap context, language selection, Markdown rendering, photo storage, onboarding and message interactions. Provider responses are mocked; a passing suite does not measure real answer quality or service capacity.

## Preview check

Before releasing a new deployment:

1. Ask a concept question in Learn mode. Check the explanation, formula symbols and worked steps. Switch to Exam mode and check that the answer is concise.
2. Use Explain a step, Practice, Check answer and Show solution. Confirm each action uses the selected answer and the learner's attempt.
3. Recap an older answer after changing the topic. It should summarize that answer, in the selected language, without unrelated chat context.
4. Try English, Hindi and Hinglish, including an explicit language change during a conversation.
5. Upload a clear photo, preview and zoom it, ask a follow-up and reopen the chat. Compare the transcription and answer with the original image. Repeat with actual handwriting.
6. Check Copy and Edit on desktop and a real phone. Scrolling and selecting text should not accidentally open the message menu.
7. Check a service failure and Retry. The question must remain available; the interface should respect any returned cooldown.
8. Reload and reopen a chat. Verify preferences, saved messages and photos, and check that formulas render without blocked core scripts.

## Answer review tools

`evaluation/cases.js` contains 43 scenarios across subjects and follow-up conversations. Collect a small sample against a configured preview:

```sh
node scripts/evaluate.js --list
node scripts/evaluate.js --url https://your-preview.vercel.app --limit 3 --out reports/answers.json
```

For a photo and follow-up:

```sh
node scripts/evaluate-photo.js --url https://your-preview.vercel.app --image question.jpg --out reports/photo.json
```

These commands make real provider requests and use quota. Use synthetic questions and non-sensitive images. Review correctness, prerequisites, reasoning, clarity and completeness; human scores stay empty until reviewed. Keep collected reports outside version control.

The latest source still needs a live provider and device check. Concurrency and handwriting accuracy have not been established.

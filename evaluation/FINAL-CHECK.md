# Engineering re-check — GyanSetu 8.2.3

13 October 2026 · UI/package 8.2.3 · Teaching API marker `basics-v8` · Node engine `24.x`

## Scope and observed evidence

Aniket supplied four screenshots: an unsolicited provider explanation after a creator question, a Recap request in progress, the rate-limit error, and a seven-option message dialog. In the supplied source, that error text came from a failed provider request with status 429. The screenshots do not identify which provider/account limit was reached. No deployment logs or account quota were available to establish that cause more precisely.

The story checked is: message hold/action → selected-answer request → API/provider handling → reply or actionable failure, while preserving the original chat, selected source and unsent draft/photo.

## Changes

- The always-visible mobile subject strip is removed. A collapsed subject selector now sits inside the Chats drawer and at the bottom of the desktop sidebar. Its current choice remains labelled. Selecting a subject closes the picker/drawer while preserving an empty-chat draft. Keyboard focus skips collapsed options and includes expanded options, without making them inert. The existing home heading has a muted gold accent; the two example prompts remain.
- Common creator-only questions in English, Hinglish and Hindi have a fixed, quota-free answer crediting Aniket Kumar Gupta as GyanSetu's independent developer. Broader creator questions have an explicit instruction not to volunteer provider details. Direct technology questions remain truthful; no claims of training the underlying models or invented qualifications.
- The GPT-OSS text adapter previously sent an unsupported `reasoning_format` option. It now uses `include_reasoning: false`; Qwen keeps its supported hidden format. A model-contract test rejects the old option on both the initial request and bounded repair. This source bug is not proof of the cause of the screenshot's 429.
- Recap now uses a dedicated compact instruction, not the complete tutor instruction. Only the selected question/answer is included; unrelated history, duplicate source text and old photo bytes are excluded. The original photo reference survives for later photo follow-ups. Recaps do not force a new lesson, practice question or exam takeaway.
- Rate-limit failures return HTTP 429, a stable code and a known Retry-After delay where provided. Daily quota codes are distinguished from temporary limits. A quota failure on one provider plus a transient failure on another does not imply all provider capacity is exhausted. Unknown/daily limits have no invented countdown. A later fallback failure cannot hide an earlier rate-limit signal. Exhausted providers are not repeatedly called in the same request.
- Retry waits for the supplied delay. It resends the same request without duplicating the question or consuming an unrelated composer draft. Closing its chat stops the countdown. Error text is quieter and does not invent a high-traffic explanation.
- Long-press/right-click opens only Copy/Select text and, for the user's own editable question, Edit. No message ellipsis or study-action grid. The small copy icon copies directly; hold/right-click opens a compact menu near the message instead of dimming the whole page. Study tools remain available in a separate collapsed disclosure; the guide reflects the new location. Existing selection, keyboard, copy fallback and edit semantics are retained.

## Verification

**161/161 automated tests passed**, with zero failures, skips or cancellations (Node 24.19.0). Tests use mock provider responses, deterministic pointer events, real source modules and simulated DOM/storage/canvas APIs. They are not scores for live AI or real-device appearance.

Regressions cover source-only Recap on both provider adapters, chosen recap language, provider delay forwarding, unknown/daily quotas, mixed fallback errors, creator credit and technical-question routing, photo-free recap with preserved later photo context, and Retry countdown/no duplicate question. Existing menu integration checks verify the separated study controls. Drawer and subject-selection checks now cover collapsed/expanded keyboard focus, preserved drafts, repeated selections, mobile dismissal and desktop Escape/focus restoration.

The CSP hashes are regenerated after the inline client changes and checked by the security test. Packaging checks file integrity, actual extraction, asset references and package/UI versions.

## Remaining boundaries

- External AI: no live provider keys are available locally. Provider fallback and Recap success were simulated; actual account quota, generated recap quality and latency remain unverified. Smaller requests reduce unnecessary work; they do not add credits, remove usage limits or guarantee availability.
- Browser: the supplied old-build screenshots were inspected. A previous local Chromium install was unavailable. The remote browser cannot reach the local server, and its security policy blocks local file URLs. The prior public URL `https://gyansetuin.vercel.app/` returned `404 DEPLOYMENT_NOT_FOUND` on 13 October 2026. No new desktop/mobile screenshot or real touch/pixel result is claimed.
- Creator prompt compliance outside the narrow fixed questions still depends on the model. The fixed creator responses themselves are tested without a provider.
- No production deployment, full security audit, load test, handwriting evaluation, Android build or Play submission was performed. Auth, shared quotas/spend limits and full privacy/reporting flows remain launch work.

## Preview acceptance checks

1. Confirm page meta version `8.2.3` after deploying this exact source to the same existing project.
2. Ask `Tumhe kisne banaya hai?` and `Who created you?`; verify developer credit in the chosen language. Ask explicitly about the technology separately; the answer must be truthful.
3. Hold/right-click a message: Copy/Select text only; own questions also Edit. Scroll without accidentally opening the menu. Test keyboard and clipboard fallback.
4. Open Study tools on an older matrix answer, then Recap. Verify the correct selected answer, language, symbols and conclusion. Keep an unsent draft/photo and confirm both remain.
5. Recap a photo-derived answer, then ask a photo follow-up; the original photo should still be available. Test known retry delay and exhausted quota separately using account logs; do not deliberately consume the account allowance.
6. Check 320–430 px phones with keyboard open, long answers and native text selection before broad sharing. Verify no subject strip above the chat; open Chats → Subject, select a subject, confirm the drawer closes and an unsent draft stays. Check the sidebar on desktop and scroll inside the drawer on a short landscape screen.

References consulted: https://console.groq.com/docs/reasoning, https://console.groq.com/docs/rate-limits and https://ai.google.dev/gemini-api/docs/api-errors (13 October 2026). Use `START-HERE.md` for deployment and `SECURITY-AND-RELEASE.md` for release limits.

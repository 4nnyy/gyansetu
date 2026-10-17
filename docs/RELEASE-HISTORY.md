# GyanSetu — Request efficiency and cooldown recovery · 8.2.5

Prepared for Aniket Kumar Gupta, 17 October 2026. UI version: `8.2.5` (page meta tag). Teaching API release marker: `basics-v8`.

This package updates the supplied project and earlier upgrades. It has NOT been deployed. Three synthetic conversations were checked in the existing public app at https://gyansetuin.vercel.app/ on 9 October 2026; those are old-build baseline observations, not v7 validation. Read `evaluation/V7-REVIEW.md` for findings, evidence and remaining checks.

## Reliability and latency review · 17 October 2026

- The ordinary-request system instruction is 6,821 characters instead of 17,442 (about 61% smaller by character count). Basics-first teaching, language, trust, formula-origin and accuracy rules remain; only the selected action and actual-image rules are added. The full user question and existing normalized history are unchanged. This is a measured payload reduction, not a measured 61% latency improvement.
- One recovery can now cover an explicit upstream rate-limit cooldown of at most three seconds, after independent configured fallbacks. It waits for the upstream delay and stays inside the 35-second deadline. Unknown/long limits, exhausted quotas and credentials/payment errors do not gain a retry. The previous bounded transient recovery remains.
- 173 automated tests passed. New tests cover actual wait-before-retry, unchanged context, independent-provider priority, no sibling-model rotation, long/unknown/quota/deadline limits and compact prompt requirements.
- On the live 8.1.1 app, 10 controlled AI attempts produced nine answers and one rate-limit message; the same failed calculus question later succeeded. Six directly timed successful text/action calls completed in about 2.2-3.6 seconds. A clear printed-photo request was still pending at 19.6 seconds and had answered by the 44.1-second observation. Timing includes browser instrumentation and is not a provider latency benchmark.
- Some live answer-quality issues remain: unqualified tuple/hashability advice, English recap despite a Hinglish source, an invented notice penalty and reversed hydration wording. A successful HTTP/UI response does not mean a fully correct answer. The newer policy reinforces qualifications and supplied-only notice rules; new-prompt live quality is not yet validated.
- This package is NOT deployed. Runtime logs and deployment inspection were blocked by Vercel scope authorization; the exact upstream limit and slow photo provider remain unconfirmed. Read `evaluation/LIVE-REVIEW-8.2.5.md` for evidence and limits. Earlier recovery history remains in `evaluation/RELIABILITY-8.2.4.md`.

## Latest layout cleanup

- The subject strip no longer occupies the top of the mobile conversation. Subjects are in a collapsed selector inside Chats; desktop uses the same compact selector in the sidebar. The selected subject remains labelled, and choosing it closes the selector without sending a question.
- The home screen keeps two example prompts and adds a muted gold accent to the existing heading. Study actions stay collapsed. Subject selection preserves an empty-chat draft; mobile drawer keyboard navigation includes the selector and skips its hidden options.
- Source/DOM review and automated checks are complete. On 16 October 2026, https://gyansetu-by-4niket.vercel.app/ served UI 8.1.1; one live maths answer and its Recap succeeded. That does not validate this undeployed 8.2.5 package. Latest-build phone, image, AI and load checks remain pending.

## Retained request and message fixes

- Creator-only questions credit independent developer Aniket Kumar Gupta without unsolicited provider names. Common English/Hinglish/Hindi creator questions have a fixed response without a model call. Direct technical questions remain truthful.
- Recap uses a dedicated short instruction and only the selected answer/question. It excludes unrelated history, duplicate source content and old photo bytes. Later photo follow-ups retain the original photo reference.
- HTTP 429, daily quota and temporary service failures have distinct codes. Known provider retry delays reach the client; Retry waits for that delay. Unknown/daily limits do not get a made-up countdown. This does not add provider credits or guarantee availability.
- The text-provider request uses supported reasoning controls on both initial and repair calls.
- Study actions are separated from the Copy/Edit menu and stay collapsed. The first-use guide matches these controls.

## Retained features

- The same four-step guide now has collapsed More options help in English, Hinglish and Hindi: depth choices, course, language overrides, photo reuse, Retry, Copy/Select text/Edit, Recap/Listen, practice controls and local chat retention. Each new step starts compact; manual replay also resets the disclosure.

- First-use four-step guide: choose reply language, find photo/mic, use Learn/Exam and message options, locate chats/subjects. Skip/Finish/Escape dismiss it. It does not repeat in the same browser after dismissal; saved existing users can open Preferences → Quick guide. Private browsing, cleared/blocked storage or a new origin can show it again.
- Hold a message for 500 ms on touch/pen or right-click it for a compact menu near the message. The small copy icon copies directly without opening that menu. The menu contains only Copy/Edit/Select text. Study tools sit below the answer in a separate collapsed disclosure. Scrolling, cancelled touches and a second finger cancel the hold; links, code and photo buttons retain their own behavior. Keyboard/right-click and Select text alternatives are included.
- Bare `<br>`, `<br/>` and `<br />` in generated Markdown render as line breaks, including table cards. HTML in code examples stays literal. Attributes, scripts and other raw HTML do not execute.
- Temporary Copy/Edit notices expire. Edited chats still preserve the original; no normal tap sends or edits a question.
- API rejects cross-site browser requests, unsupported content types and bodies over 4 MiB before a provider call. Responses are no-store. Vercel headers restrict script sources, framing and browser permissions. These are limited controls, not authentication or a public abuse quota.
- Read `SECURITY-AND-RELEASE.md` for what is protected and what still blocks a broad launch. After editing inline JavaScript, run `npm run security:headers` then `npm test` before deployment.

## Retained from v8

- Copy on replies, practice questions, greetings and user questions. Clipboard denial/unavailability opens a selectable manual-copy field; success is only shown after a successful write. Markdown, TeX and code indentation are preserved.
- Hold or right-click a sent question → Edit, then Save & resend. The edited chat includes only the preceding context; the original stays in Chats. Cancel/Escape are supported. The composer draft/photo is preserved, including failed requests and Retry.
- Edited photo questions retain actual saved pixels. Missing/stalled photo storage does not create a broken branch. Shared prefix photos survive deleting/pruning one owner; bytes are removed after the last reference is gone.
- Existing eight-chat retention still applies. The original is kept next to a new edited chat; older unrelated chats may be pruned. Practice progress in copied context starts fresh in the branch; original progress is unchanged.
- `APP-LAUNCH-GUIDE.md` explains Android packaging, first Play release, future updates, public-use blockers and capacity planning. No Android AAB was built.

## Final re-check: v8

**Start with `START-HERE.md`.** Final check evidence and pending release gates are in `evaluation/FINAL-CHECK.md`.

- Fixed new How/Why/topic questions being attached to an older photo/question. Explicit photo/step follow-ups still carry their source.
- Fixed language names used as topics or negated preferences overriding an explicit request. For example, “Do not use Hinglish; reply in English” resolves to English.
- An unexpected/stalled old-photo lookup is caught and bounded to five seconds; it cannot keep Send disabled forever. The app clearly asks for a missing photo instead of attaching a guessed one.
- Response metadata tolerates harmless whitespace; checked Exam arithmetic also records its reply language for later actions.
- 173 automated checks passed. This package remains a preview candidate, not a claim of tested live v8 AI behaviour or Play Store readiness.

## Kya badla

### New in v7

- Reply language in the existing Preferences panel: Match my question, Hinglish, English or हिन्दी. Explicit language requests override the saved preference. Automatic matching uses script/word heuristics, not a universal language detector.
- Selected-answer actions retain that answer's response language; their generated Hindi labels no longer determine the reply language. Short neutral follow-ups use learner history, not an earlier assistant's wrong language. Quick greetings use the same resolver.
- The tutor handles ordinary questions directly even with a different subject selected. Personal health questions get concise, cautious instructions rather than an imposed lesson/remedies table. Academic questions keep the basics, meaning, formula origin and worked steps.
- The provider labels responses as lesson/general; the app removes that metadata and hides Practice/Explain a step for general responses. Missing metadata preserves the answer and conservatively hides those study-only actions. Old saved messages without classification remain compatible.
- Substantial unwanted Devanagari or missing Hindi script joins the existing one-repair budget. Code, quoted text and translation/letter lessons are exempt. This is a script check, not a semantic language or medical-quality guarantee. An unresolved mismatch stays flagged and gets a visible notice.
- The live rectangle answer included a misleading extra diagram row. Instructions now require visual counts to match arithmetic; this is not an automatic diagram verifier.
- 43 human-review scenarios / 52 turns now include language switches, general questions under subject tabs, health boundaries, unknown schedules/current facts, translation and false premises.

### Retained from v6

- A smaller header with Chats, New chat and a Preferences control. Explanation depth and optional course move into an initially closed preferences panel, with outside-click/Escape/close-button handling. The interface uses neutral labels such as “Step by step” and “Focused explanation”; the default teaching still starts with necessary foundations.
- A considered empty state with two subject-relevant examples instead of a placeholder greeting and a separate horizontally clipped suggestion strip. Examples fill the input for review; they do not send automatically. Switching subject in an empty chat preserves the draft/photo and does not create extra empty chats.
- Muted graphite surfaces, smaller neutral subject tabs, restrained accent colour and less bordered-button clutter. A single-row expanding composer puts Upload photo / Take photo in an attachment menu, with voice and send alongside the question. Learn/Exam remain directly available.
- Consistent answer actions: Simplify, Recap, Listen, Explain a step and Practice. Practice still supports Check answer and Show solution. Hindi/Hinglish teaching and all photo/history behaviours remain.
- The original logo is one cacheable local PNG, instead of four copies of the same base64 string. In v6 the uncompressed HTML shrank from 177,820 to 63,063 bytes (about 64.5%); the shared logo is 22,277 bytes. This is a file-size measurement, not a real-device speed claim.
- MathJax downloads only when an answer contains mathematical notation. Simultaneous maths answers share one loader; a failed download leaves notation readable and a later answer can retry. No new runtime framework or remote font was added.

### Retained from v5

- NEW in v5: tap a prepared or sent photo to open a viewer, fit it to the screen, zoom to 400%, pan and reuse it. Reuse only attaches the photo; it does not automatically send it.
- Camera photos up to 20 MB are prepared before sending, replacing the old 3 MB input rejection. JPEG/PNG/WebP are supported; prepared images stay within 2.5 MB, 2560px longest side and 4 megapixels. Extremely large dimensions and unreadable formats give a specific error. The server checks payload size, declared type and file signature before provider calls.
- Newly sent prepared photos save in this browser's IndexedDB and restore with their chats. Storage failures are visible. Deleting/pruning a chat also removes its saved photos. Old releases did not save image bytes, so their missing photos cannot be recovered.
- Related photo follow-ups and selected-answer explanations retain the correct source photo, including actions on older answers. Unsent drafts/new attachments survive selected-answer actions, retries and asynchronous photo lookup. Rapid file changes, cancellation and starting a new chat cannot silently substitute a stale prepared image.
- The photo teaching instructions request a short transcription of the relevant handwritten question, attention to signs/fractions/units and one targeted clarification when a critical symbol is unclear. They distinguish student working from the question and retain the basics-first “why/how” teaching policy. This is an instruction improvement, not verified handwriting recognition accuracy.
- Photo requests explicitly select Gemini high media resolution and medium thinking, or Groq medium reasoning. Photo output budgets are Gemini 4096 / Groq 6144 tokens. These settings can increase cost and latency; evaluate actual answers with `evaluation/PHOTO-TEST.md`.
- Voice playback now resets correctly when switching between answers; composing text with an IME does not accidentally submit on Enter. Microphone errors are visible.

The earlier teaching and readable-UI improvements remain:

- v4 replaced the conflicting CSS layers with one responsive layout. Messages scroll inside their own region; the composer, answer-style controls and footer occupy separate space. Focusing the mobile composer hides the subject row while keeping header actions reachable.
- Proper headings, emphasis, numbered/nested lists, code blocks and Markdown tables. On phones, two/three-column tables become readable labelled cards; numbered principle tables get a compact number/name/explanation layout. Wider tables scroll inside their own region. Existing saved answers use the new renderer automatically.
- TeX is preserved through Markdown, including absolute-value/norm bars inside tables. Code indentation stays intact. Model HTML is inert; only explicit HTTP(S) Markdown links become links. MathJax is restricted to math spans with base/AMS TeX and its safe extension; generated math cannot add links, styles, IDs or classes.
- Mobile chats use a full-height drawer with a real backdrop, themed close button, Escape/Tab handling and background interaction disabled while open. The delete menu opens inline instead of floating over another chat, and clicking the same options button closes it.
- A new long answer begins at its first line when the reader is at the latest conversation; scrolling back while waiting preserves that reading position. A completed response no longer forcibly refocuses the phone keyboard.
- Short paragraphs and meaningful Markdown section titles are requested from the tutor. A new green-chemistry evaluation case checks the screenshot's misleading claims and the distinction between toxicity and carcinogenicity. These instructions are not a factual guarantee.

- Optional class/semester and beginner/familiar preference in the header Preferences panel. Default remains basics; preference saves on this browser and accompanies normal/action requests. It is not a measured ability score.
- `Explain a step` opens an accessible field. Select a line inside that answer or paste/type it, then send it with the correct source answer/question. This does not consume an unsent composer draft/photo.
- `Practice` requests one question, then shows a dedicated attempt form. `Check answer` sends that exact question and attempt for targeted feedback; `Show solution` explicitly requests the full solution. Drafts, up to 10 recent feedback records per practice card, and solution-viewed state survive refresh. No automatic mastery/marks claim is made.
- Beginner-first teaching across mathematics, physics, chemistry, biology, programming, languages, humanities and economics. Existing subject buttons remain; General handles other subjects. Actual question takes priority over the selected button.
- Each new central formula should include meaning, symbols, origin/derivation or empirical basis, assumptions and worked use. Definitions, theorems and experimental laws are distinguished; the tutor must not invent a derivation.
- Missing prerequisites are explained in the same answer, without expanding into unrelated chapters or forcing the same lengthy template on every doubt.
- Hindi/English/Roman Hindi confusion detection plus escalating re-teaching strategies: new concrete example, another representation, then a smaller prerequisite. This is a heuristic, not a student mastery model.
- One bounded model repair for observable truncation, broken code/TeX delimiters or substantial copied re-explanation. Clean answers add no repair request. An improved repair replaces the candidate answer.
- The mechanical checker does NOT verify mathematical correctness, derivations, all repetitions, facts or learning outcomes. Failed/unhelpful repair preserves the original answer and its Continue state.
- Server budget remains 35 seconds: up to 20 seconds per provider attempt, up to 12 seconds for a repair when at least 4.5 seconds remain. Client timeout 40 seconds; Vercel limit 45 seconds. These are deadlines, not measured latency promises.
- More output room for text-only Learn (Groq 4096; Gemini 3200 maximum tokens). This and occasional repairs may increase cost/latency; measure on preview.
- Whole recent messages are retained within the total context budget. Hindi follow-ups retain the original topic. Nested outer TeX delimiters from the observed live bug are normalized.
- Earlier fixes remain: selected-answer actions, context across providers, stable text model, Learn/Exam separation, safe code display, retries and draft/photo preservation.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | App structure/behaviour and UI version marker |
| `START-HERE.md`, `APP-LAUNCH-GUIDE.md` | First preview, Android launch, update and capacity instructions |
| `assets/logo.png` | Original logo, shared by favicon, header and assistant avatars |
| `assets/app.css` | Consolidated desktop/mobile layout and answer typography |
| `assets/answer-renderer.js` | Safe Markdown/TeX presentation |
| `assets/onboarding.js` | First-use language and feature guide |
| `assets/message-menu.js` | Touch, keyboard and button-based message actions |
| `lib/request-security.js` | Request method, origin, size and content-type guard |
| `scripts/security-headers.js` | Reproducible CSP hashes and Vercel headers |
| `assets/reply-language.js` | Shared language preference, inference and script checks |
| `assets/photos.js` | Image preparation and local photo persistence |
| `assets/photo-viewer.js` | Open, zoom, fit and reuse photos |
| `assets/vendor/` | Pinned Marked lexer and MIT license |
| `api/chat.js` | Vercel API, provider fallback and bounded repair |
| `lib/tutor.js` | Common teaching policy, context and re-teaching state |
| `lib/quality.js` | Mechanical checks; NOT a correctness judge |
| `lib/image.js` | Image payload size, MIME and signature validation |
| `vercel.json` | Routing and function duration |
| `tests/` | Mocked-provider, DOM/event, simulated canvas and IndexedDB regressions |
| `evaluation/cases.js` | 43 scenarios and 9 follow-ups (52 user turns) |
| `evaluation/HOD-TEST.md` | Teacher rubric and evaluation procedure |
| `evaluation/PHOTO-TEST.md` | Eight real handwriting cases and phone interaction checks |
| `scripts/evaluate.js` | Collect actual answers from a configured preview/local handler |
| `scripts/evaluate-photo.js` | Collect actual photo answers/follow-ups for human review |

No npm runtime dependencies or build step. Use Node 24.x. The deployment runtime is pinned to this major version; minor/security updates remain available. Marked is vendored locally; MathJax 3.2.2 and its safe extension load on demand from jsDelivr for mathematical answers. System fonts avoid a font-network request. Keep `assets/` and the whole `lib/` directory with the API. `.vercelignore` excludes tests, evaluator and reports from deployment.

## Preview deploy

1. Download this latest ZIP and extract it. Open the inner `GyanSetu-Upgrade` folder containing `index.html`, `api`, `lib` and `vercel.json`. Do not mix it with an older generated folder.
2. Back up your current source/configuration. If updating an existing source folder, replace these files and merge any additional configuration you already have.
3. Run `npx vercel link` from this folder and select the existing account and the actual target project. Confirm it matches the URL you are currently sharing; do not assume an older project name is still current.
4. Ensure `GEMINI_API_KEY` and/or `GROQ_API_KEY` are configured for Preview in that Vercel project. Production-only variables do not enable Preview. Keep values out of frontend files and chat.
5. Run `npx vercel` for a preview. Test it before promoting to production.
6. A successful API response includes `teachingVersion: "basics-v8"`; the evaluator warns if it is missing/different.

An authenticated preview can be tested in your normal signed-in browser, or use the local evaluator with provider keys privately set in environment variables. The evaluator does not bypass deployment protection.

## Verification

Run `npm ci --ignore-scripts` and then `npm test`. LinkeDOM and fake-indexeddb are pinned development-only dependencies; no browser/AI keys are needed for these regression tests.

173 automated checks passed in this workspace. They include the existing context, photo, storage, renderer, maths, action and UI-event checks, plus language precedence/persistence, selected-action language, response classification, bounded script repair and evaluation metadata.

These are code/DOM and simulated-storage/canvas tests with mocked providers, not live AI or handwriting answer tests. Three real conversations on the OLD public deployment are documented separately. New v8 provider behaviour and visual layout remain pending because v8 has not been deployed and local provider credentials are unavailable. No production changes were made.

Real phone keyboard/camera/microphone checks, handwriting accuracy, photo orientation/pixel quality, concurrent load, latency and launch readiness remain unverified. Local browser previews had been refused; no workaround was used. Deploy a Vercel preview and use the checks below.

### Phone preview checks

- At widths 320, 360, 390 and 430px, open a long answer and scroll to its last line/actions. The composer and footer must not cover it; only the conversation should scroll.
- Open the keyboard, type multiple lines, attach/remove a photo, send, dismiss the keyboard and rotate the phone. The input must remain reachable.
- Open Chats, close with X/backdrop/Escape, cycle Tab/Shift+Tab, toggle a delete menu twice, and switch a chat. Test on a disposable chat if deleting.
- Check a 12-row principle table, a wider comparison table, a fraction, aligned equations, absolute value and indented Python code. At 200% zoom, no text or controls should be clipped.
- Check MathJax/network failure and voice/camera permissions on the actual target browsers. Confirm old saved chats, Learn/Exam and selected-answer practice still work.
- Open Preferences, edit language, depth and class/semester, dismiss with Escape/outside click, and tab to the next control. Test the attachment menu at 320px and with the keyboard open; check that Upload photo / Take photo launch the correct picker.
- Follow `evaluation/PHOTO-TEST.md` for photo open/zoom/reuse, same-origin restore, storage failures, handwritten symbols and corrected follow-ups.

Practice question generation and feedback are model-generated. Prompt rules tell it to withhold the solution until requested and evaluate attempts accurately, but neither behaviour is guaranteed by a deterministic answer key. Verify these with the action checks in `evaluation/HOD-TEST.md` before showing the demo.

The earlier PUBLIC version was tested with a derivative question/follow-up: it jumped to unfamiliar notation, displayed nested delimiters, cut off a sentence and repeated algebra. Its derivative result 4 and rejection of division by zero were correct. This is a baseline observation, not a v6 result.

## Real answer collection

List cases without API calls:

    node scripts/evaluate.js --list

One key scenario against a configured preview:

    node scripts/evaluate.js --url https://YOUR-PREVIEW.vercel.app --case M02 --out reports/derivative.json

All 43 scenarios, sequentially (52 user turns; defects may trigger a repair call):

    node scripts/evaluate.js --url https://YOUR-PREVIEW.vercel.app --limit 43 --out reports/hod-run-1.json

Or use provider keys already set privately in the local environment:

    node scripts/evaluate.js --local --limit 43 --out reports/hod-run-1.json

The report records real answers, times, model/version, errors and repair flags. Teaching/correctness scores start as null for human review. Successful HTTP responses are not teaching passes. See `evaluation/HOD-TEST.md`.

Collect a real handwriting answer and follow-up using provider keys privately set in the local environment:

    node scripts/evaluate-photo.js --local --image /absolute/path/handwriting.jpg --question "Basics se solve karo" --followup "Is step ka reason samjhao" --out reports/photo-review.json

Use a real JPEG/PNG/WebP under 3 MB. The evaluator sends that photo to the configured provider, records responses and its filename/hash (not image bytes), and leaves human scores unfilled. See `evaluation/PHOTO-TEST.md` for the preview URL alternative and acceptance cases.

## Limits

- AI output can be wrong; the guard is not proof verification or retrieval from approved notes.
- No syllabus/NCERT/college-note retrieval, mastery tracking, live web search, code-execution sandbox, Android app or offline AI was added.
- Text context is bounded to 16 messages/18,000 characters; selected-action text is also bounded. Photo follow-up detection is heuristic. View/reuse a photo explicitly when changing or revisiting the question if necessary.
- Up to eight chats are retained. New prepared photos persist locally on the same browser and origin, subject to browser quotas/clearing; this is not cloud backup or cross-device sync. The in-memory photo cache holds up to eight images. Photos missing from older releases cannot be reconstructed.
- Broad rollout still needs usage/cost controls, reporting, privacy disclosures and real device/load tests. This is not Play Store certification.
- GyanSetu integrates Gemini and Groq-hosted models. It is not a trained clone of ChatGPT's underlying model.

Technical references checked: https://ai.google.dev/gemini-api/docs/interactions-overview ; https://console.groq.com/docs/api-reference ; https://console.groq.com/docs/deprecations ; https://docs.mathjax.org/en/v3.2/advanced/typeset.html ; https://vercel.com/docs/cli/link ; https://vercel.com/docs/cli/deploy

Screenshot fact check: ATSDR states DHHS/IARC/EPA have not classified chlorine as to human carcinogenicity; that does not make chlorine exposure safe. Source: https://wwwn.cdc.gov/TSP/ToxFAQs/ToxFAQsDetails.aspx?faqid=200&toxid=36 . The evaluator case is reviewer guidance, not an automatically fact-checked AI answer.

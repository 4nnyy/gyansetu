# GyanSetu v7 review — 9 October 2026

Prepared for Aniket Kumar Gupta. This is a scoped engineering review, not a zero-bug or 10/10 certificate.

## Delivered and verified

- UI/package version 7.0.0; API marker `basics-v7`.
- 100 automated tests passed, zero failures. Provider calls were mocked; browser APIs are DOM/event simulations, not a rendered Android browser. The last full run took about 0.54 seconds in this workspace. This is test-run time, not chat latency.
- New language control uses the existing closed Preferences panel, keeping the conversation uncluttered. Auto matches common English, Roman Hindi and Devanagari patterns. Saved choices and explicit overrides are tested. Other scripts are delegated to model language matching; this is not a universal language detector.
- Shared language resolution for greetings/API. Selected-answer actions carry their own language across topic switches and refresh. Generated action labels do not set the reply language.
- General-question instructions take priority over Learn/Exam templates and subject tabs. Teaching requests retain prerequisites, symbol meanings, formula origin, assumptions, worked steps and changed explanations on confusion.
- Model output carries a response-type marker which is removed before rendering. General answers omit Practice and Explain a step; Simplify, Recap and Listen remain. Missing metadata preserves the response and conservatively omits study-only actions. Classification depends on the model and needs live review.
- Substantial script drift can trigger one repair within the existing request deadline. A failed repair is not hidden or reported as successful. Code, quoted material and language/translation lessons are exempt to avoid corrupting the answer. English-only versus Roman-Hindi semantic drift is not fully detected by this mechanical check.
- Existing tests for chat history, draft preservation, retries, safe Markdown/TeX, source-photo follow-ups, image storage/viewer, IME and UI controls remain passing.
- The ZIP includes 43 authored review scenarios / 52 turns, plus the separate real-photo protocol. Authored cases are not model passes.

## Real public-site baseline — previous deployed build

URL opened and interacted with: https://gyansetuin.vercel.app/

Three synthetic questions were submitted through the actual desktop chat interface in separate chats. These observations describe the PREVIOUS deployment. This work did not deploy v7 or silently replace the production app.

| Test | Observed behaviour | Assessment |
| --- | --- | --- |
| `Mera pet dukh rha hai` under All subjects | English opening, then Roman Hindi; long home-remedy/medicine table, health warnings later; Practice/Explain a step shown | Reproduced disproportionate response and irrelevant study actions. The screenshot's Devanagari drift did not reproduce in this one sample; language output varies. No medical correctness pass assigned. |
| `How can I organize my college files on my phone? Give me three practical steps in English.` with Mathematics selected | English response with three main steps; answered the actual topic; study-only actions still shown | This explicit-language/topic test worked. Practical recommendations were not independently validated, and this does not establish automatic language matching. |
| `A rectangle is 4 cm long and 3 cm wide. Why is its area 12 square centimetres? Explain from the basics.` with Mathematics selected | Hinglish despite English input; explained unit squares and correct result 12 cm², but text-art grid displayed four rows of four while saying three rows | Language mismatch and misleading diagram. Arithmetic was correct; the explanation is not a clean pass. |


The visible desktop answer, subject selection, new chats and formatted maths loaded in this baseline. This does not verify the new Preferences control on real phones or every action. No camera, microphone, account, destructive chat deletion or sensitive personal upload was tested through the public browser.

## Health response boundary

The revised tutor instructions avoid diagnosing from a short symptom message, drug/dose recommendations and automatic remedy tables. They request concise clarification when appropriate and urgent local care first for serious warning symptoms. They distinguish an educational biology question and quoted translation text from a personal health concern.

Clinical reference consulted for the limited abdominal-pain warning examples: [NHS — Stomach ache](https://www.nhs.uk/symptoms/stomach-ache/) (accessed 9 October 2026). The NHS advises urgent assessment for sudden/severe pain and symptoms such as vomiting blood, difficulty breathing or collapse, and advice for persistent/worsening symptoms. UK telephone numbers were deliberately not copied into an app with unknown user locations. These instructions do not make the app a clinical triage service or verify its generated medical content.

## What is still pending

1. **Real v7 answers:** provider credentials were not available locally. Deploy this exact folder to an authorized Vercel preview with the existing server environment variables, then run the evaluation cases. Keep teacher/reviewer scores blank until actually reviewed.
2. **Real mobile UX:** test 320–430px widths, keyboard open/close, rotation, long answers, Preferences, language persistence, camera, mic and photo open/zoom/reuse. DOM tests do not prove layout quality.
3. **Handwriting:** use real clear, tilted, faint and ambiguous handwritten samples. Verify transcription before solution, corrected symbols, and same-photo follow-ups. Passing file/storage tests is not handwriting accuracy.
4. **Quality:** repeat academic and general dialogues because model outputs vary. Check diagrams/counts, factual claims, formula derivations, response length, transitions between topics and resistance to false premises. A prompt instruction is not a correctness guarantee.
5. **Release work:** load/latency/provider-budget testing, app-level abuse/quota controls, privacy/reporting/deletion flows and Android/Play Store preparation remain separate launch requirements. This ZIP is a web-app update, not an Android release bundle.

## Exact continuation

1. Extract `GyanSetu-v7.zip`; use the inner `GyanSetu-Upgrade` folder as the project root.
2. Link it to the correct existing Vercel project and create a preview. Keep `GROQ_API_KEY` and/or `GEMINI_API_KEY` as server environment variables; never put values into the HTML or send them in chat. Preview needs its own enabled environment scope.
3. Check page meta version `7.0.0` and API `teachingVersion: basics-v7`. Old cached answers do not become newly generated v7 answers.
4. First run G04, G05, G07, G08, G12 and G14, then M01, M02, P02, C01, C05 and CS01. Inspect both the answer and the action buttons. An API-only evaluator cannot verify visual layout.
5. Run `node scripts/evaluate.js --url https://YOUR-PREVIEW.vercel.app --limit 43 --out reports/v7-review.json` for all scenarios. This uses provider quota and does not assign quality scores automatically. Add real-photo tests separately.
6. Promote only after reviewing the actual preview and addressing failures. No production deployment was performed in this review.

# GyanSetu 8.2.3 — security and release status

13 October 2026 · Aniket Kumar Gupta

**Status: source candidate for a controlled preview, not certified for a public launch.** These changes address specific defects. No penetration test, load benchmark, authenticated provider run or Android release was performed in this workspace.

## Implemented controls

| Control | Scope and limit |
| --- | --- |
| Safe answer renderer | Markdown is converted into DOM nodes. Only bare `<br>` HTML becomes a line break. Other HTML stays inert; code examples retain literal tags. No arbitrary model HTML execution. |
| JSON-only POST endpoint | Rejects unsupported methods/content types before provider calls. Prevents form/text requests being accepted as chat input. |
| Browser origin check | Rejects cross-site requests and a provided Origin that differs from the request host. Does not trust forwarded-host for origin approval. CLI requests can omit Origin, so this is **not authentication** or protection from a deliberate API caller. |
| 4 MiB request limit | Checks declared and serialized UTF-8 size before model calls. Existing text, history, action and actual-image validation still applies. Hosting limits apply before the handler too; this guard is not an edge DDoS limit. |
| No-store API responses | Personal answers should not be cached by the app's HTTP/CDN layer. This does not erase provider processing or browser-local history. |
| Browser security headers | CSP limits scripts to the app, hashes of the two inline scripts and the pinned MathJax 3.2.2 CDN path; blocks framing, objects and arbitrary connection targets. Camera/mic restricted to self; geolocation disabled. |
| Secret handling | Groq/Gemini keys are read on the server; none are shipped with this source. Ignore rules exclude local environment files from Git/deployment. This does not prove keys were never exposed in an older deployment/repository. |
| Bounded failure handling | Provider/request timeouts, a bounded repair, fallback, safe error messages and no intentional prompt/photo logging. These do not enforce user quotas. |

MathJax injects styles, so `style-src` permits inline styles; JavaScript does not allow `unsafe-inline` or `unsafe-eval`. The pinned CDN remains an external supply-chain dependency. The strict CSP may block optional Vercel preview toolbar injection. Do not loosen it to `*` or add unsafe script execution to make an unrelated toolbar work.

If inline JavaScript changes, run:

```sh
npm run security:headers
npm test
```

The regression suite fails if the CSP hashes do not match the current source. Deploy the complete folder with the generated `vercel.json`.

## Public launch gates still open

1. **Abuse and cost protection:** choose student sign-in or another verified access model; add an atomic shared-store rate limiter and daily user quota. Enforce a total usage ceiling and graceful cooldown. Configure provider budgets, Vercel firewall controls and monitoring in your own accounts. The current endpoint can still be called by anyone who knows its URL; do not market it as unlimited or abuse-proof.
2. **Privacy and reporting:** finish an in-app answer-report flow with a real receiving service, review process and retention policy; publish a truthful privacy policy. Disclose prompts/photos going to the configured AI providers and local chat/photo storage. Do not collect more student data than needed.
3. **Actual preview/device tests:** verify real phone gestures, selection, keyboard, camera/mic, photo opening, MathJax under CSP and provider behavior. Review handwritten equations, unclear symbols, basics-first lessons and language changes with a teacher/student. Automated provider mocks cannot establish these outcomes.
4. **Capacity evidence:** run an authorized, budgeted pilot/load test against the configured tier. Record concurrent requests, success/429/timeout rates, p50/p95 response times and token cost. No supported-user count has been established.
5. **Android/Play work:** package and sign an Android AAB, adapt the API URL and authenticated client/origin policy, test Android storage/permissions/upgrades, and complete Play disclosures/testing/review. This ZIP contains no AAB. See `APP-LAUNCH-GUIDE.md`.

## Preview acceptance before promoting this update

- First visit: pick Hinglish, finish, submit a question, reload. Choice persists and guide stays dismissed. Replay through Preferences; existing chats/draft/photo survive. Repeat once in Hindi and English. Guide state is per browser/origin, not a synced account preference.
- Hold an answer, release, Copy; hold a question, Edit/Cancel and then Save & resend. Original remains in Chats. Scrolling, code selection, photo taps and second-finger gestures must not accidentally open the menu. Desktop message-action icon, right-click and keyboard work. Study tools stay in a separate collapsed disclosure.
- Render a formula plus a table containing `one<br>two`. Show two lines and actual maths; a code example containing `<br>` stays literal. Verify no blocked core script/font in the browser console.
- Network inspector: API replies have no-store; app pages have CSP/nosniff/framing headers. A text/plain POST should return 415, a foreign Origin should return 403, an oversized body 413, and a normal same-origin request should work. These checks do not demonstrate authentication.
- Verify a real photo question and follow-up, unavailable provider/Retry, selected older-answer actions, old chat restoration, and short-lived Copy/Edit notices. Never send real keys in screenshots or test reports.

## Why the product is worth testing

The useful distinction is a focused study flow: explain the meaning of each symbol, why the formula/step works, show a small worked example, and check the learner with a similar question in their preferred language. Measure whether students can solve a fresh question after the explanation. A feature count or a “10/10” label does not prove that result.

Engineering references reviewed for this change: [OWASP REST security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html), [Vercel header configuration](https://vercel.com/docs/project-configuration/vercel-json#headers), [Vercel production checklist](https://vercel.com/docs/production-checklist). These references support the controls; they do not audit or certify this app.

# GyanSetu failure and latency review — 17 October 2026 (IST)

Story: a learner asks ordinary, academic, follow-up, recap and photo questions; the browser sends the request to the app API, which calls a configured AI service and renders an answer or a recoverable error.

## Live evidence

URL: https://gyansetu-by-4niket.vercel.app/ — UI meta version **8.1.1**, not this 8.2.5 candidate. All prompts were synthetic QA inputs. No credentials, private student data or personal images were submitted. The raw observations are in `live-checks-2026-10-17.json`.

| Attempt | Observed result | UI timing |
| --- | --- | --- |
| Wi-Fi vs internet | Answer returned | Seen within 15.1 s; not continuously timed |
| Python list vs tuple | Answer/code returned | 2.98 s |
| Tuple containing a mutable list | Contextual follow-up returned | 3.20 s |
| 12 V / 6 ohm circuit | Correct 2 A and 24 W with steps | 3.03 s |
| Integration by parts: x e^x | **Failed:** “Abhi bahut requests aa rahi hain…” and Retry | 1.57 s |
| Retry the same calculus question after a few minutes | Correct x e^x − e^x + C, derivation and derivative check | Still pending after initial 5 s observation; answer seen by 28.4 s |
| Recap of calculus | Recap returned | 2.79 s |
| Short English college-library notice | Notice returned | 2.16 s |
| Hindi NaCl dissolution question | Hindi response returned | 3.65 s |
| Clear printed PNG: 2x + 5 = 17 | Correctly read image, solved x=6, verified it | Pending at 19.6 s; answer seen by 44.1 s |

Ten attempts: nine answers and one visible service-limit failure. This small, sequential sample is not a load test or a reliability percentage. Browser tool timeouts interrupted continuous timing on the calculus retry and photo; those ranges must not be presented as exact server durations. Upload-picker/tool overhead is excluded from the photo request interval. The printed fixture is not a handwriting test.

The same calculus question succeeding after a wait supports a temporary-capacity explanation; it does not prove which upstream account/limit caused the failure. The application message is visible evidence, but an upstream HTTP status, quota tier and retry delay were not captured.

## Answer quality is separate from transport success

- The Python follow-up correctly allowed mutating a list inside a tuple, but its table still described tuples generally as safe dictionary keys. A tuple containing a list is unhashable. Its earlier speed claims also need operation-specific qualification.
- The recap switched to English despite the Hinglish source. The saved source already has selected-answer language handling, but it is not running at the tested URL.
- The library notice added possible fines not provided in the prompt. The compact policy now explicitly forbids inventing penalties in drafted notices.
- One Hindi chemistry sentence reversed which particles surround which: water molecules hydrate the ions, not ions surrounding individual water molecules. Remaining chemistry content did not make this wording acceptable.

These observations prevent a claim that every generated answer is correct. No live model evaluation of the revised compact policy was possible without deploying it or supplying authorized runtime credentials.

## Source changes in 8.2.5

1. Reduced the ordinary General/Learn system instruction from **17,442 to 6,821 characters** (about 61%). The core remains basics-first, with formula meaning/origin/conditions, correct symbols, language, general-question handling and trust rules. Only the selected action's instructions and actual-image instructions are included. Current question, normalized conversation history, model choice and completion budgets remain intact. Do not equate character reduction with measured speed or token savings.
2. Allows at most one recovery for an explicit **1–3 second upstream rate-limit cooldown**, after independent configured fallbacks. It waits for the supplied delay; it does not rotate sibling models to evade a shared limit. Unknown or longer limits, exhausted quotas, credentials/payment failures and insufficient remaining time are not automatically retried. The overall 35-second server budget is unchanged.
3. Retains prior transient recovery, dedicated short recap requests, safe rendering, copy/edit, photo references, draft preservation and version headers.

**173 automated tests passed**, zero failures/skips/cancellations, on Node 24. New checks cover waiting before rate-limit recovery, unchanged request context, fallback priority, bounded retry count, no sibling rotation, quota/long/unknown/deadline exclusions and compact prompt size. Existing UI, image storage, language, security and response-rendering tests still pass. Mocks verify control flow, not real AI answer quality or account capacity.

## Boundaries and remaining blockers

| Boundary | Status / evidence |
| --- | --- |
| UI input → API trigger | Observed working on 8.1.1 for varied prompts, Retry, Recap and photo attachment |
| API → service | Visible rate-limit failure reproduced; provider/account detail unavailable |
| Service → rendered answer | Nine answers observed, including recovery and image interpretation; quality issues above |
| Latest source → live deployment | Not verified: 8.2.5 is not deployed and tested URL still serves 8.1.1 |
| Runtime logs / deployment list | Vercel returned 403 for the project's scope; CLI unavailable. No access controls were changed |

The project inventory also contained `gyansetu-aniii`, but its actual deployment URL/version could not be retrieved because scope access failed. No replacement URL was guessed. Confirm the actual shared **Visit** URL before the next deployment check.

Actual phone/network behavior, handwriting, simultaneous users, account token/request limits, billing capacity and the revised prompt's live answers remain unverified. A ZIP cannot replenish API credits. Do not call this a fully verified final production release.

Technical references consulted: [Groq rate limits](https://console.groq.com/docs/rate-limits) and [Groq latency guidance](https://console.groq.com/docs/production-readiness/optimizing-latency). They describe organization-level token/request limits, Retry-After and the influence of input/output size; they do not identify this deployment's specific failure cause.

# GyanSetu reliability check — 16 October 2026

## What was actually observed

The public URL https://gyansetu-by-4niket.vercel.app/ reported UI version 8.1.1. One synthetic question, `4x + 7 = 27 ko Hinglish mein basics se solve karo. Har operation ka reason batao.`, returned the correct x = 5 and explained both inverse operations. Its Recap also completed. No intermittent live request failure was reproduced in these two calls. Browser extension metadata errors were excluded from app findings.

The current saved source was 8.2.3. Its single-provider route immediately returned a service failure after one temporary 503/network interruption. Fault-injection tests reproduced this limitation without using paid APIs or learner data. Three initial regression checks failed before the change and passed after it.

## Changed in 8.2.4

- Prefer configured fallback providers/models, then allow at most one additional recovery attempt for a transient error across the entire request.
- Preserve the exact learning request on recovery, including selected Recap question/answer and any image needed by other actions.
- Add a short randomized delay and honor Retry-After for subsequent requests to the same provider.
- Keep the 35-second total server budget, 20-second per-attempt maximum and existing quality-repair behavior. Skip recovery when insufficient time remains. No retries after a deadline consumed during backoff.
- Do not retry invalid client requests, authentication failures, payment-required responses, or rate limits on the same provider.
- Propagate known temporary-service cooldowns to the existing Retry control.
- Expose the package version in an API response header for deployment diagnosis.

## Verification

All 169 automated tests passed on Node 24, including context, images, draft retention, manual Retry, copy/edit, rate/quota handling, safe rendering and the new transient-recovery cases. No runtime dependency was added.

Recovery tests cover a temporary 503 followed by success, a network interruption followed by success, malformed upstream JSON, configured independent fallback before recovery, permanent outage attempt limits, non-retryable errors, provider cooldowns, and total-deadline exhaustion. The Recap recovery assertion compares the complete original and retried provider payloads.

## What remains unverified

8.2.4 was not deployed during this check. Actual provider credentials, runtime server logs, account quotas, actual-phone behavior, handwritten images, and concurrent-user load were not inspected. The two successful 8.1.1 requests do not establish an intermittent failure rate and do not prove that the source change fixes the user's specific live incident. Provider capacity, credentials and billing cannot be restored by a code retry.

The next live check must first identify the correct deployment and verify both UI meta version and API version header as 8.2.4. Keep the current project and its environment configuration rather than creating another unrelated project.

## Technical references

- https://console.groq.com/docs/errors
- https://ai.google.dev/gemini-api/docs/troubleshooting

These provider documents distinguish transient server/network failures from invalid requests and recommend bounded retries with backoff. This implementation deliberately leaves same-provider 429 retries to the existing explicit cooldown and manual Retry flow.

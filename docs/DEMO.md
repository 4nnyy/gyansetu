# Three-minute judge demo

Use a working deployment and confirm its version before the event. The last checked public demo served 8.1.1; source 8.2.5 needs its own live review.

## Suggested sequence

| Time | Action | What to show |
| --- | --- | --- |
| 0:00–0:25 | Introduce the problem | A learner may know an answer without knowing why the steps work. |
| 0:25–1:10 | Choose Hinglish, Learn, then ask `1/2 + 1/3 mein denominator same kyun karte hain?` | Equal-sized pieces, meaning of denominator, then the calculation 5/6. |
| 1:10–1:35 | Use Explain a step or Simplify on that answer | A different explanation anchored to the same doubt. |
| 1:35–2:05 | Open Practice, enter an attempt, then Check answer | Separate attempt and feedback flow. Do not claim a measured mastery score. |
| 2:05–2:25 | Use Recap on the earlier explanation | Revision of the selected answer in its language. |
| 2:25–3:00 | Show the repository | README, `api/chat.js`, `lib/tutor.js`, tests and dated evaluation. |

Photo upload is a useful optional demonstration if time and the connection allow. Use a clearly written synthetic question with no personal data. Avoid adding a slow photo request to a strict three-minute pitch.

## Failure plan

If a service is temporarily unavailable, explain that inference depends on provider capacity. Keep the original question, respect the displayed cooldown, and retry when allowed. Use the dated observed example in the presentation to explain the flow. Do not present a screenshot as a live answer.

## Rehearsal

- Open the PPT locally and confirm its fonts, images and speaker notes on the presentation laptop.
- Open the exact app URL and verify its version and one text/recap request.
- Keep the GitHub README and architecture file available.
- Confirm the latest source's pending checks before describing it as ready for wider use.

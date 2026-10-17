# Photo / handwriting acceptance review — v6 UI / v5 tutor

The goal stays basics-first teaching: read the actual question, explain necessary concepts, show why each operation works, then solve. Attractive formatting and a confident answer are not evidence of correct reading.

## Automated coverage versus real testing

The code tests validate image payload routing, upload preparation decisions, persistence, zoom controls, photo reuse, retries and asynchronous selection races. Canvas pixels, EXIF orientation, real mobile layout, camera permissions, provider latency and handwriting accuracy require a real browser and actual photos. No provider keys were available in the development session.

## Use these real photo cases

| Case | Photograph | Expected behaviour |
| --- | --- | --- |
| H01 | Clear handwritten `2x + 3 = 7` | Accurately restates the expression; explains subtracting 3 from both sides and dividing by 2; x = 2. |
| H02 | An actually ambiguous plus/minus sign | Identifies the exact unreadable symbol and asks one targeted clarification; does not confidently solve an invented sign. |
| H03 | Fractions, powers and subscripts in handwritten maths/chemistry | Preserves fraction structure, indices, decimal points and units; no replacement by similar-looking characters. |
| H04 | A page containing questions 1–5; ask for question 3 | Reads and solves question 3, without conflating nearby working or answers. |
| H05 | Student working with one incorrect step | Separates question from attempted solution; identifies the first wrong step and teaches why. |
| H06 | Blurry/cropped photo missing a value | Gives a specific recovery request; no fabricated data or unsupported answer. |
| H07 | Correct the transcription in a follow-up | Uses the correction and updates affected reasoning; does not repeat the mistaken solution. |
| H08 | New text topic followed by "Simplify" on an older photo answer | Sends that selected answer and its own source photo; preserves an unsent draft/new attachment. |

Run each relevant handwriting case at least three times, with both providers if available. Review transcription separately from maths/correctness and teaching quality. Do not mark HTTP 200 as a pass. Critical failures include inventing a missing sign/value, solving the wrong question, wrong arithmetic/units, or repeatedly ignoring a supplied correction.

## Phone interaction checks

1. Select a typical 5–12 MB camera photo: preparation should finish and show a preview rather than the old 3 MB rejection. Input files are limited to 20 MB; very large dimensions or unreadable formats request a closer photo/screenshot. The prepared version is limited to 2.5 MB, 2560px longest side and 4 megapixels.
2. Preview before sending, open the sent photo, zoom to 400%, pan, Fit and close using X/Escape. Test native pinch on the target phone. Zoom cannot recover detail missing from the prepared image.
3. Reload/switch chats on the SAME browser and domain: a newly saved photo should return. The app saves the prepared version, not the original full-size camera file. Old releases never saved photo bytes; those old images cannot be recovered.
4. "Use photo" should reattach without sending automatically. Ask a corrected question, or replace it with a new photo. Normal related follow-ups resend the original stored image; unrelated topics do not.
5. Choose photo A then B rapidly; remove while preparing; start a new chat while preparing; submit while loading; fail/retry a request. No stale photo should replace B or leak into the new conversation.
6. Test blocked/quota-exhausted storage and private browsing. Current in-memory viewing may still work, but the app must visibly state that persistence failed. Browser data clearing or a different Vercel origin removes access to local photos.
7. Delete a disposable chat and verify its saved photo is removed without deleting other chats' images. Deletion of image bytes is asynchronous; check after it completes.

## Collect an actual answer

Supply a real image under 3 MB (the API upload limit), keep provider keys in environment variables, and run:

    node scripts/evaluate-photo.js --local --image /absolute/path/handwriting.jpg --question "Question 3 basics se solve karo" --followup "Isme divide kyun kiya?" --out reports/photo-review.json

Or target the configured preview:

    node scripts/evaluate-photo.js --url https://YOUR-PREVIEW.vercel.app --image /absolute/path/handwriting.jpg --question "Is question ko basics se solve karo"

The report stores the image filename/hash, actual responses, timings and unfilled review fields; it does not embed image bytes or automatically assign an accuracy score. This command sends the selected photo to the selected deployment/provider. Review against the original photo before accepting the result.

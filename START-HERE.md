# GyanSetu 8.2.5 — ab kya karna hai

17 October 2026. Yeh checked web-app candidate hai. 173 automated checks pass hain; naye build ke real AI/phone tests abhi pending hain. Sirf ZIP milne se live app update nahi hota. App banana, Play Store update aur users/cost ke liye `APP-LAUNCH-GUIDE.md` padho.

## Is update mein kya hai

- Normal request ki system instructions 17,442 se 6,821 characters hui hain; full question aur normalized chat context unchanged hain. Unused action/photo rules ordinary requests mein nahi jaate.
- Temporary network/server failure par configured fallback ke baad ek bounded recovery attempt. Service explicitly 1-3 second ka cooldown de toh us wait ke baad ek retry allowed hai. Unknown/long limits, invalid keys, payment-required responses aur exhausted quotas repeat nahi hote. Existing 35-second budget unchanged hai.
- Live 8.1.1 par 10 controlled AI attempts mein ek rate-limit message reproduce hua; wahi calculus question baad mein chala. Clear printed photo 19.6 seconds par pending thi aur 44.1 seconds tak correct answer observe hua; exact completion time unavailable. Details: `evaluation/LIVE-REVIEW-8.2.5.md`.
- Is run mein live URL par UI 8.1.1 tha. Naye package ka UI version aur API `X-GyanSetu-Version` header dono 8.2.5 hone chahiye. Latest-build live checks abhi baaki hain.

- Copy icon se seedha Copy hota hai. Long-press/right-click ka compact menu message ke paas khulta hai; screen-dimming center popup hata diya hai. Keyboard: Copy button par Shift+F10 se message menu.
- Loading mein ek stable status hai: Preparing recap / Preparing answer; made-up rotating progress stages hata diye hain.

- Recap ke liye selected answer ka chhota request; unrelated history/photo resend nahi. Source photo ka reference baad ke doubts ke liye rehta hai.
- Creator question par Aniket Kumar Gupta ka developer credit; bina poochhe provider names nahi. Common creator questions ke liye AI quota nahi lagta.
- Rate-limit wait-time available ho toh Retry countdown dikhega. Daily quota ya missing service capacity ke liye account limits/billing check karna padega; ZIP se credits add nahi hote.

- Guide ke More options mein depth choices, photo reuse, Copy/Edit, Recap/Listen, practice aur chat limits ki help hai; default mein collapsed hai.
- Pehli visit par language aur options ki chhoti guide; baad mein Preferences → Quick guide. Same browser mein dismiss karne ke baad auto-repeat nahi. Existing history/preferences wale users kaam continue kar sakte hain; guide manually khol sakte hain.
- Phone par message hold karo: Copy/Edit/Select text ka chhota menu khulta hai. Study tools answer ke neeche alag collapsed hain. Normal tap par editor nahi khulta. Select text native selection deta hai.
- Screenshot wala literal `<br>` fix hai; code examples mein tag literal hi rehta hai.
- Basic request/security headers added hain. Public launch ke pending controls `SECURITY-AND-RELEASE.md` mein hain.

## 1. Sahi folder aur version rakho

`GyanSetu-v8.2.5.zip` extract karo. Andar **GyanSetu-Upgrade** folder project root hai: isi mein `index.html`, `api`, `lib`, `assets`, `package.json` aur `vercel.json` hain. Sirf HTML upload karoge to AI API aur assets missing honge. Purane generated folders ko ismein mix mat karo. Current source ka backup rakho.

UI version: `8.2.5`. API header: `X-GyanSetu-Version: 8.2.5`. Teaching response marker: `basics-v8`.

## 2. Existing Vercel project par preview banao

Apna wahi Vercel project select karo jo tumhari shared app URL se linked hai. Local folder ko us project se link karne aur preview deploy karne ka official CLI flow:

```sh
npx vercel login
npx vercel link
npx vercel
```

Commands **GyanSetu-Upgrade folder** mein chalane hain. Account/scope aur existing project ka naam dhyan se select karo. Agar source GitHub se deploy hota hai, same repository ki preview branch mein extracted files update kar sakte ho; production branch par seedha push karne se pehle preview test karo.

Yeh plain HTML + Vercel API project hai: Framework Preset **Other**, root containing `index.html` and `api`, aur koi frontend build command nahi. Purane Next.js/Vite build ya `dist` output overrides lage hon to is project ke hisaab se remove/reset karo. Project configuration ko kisi doosre unrelated Vercel app par apply mat karo.

Project Settings → Environment Variables mein tumhari existing keys ke exact names:

| Variable | Kaam |
| --- | --- |
| `GROQ_API_KEY` | Groq text aur vision provider |
| `GEMINI_API_KEY` | Gemini provider; photos mein preferred route |

Kam se kam ek valid key chahiye; dono available hon to provider fallback milta hai. **Preview** environment ke liye values enabled honi chahiye; Production-only setting preview ko key nahi deti. Keys HTML mein mat daalo aur chat mein paste mat karo. Variables badalne ke baad naya deployment banao.

`npx vercel` ke baad jo preview link mile, wahi test/share karo. Is stage par production command ki zaroorat nahi.

References: [Vercel CLI deployment](https://vercel.com/docs/projects/deploy-from-cli), [environment variables](https://vercel.com/docs/environment-variables), [build configuration](https://vercel.com/docs/builds/configure-a-build).

## 3. Preview par ye quick test sequence karo

Har independent case ke liye New chat lo. Pehle Auto language, phir Preferences se language select karke test karo.

| Test | Expected result |
| --- | --- |
| `Tumhe kisne banaya hai?` | Aniket Kumar Gupta ka independent developer credit; no unsolicited provider details |
| Older answer → Study tools → Recap | Correct selected answer ka concise recap, same language; unrelated topic nahi |
| Service returns 429 with Retry-After | Retry disabled for the supplied wait; one retry, same question, no duplicate |
| `Mera pet dukh rha hai` | Short Roman Hinglish, appropriate questions/caution; diagnosis/remedy table/Practice nahi |
| Maths selected: `How can I organize my college files? Give three steps.` | English, actual general question ka answer; Maths lesson force nahi |
| `Hinglish mat do, English mein do. Explain fractions.` | English explanation |
| `What is Hinglish?` | English answer explaining the term |
| `मुझे भिन्न बिल्कुल शुरुआत से समझाओ` | Natural Hindi in Devanagari |
| `1/2 + 1/3 ka denominator same kyun karte hain?` | Equal-sized pieces, symbol meanings, 5/6, reason behind the operation |
| `Samajh nahi aaya` | Same doubt, different example/representation; copied lesson nahi |
| Older answer → Simplify/Explain a step | Selected answer/topic/language retained; unsent draft/photo preserved |
| Clear handwritten `2x + 3 = 7` photo | Read the actual equation first, explain x=2 and why; photo opens/zooms on tap |
| Same photo → `Isme 3 minus kyun kiya?` | Original photo/context retained |
| Next → `How do I organize my college files?` | Old algebra photo should not be reattached |
| Blur/ambiguous minus/plus photo | Exact uncertainty identified; no confident guessed solution |
| Practice → wrong attempt → retry → Show solution | One question; accurate feedback; no fabricated marks; full solution when requested |
| Brief network interruption → Retry | Clear failure, composer works, question not duplicated, unrelated draft preserved |
| Hold/right-click a message → Copy a formula/code answer | Correct text/indentation copied; denied clipboard par manual copy works |
| Older question → hold/right-click → Edit → Save & resend | Edited chat, only preceding context, original in Chats; unrelated draft/photo preserved |
| Photo question → Edit, then delete original chat | Correct image resent; edited photo still opens after reload |

Fresh browser mein guide → Hinglish select → Finish → question bhejo; reload par guide repeat na ho. Existing browser mein Preferences → Quick guide bhi check karo. Scroll karte waqt long-press menu galti se nahi khulna chahiye. Menu Copy/Edit/Select text aur formula display with CSP check karo.

Phone par keyboard open/close, rotation, long answer ka last line, Chats drawer, Preferences, upload/remove/reuse, camera aur mic test karo. Android phone ki permissions aur layout ko desktop DOM tests verify nahi karte. Image storage browser/origin specific hai: ek different preview URL par old chats/photos automatically migrate nahi honge.

Full authored suite: `evaluation/HOD-TEST.md`, `evaluation/cases.js` (43 scenarios / 52 turns), aur `evaluation/PHOTO-TEST.md`. AI outputs ko teacher/beginner se review karao; tests ke naam ya counts ko learning-quality score mat samjho.

## 4. Production update kab aur kaise

Preview ki actual responses/device checks review hone ke baad, same checked source folder se:

```sh
npx vercel --prod
```

Production keys/scope bhi configured hon. Production URL par version aur ek text + photo smoke test dobara karo: production configuration preview se alag ho sakti hai. Future web updates ke liye wahi process: code change → tests → preview → review → production. Existing project/domain reuse karne se har update par students ko naya website address dene ki zaroorat nahi.

## 5. November app launch se pehle baaki kaam

Yeh ZIP Android `.aab` nahi hai. Android package/build, signing, camera/mic/navigation tests aur Play Console listing alag release work hai.

- Public use se pehle server-side abuse/rate limits, per-user quota/cost controls aur failure monitoring implement aur test karo. Current provider-rate-limit error handling app-level abuse control nahi hai.
- In-app answer reporting/feedback with a working destination, privacy disclosure, data-safety information and clear chat/photo deletion behaviour finish karo. Current code mein reporting backend ya full privacy flow included nahi hai. Google Play's generative-AI policy requires in-app reporting/flagging of offensive content without leaving the app: [policy](https://support.google.com/googleplay/android-developer/answer/13985936?hl=en).
- [Data safety form](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en) actual collection/sharing/retention se match karo. Browser-local history ka matlab yeh nahi ki prompts/photos AI provider tak nahi jaate.
- Play Console mein tumhare account par jo verification/testing gates apply hon, complete karo. New personal accounts created after 13 November 2023 have a closed-test requirement of at least 12 opted-in testers for 14 continuous days before applying for production access: [official requirement](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en). Apne account ki eligibility/gates Console mein confirm karo; approval automatic nahi.
- HOD aur students se unseen questions karvao. Correctness, basics samajhne, response time, language, repeat explanations, handwriting aur failure cases record karo. Kisi app ko every possible question par zero-error certify nahi kiya ja sakta.

**Ab next concrete step: v8 ka Vercel preview deploy karo aur uska link do.** Isse naye code ke actual AI answers aur visible interface ki remaining review ho sakti hai.

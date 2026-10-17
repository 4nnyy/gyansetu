# GyanSetu — Android launch, updates aur users ki capacity

Aniket Kumar Gupta ke liye · 17 October 2026 · Web candidate 8.2.5

**Abhi deliverable working web-app source hai, Android AAB nahi.** Copy/Edit aur earlier fixes is package mein hain. 173 automated tests pass hue hain, lekin new build ke real AI, actual-phone aur load tests pending hain. November launch ki planning mein in checks aur Play review ke liye time rakho.

## 1. Abhi kya karo

1. `GyanSetu-v8.2.5.zip` download karke **Extract all** karo. Inner `GyanSetu-Upgrade` folder hi project hai. ZIP ke andar se sirf `index.html` kholne par `/api/chat` nahi chalega.
2. `START-HERE.md` follow karke apne existing Vercel project ka **preview** deploy karo. Environment variable names `GROQ_API_KEY` aur `GEMINI_API_KEY` hain. Keys server settings mein rahengi; students ko keys nahi deni hain.
3. Preview par text, language switches, formulas, handwriting, Copy, Edit, Retry, photo viewer aur phone keyboard check karo. HOD rubric aur photo test sheet `evaluation/` mein hain.
4. Reviewed source ko production par deploy karo. Website update aur Play Store launch do alag releases hain.

## 2. Guide, Copy aur Edit kaise kaam karte hain

First visit par language choose karne aur options dhoondhne ki four-step guide milti hai. Skip/Finish/Escape ke baad same browser par repeat nahi. Preferences → Quick guide se dobara dekh sakte ho. Cleared data, incognito, blocked storage aur different domain/device par once-state shared nahi hai. Reply language Auto/Hinglish/English/हिन्दी mein choose hoti hai; explicit question language requests ko priority milti hai.

- **Copy:** message ko hold/right-click karo → Copy kholo. Original text, Markdown, formulas aur code copy hote hain; Simplify/Recap jaise button labels copy nahi hote. Clipboard permission unavailable ho to selectable text box khulta hai; long-press/device Copy use karo. Copied tabhi aata hai jab clipboard write successful ho.
- **Edit:** apne question ko hold/right-click karo → Edit kholo. Text badlo, phir **Save & resend**. Cancel/Escape se koi request nahi jaati.
- Edit ek nayi **“· edited”** chat banata hai. Us question se pehle ka context milta hai; uske baad ke old answers nayi AI request mein nahi jaate. Original chat Chats mein rahti hai. Photo-question ki saved photo resend hoti hai; missing photo par clear message milta hai.
- Composer mein likha alag draft/photo apni jagah rahta hai. Nayi request fail ho to Retry available hai. Existing eight-chat retention limit abhi bhi apply hoti hai: yeh unlimited archive nahi. Edited branch mein copied practice progress fresh start hoti hai; original progress source chat mein rahti hai.
- Chat/photo history is browser/device mein save hai. Browser data clear karne, different URL ya fresh app install par automatic cloud sync nahi hai. Native app mein browser wali history apne aap transfer nahi hogi.

## 3. Android app banane ka recommended route

**Meri recommendation: Capacitor Android app + Vercel backend.** Existing HTML/CSS/JS ko reuse kar sakte hain. App ka interface phone par package hota hai; AI ke liye internet se tumhare backend ko request jaati hai. Backend Groq/Gemini ko call karta hai. Model khud phone par install nahi hota.

**Current ZIP ko commands chala kar turant release mat samajhna.** Abhi frontend `fetch('/api/chat')` karta hai. Bundled Android app mein yeh tumhare Vercel domain ko automatically target nahi karega. Pehle ye integration work chahiye:

| Kaam | Kyon zaroori hai |
| --- | --- |
| Frontend ke liye production HTTPS API base URL | Android build sahi Vercel API ko call kare |
| Backend authentication/quota aur required cross-origin handling | Allowed app/web clients ka request flow chale; CORS khud authentication nahi hai |
| Dedicated `www` web-assets folder | Sirf public UI/assets bundle hon; API code, keys aur test files nahi |
| Android camera/photo picker, microphone, keyboard, Back aur lifecycle handling | Mobile Chrome mein chalna Android WebView mein chalne ka proof nahi |
| Native storage/upgrade behaviour | App restart/update aur photos ke retention ko verify kar sakein |
| App icon, launch screen, network error and offline states | App ek complete product ki tarah behave kare |

Computer par current stable Capacitor ke supported Node, Android Studio aur Android SDK install karo. Exact versions [official environment setup](https://capacitorjs.com/docs/getting-started/environment-setup) se lo. Dependencies ki compatible versions lock karo.

Integration-ready project mein typical initialization:

```sh
npm install @capacitor/core @capacitor/android
npm install --save-dev @capacitor/cli
npx cap init
```

App name `GyanSetu`; ek permanent unique Android application ID choose karo, jaise `com.aniket.gyansetu` **sirf example**. Config ka `webDir` prepared `www` folder ho. Us folder mein adapted `index.html` aur required public assets copy/build hone chahiye. Current project mein `www` build step abhi nahi hai.

```sh
npx cap add android
npx cap sync android
npx cap open android
```

Android Studio mein phone/emulator select karke debug build run karo. Real phone par camera, gallery, mic permission denied/allowed, Back, keyboard, rotation, slow network, photo zoom, Copy/Edit aur old-to-new app upgrade test karo. Web speech recognition ko native support samajhkar ship mat karo; actual device support ya proper native implementation verify karo.

References: [Capacitor installation](https://capacitorjs.com/docs/getting-started), [sync/run workflow](https://capacitorjs.com/docs/basics/workflow), [Google Play deployment](https://capacitorjs.com/docs/android/deploying-to-google-play).

## 4. Pehli baar Play Store par release

1. Apne naam/account se Play Console setup aur applicable identity/device verification complete karo. Login, recovery aur project ownership apne control mein rakho.
2. App listing taiyar karo: naam, actual features ki description, real screenshots, icon, contact details aur privacy-policy URL. Target audience, content rating, ads, app access aur Data safety answers actual app ke hisaab se bharo.
3. **App ke andar answer report/flag flow aur working receiving backend** chahiye. Google Play ki generative-AI policy offensive content report karne ka in-app option maangti hai. Sirf nonworking Report button ya external chat link sufficient implementation nahi hai. Reports ka review process bhi rakho. Current package mein yeh backend nahi hai. [AI policy](https://support.google.com/googleplay/android-developer/answer/13985936?hl=en)
4. Privacy mein prompts/photos ka server/AI-provider tak jaana, browser/app-local history, retention/deletion aur chosen providers ka actual processing explain karo. Login/analytics add karoge to disclosures dobara update hongi. [Data safety guide](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)
5. Android Studio → **Build → Generate Signed Bundle/APK → Android App Bundle**. Release AAB sign karo. Upload keystore/password ka secure backup rakho; source ZIP ya chat mein share mat karo. Play App Signing mein Google distributed app sign karta hai; tum upload key se AAB upload karte ho. [Signing guide](https://developer.android.com/studio/publish/app-signing)
6. Play Console ke **Internal testing** track par AAB upload karke install/test karo. Phir applicable closed testing complete karo. 13 November 2023 ke baad banaye personal accounts ke liye current requirement kam-se-kam **12 opted-in testers, 14 continuous days** hai, uske baad production access apply hota hai. Yeh automatic approval nahi hai; apne Console ke gates follow karo. [Testing requirement](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)
7. Console ke current Android target/API aur policy requirements resolve karo, production access/review complete karo, phir rollout. November ke liye exact approval date promise nahi ki ja sakti. [AAB upload](https://developer.android.com/studio/publish/upload-bundle)

## 5. Future updates ka simple process

| Tumne kya badla | Release kaise jayega |
| --- | --- |
| Server prompt, AI model routing, backend bug | Vercel preview → tests → production; existing Android client ke API contract ko compatible rakho |
| Website ka CSS/UI | Website redeploy se web users ko milega; locally bundled Android UI automatically nahi badlega |
| Android-bundled UI, native features, permissions, dependencies | Updated public assets → Capacitor sync → new signed AAB → Play testing/review/release |

Har Android release mein **same application ID** aur valid signing setup rakho. `versionCode` hamesha badhao (1 → 2 → 3); visible `versionName` ko 1.0 → 1.1 jaise set kar sakte ho. Web package ka `8.2.5` Android `versionCode` ko apne aap set nahi karta.

Normal update sequence: change → `npm test` → Vercel preview/backend check → public web-assets rebuild/copy → `npx cap sync android` → Android version increment → signed AAB → internal test, including upgrade over old install → production release with release notes. Update students ko Play Store se milta hai; rollout/auto-update settings ke karan sabko ek hi instant par milna guaranteed nahi.

Bad release aaye to rollout halt karo, cause fix karo aur **higher versionCode** wala corrected AAB do. Purana versionCode reuse mat karo. Old installed clients ke liye backend compatibility rakho; backend-only rollback aur app rollback ka process alag hai. [Android versioning](https://developer.android.com/studio/publish/versioning)

## 6. Kya bahut saare students use kar paayenge?

**Haan, students apne phones se use kar sakte hain; lekin abhi unlimited simultaneous users ka evidence nahi hai.** Students ko personal Groq/Gemini key ki zaroorat nahi. Sabki AI requests tumhare configured provider project/organization ki quota aur bill use karengi. Free app hone ka matlab tumhara backend free/unlimited nahi.

Groq limits organization level par aur Gemini limits project level par apply hote hain. Requests/minute, tokens/minute, daily allowance aur model access mein jo limit pehle hit ho, woh bottleneck ban sakti hai. Account ki exact current limits dashboard se lo; same project ki extra API keys banana capacity plan nahi hai. [Groq limits](https://console.groq.com/docs/rate-limits), [Gemini limits](https://ai.google.dev/gemini-api/docs/rate-limits)

**Illustrative planning example, measured result nahi:** 100 active students agar har minute ek question bhejein, to 100 app requests/minute hongi. Agar ek request ka average input + output 2,500 tokens ho, to base volume 250,000 tokens/minute hoga. History, photo processing, reasoning, provider retries aur answer repair actual billed usage/calls badha sakte hain. “100 registered users” aur “100 ek saath questions bhej rahe hain” alag load hai.

Current origin/CSP checks user authentication ya shared quota nahi hain. `SECURITY-AND-RELEASE.md` mein remaining gates aur preview smoke tests hain. Current backend deliberately cross-origin browser calls reject karta hai: Android integration mein verified auth + a narrow client-origin policy design karni hogi; wildcard CORS se security fix nahi hoti.

Public college launch se pehle:

- Server par user/session-based quota, shared-store rate limiter, abuse controls aur overall cost cap implement karo. Sirf browser disable button ya per-process memory counter distributed serverless limit nahi hai.
- Small opt-in pilot chalao; phir provider allowance ke andar planned 5/10/25 concurrent requests ke batches se ramp karo. Success rate, p50/p95 latency, timeout/429, token use aur cost record karo. Load test bhi paid usage kar sakta hai; dedicated budget rakho.
- Budget alerts ke saath server-side enforcement define karo. Limit hit hone par clear cooldown/retry state do; uncontrolled automatic retry loop mat banao. [Groq spend controls](https://console.groq.com/docs/spend-limits), [Gemini billing](https://ai.google.dev/gemini-api/docs/billing)
- Production monitoring mein errors/latency/model/quota track karo. Student messages/photos ko unnecessary logs mein mat likho. Current code ka provider fallback public abuse protection ya load-test result nahi hai.

Exact “kitne students” aur monthly bill tab calculate hoga jab provider tier/quota, expected daily questions, photo share aur measured tokens pata hon. Abhi koi fixed user-capacity promise sahi nahi hoga.

## 7. Students GyanSetu kyun use karenge?

Iska useful promise rakho: **“Apne question ya handwritten problem ko apni language mein samjho—formula ke symbols, uski wajah, worked steps aur practice ke saath.”** Simplify/Explain a step/Practice ko ek focused study flow banao. Har general question ko lesson mein mat badlo.

Is advantage ko teacher/student test se prove karo: explanation ke baad learner ek naya similar question khud kar paata hai? Doosri baar confusion par explanation badalti hai? Unclear photo par tutor uncertainty maanta hai? Factual claims aur formula steps correct hain? Yeh outcomes “all subjects” ya “10/10” label se zyada useful evidence hain.

Current engineering checks ka exact scope `evaluation/FINAL-CHECK.md` mein hai. First milestone reviewed web preview; next milestone controlled student pilot; uske baad Android/Play release. Is package ko zero-bug ya already Play-ready certificate mat samjho.

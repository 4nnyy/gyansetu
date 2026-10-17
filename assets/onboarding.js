/* First-visit guide. Local UI only: no AI calls, analytics or remote dependency. */
(function (root) {
  'use strict';
  const SEEN_KEY = 'gyansetu_quick_start_v1';
  const copy = {
    en: {
      skip: 'Skip', back: 'Back', next: 'Next', done: 'Get started', more: 'More options', step: n => `Quick guide · ${n} of 4`,
      label: 'Reply language · Jawab ki language',
      help: 'Auto follows your question. Hinglish means Hindi in English letters, like “Aasaan example se samjhao”.',
      note: 'You can reopen this guide from Preferences → Quick guide.',
      titles: ['Choose your reply language', 'Ask in your own way', 'Learn, then practise', 'Keep your questions organised'],
      descriptions: ['Jawab kis language mein chahiye? Choose once; change it whenever you like.', 'Type a question in the box at the bottom, or share a clear photo.', 'Use Learn for a step-by-step explanation, or Exam for a concise answer.', 'In Chats, open Subject to focus your study. All subjects works for any question.'],
      locations: ['Top right → Preferences', 'Bottom → question box and +', 'Above the question box → Learn / Exam', ''],
      details: [
        ['Step by step explains the needed basics, symbols and reasons. Focused explanation gives more attention to the specific doubt when you know the basics.', 'Class or semester is optional: add it to guide the level of examples. Preferences save automatically on this browser.', 'Auto matches the question; a saved language sets your usual preference. An explicit request such as “reply in English” takes priority for that answer.'],
        ['The send arrow submits your question. Example prompts on the home screen only fill the box; review them before sending.', 'Tap the attached thumbnail to check it; × removes it before sending. In the photo viewer, + / − zoom, Fit resets the view, and Use photo attaches it for another question.', 'If a request fails, Retry sends that question again. Keep the photo clear, especially signs and fractions.'],
        ['Copy takes the message text; Select text lets you choose only some words. Edit is for your own typed questions: Save & resend creates an edited chat while the original stays in Chats.', 'Simplify explains more simply; Explain a step focuses on a line or formula you select or paste. Recap gives a short revision; Listen reads the answer when supported.', 'Practice gives a similar question: enter your working and use Check answer, or choose Show solution. Continue answer appears when a reply was cut short.'],
        ['In Chats, open the ⋮ beside a conversation for Delete chat. Deleting removes it from this browser.', 'Up to eight chats are kept locally; older chats may be removed as new ones are added. History does not sync across devices, and clearing browser data can remove it.', 'Skip or Get started dismisses this guide. It stays dismissed in this browser; a new device, private browsing or cleared storage can show it again.']
      ],
      points: [
        ['Your choice applies to the next answer and saves in this browser.', 'Preferences also contains explanation depth and optional class/semester.'],
        ['The + beside the question box opens Upload photo; on phones, Take photo is also available.', 'The microphone lets you dictate where your browser supports it. Tap a sent photo to open and zoom it.'],
        ['Hold a message on your phone, or right-click it on desktop, for Copy and Select text. Your own questions also offer Edit.', 'Open Study tools below an answer for Simplify, Recap, Explain a step or Practice. Listen is there too; tools stay collapsed until needed.'],
        ['New chat starts a separate conversation. Chats lets you reopen previous ones.', 'Language and learning settings are always in Preferences at the top right.']
      ]
    },
    hinglish: {
      skip: 'Skip', back: 'Peechhe', next: 'Aage', done: 'Shuru karein', more: 'Baaki options samjhein', step: n => `Quick guide · ${n} / 4`,
      label: 'Jawab ki language',
      help: 'Auto question ki language follow karta hai. Hinglish mein Hindi English letters mein aati hai: “Aasaan example se samjhao”.',
      note: 'Dobara dekhna ho: Preferences → Quick guide.',
      titles: ['Apni reply language chuno', 'Apna question bhejo', 'Samjho, phir practice karo', 'Apni chats aasaani se dhoondo'],
      descriptions: ['Jo language aasaan lage, woh chuno. Baad mein bhi badal sakte ho.', 'Neeche question box mein likho, ya question ki saaf photo bhejo.', 'Learn mein step-by-step samjho. Exam mein concise answer lo.', 'Chats mein Subject kholkar topic chuno. Har tarah ke question ke liye All subjects rehne do.'],
      locations: ['Upar daaye → Preferences', 'Neeche → question box aur +', 'Question box ke upar → Learn / Exam', ''],
      details: [
        ['Step by step mein zaroori basics, symbols aur har step ki wajah milti hai. Basics aate hain toh Focused explanation specific doubt par zyada dhyaan deta hai.', 'Class/semester optional hai; bharne se examples ka level tay karne mein madad milti hai. Preferences is browser mein apne aap save hoti hain.', 'Auto question ki language match karta hai; saved language tumhari usual preference hai. Question mein “reply in English” jaisi clear request us answer ke liye priority leti hai.'],
        ['Send arrow se question bhejo. Home ke example prompts sirf box mein bharte hain; pehle dekh lo, phir bhejo.', 'Attached thumbnail par tap se photo check karo; × se bhejne se pehle hatao. Viewer mein + / − se zoom, Fit se normal view aur Use photo se dobara attach karo.', 'Request fail ho toh Retry wahi question dobara bhejta hai. Photo mein signs aur fractions saaf dikhne chahiye.'],
        ['Copy poora message leta hai; Select text se kuch words chun sakte ho. Edit apne typed question par milta hai: Save & resend se edited chat banti hai, original Chats mein rehti hai.', 'Simplify aasaan tareeke se samjhata hai; Explain a step mein line/formula select ya paste karo. Recap chhoti revision hai; Listen supported browser mein answer padhta hai.', 'Practice mein similar question par apni working likho aur Check answer karo, ya Show solution kholo. Reply beech mein kata ho tab Continue answer milta hai.'],
        ['Chats mein conversation ke paas ⋮ → Delete chat se use is browser se hata sakte ho.', 'Is browser mein 8 chats tak rehti hain; nayi chats banne par purani hat sakti hain. History doosre devices par sync nahi hoti; browser data clear karne se mit sakti hai.', 'Skip ya Shuru karein ke baad guide is browser mein auto-repeat nahi hoti. Naya device, private browsing ya cleared storage par phir dikh sakti hai.']
      ],
      points: [
        ['Yeh choice agle answer se apply hogi aur is browser mein save rahegi.', 'Preferences mein explanation depth aur class/semester bhi set kar sakte ho.'],
        ['Question box ke paas + se Upload photo khulta hai. Phone par Take photo bhi milega.', 'Browser support kare toh microphone se bolkar likh sakte ho. Bheji photo par tap karke zoom karo.'],
        ['Phone par message dabaakar rakho; desktop par right-click karo. Copy/Select text milenge, apne question par Edit bhi.', 'Answer ke neeche Study tools kholo: Simplify, Recap, Explain a step, Practice aur Listen. Yeh options zaroorat par hi khulte hain.'],
        ['New chat se alag conversation shuru hoti hai. Chats mein purani conversations milengi.', 'Language aur learning settings ke liye upar daaye Preferences kholo.']
      ]
    },
    hi: {
      skip: 'छोड़ें', back: 'पीछे', next: 'आगे', done: 'शुरू करें', more: 'बाकी विकल्प समझें', step: n => `छोटी गाइड · ${n} / 4`,
      label: 'जवाब की भाषा',
      help: 'Auto आपके सवाल की भाषा चुनता है। Hinglish में हिंदी अंग्रेज़ी अक्षरों में आती है: “Aasaan example se samjhao”.',
      note: 'दोबारा देखें: Preferences → Quick guide.',
      titles: ['जवाब की भाषा चुनें', 'अपना सवाल भेजें', 'समझें, फिर अभ्यास करें', 'अपनी चैट आसानी से ढूँढें'],
      descriptions: ['जिस भाषा में समझना आसान लगे, उसे चुनें। बाद में भी बदल सकते हैं।', 'नीचे सवाल वाले बॉक्स में लिखें या सवाल की साफ़ फोटो भेजें।', 'Learn में चरणों में समझें। Exam में संक्षिप्त उत्तर पाएँ।', 'Chats में Subject खोलकर विषय चुनें। हर तरह के सवाल के लिए All subjects रहने दें।'],
      locations: ['ऊपर दाईं तरफ़ → Preferences', 'नीचे → सवाल का बॉक्स और +', 'सवाल के बॉक्स के ऊपर → Learn / Exam', ''],
      details: [
        ['Step by step में ज़रूरी बुनियाद, संकेतों के अर्थ और चरणों की वजह समझें। बुनियाद आती है तो Focused explanation आपके खास सवाल पर ज़्यादा ध्यान देता है।', 'कक्षा/सेमेस्टर भरना वैकल्पिक है; इससे उदाहरणों का स्तर तय करने में मदद मिलती है। पसंद इस ब्राउज़र में अपने आप सहेजी जाती है।', 'Auto सवाल की भाषा चुनता है; सहेजी भाषा आपकी सामान्य पसंद है। सवाल में “reply in English” जैसी स्पष्ट माँग उस उत्तर के लिए प्राथमिकता लेती है।'],
        ['तीर वाले Send से सवाल भेजें। होम के उदाहरण सिर्फ बॉक्स में भरते हैं; जाँचकर भेजें।', 'जुड़ी फोटो पर टैप करके जाँचें; × से भेजने से पहले हटाएँ। व्यूअर में + / − से ज़ूम, Fit से सामान्य दृश्य और Use photo से दोबारा जोड़ें।', 'अनुरोध विफल हो तो Retry वही सवाल फिर भेजता है। फोटो में संकेत और भिन्न साफ़ दिखने चाहिए।'],
        ['Copy पूरा संदेश लेता है; Select text से कुछ शब्द चुनें। Edit अपने लिखे सवाल पर मिलता है: Save & resend से संपादित चैट बनती है, मूल चैट Chats में रहती है।', 'Simplify आसान तरीके से समझाता है; Explain a step में पंक्ति/सूत्र चुनें या पेस्ट करें। Recap छोटी पुनरावृत्ति है; Listen समर्थित ब्राउज़र में उत्तर पढ़ता है।', 'Practice में मिलते-जुलते सवाल की विधि लिखकर Check answer करें, या Show solution खोलें। उत्तर बीच में कटने पर Continue answer मिलता है।'],
        ['Chats में बातचीत के पास ⋮ → Delete chat से उसे इस ब्राउज़र से हटाएँ।', 'इस ब्राउज़र में अधिकतम 8 चैट रहती हैं; नई बनने पर पुरानी हट सकती हैं। इतिहास दूसरे उपकरणों पर सिंक नहीं होता; ब्राउज़र डेटा साफ़ करने से मिट सकता है।', 'छोड़ें या शुरू करें के बाद गाइड इस ब्राउज़र में अपने आप नहीं लौटती। नए उपकरण, निजी ब्राउज़िंग या डेटा साफ़ करने पर फिर दिख सकती है।']
      ],
      points: [
        ['यह पसंद अगले जवाब से लागू होगी और इस ब्राउज़र में सहेजी जाएगी।', 'Preferences में समझाने का स्तर और कक्षा/सेमेस्टर भी चुन सकते हैं।'],
        ['सवाल के बॉक्स के पास + से Upload photo खोलें। फोन पर Take photo भी मिलेगा।', 'ब्राउज़र में सुविधा हो तो माइक्रोफोन से बोलकर लिखें। भेजी फोटो पर टैप करके ज़ूम करें।'],
        ['फोन पर संदेश दबाकर रखें या डेस्कटॉप पर दायाँ क्लिक करें। Copy/Select text मिलेंगे; अपने सवाल पर Edit भी।', 'उत्तर के नीचे Study tools में Simplify, Recap, Explain a step, Practice और Listen मिलते हैं। ये विकल्प ज़रूरत पर ही खोलें।'],
        ['New chat से अलग बातचीत शुरू करें। Chats में पुरानी बातचीत खोलें।', 'भाषा और पढ़ाई की सेटिंग ऊपर दाईं तरफ़ Preferences में हैं।']
      ]
    }
  };

  function create(options) {
    const doc = root.document, el = id => doc.getElementById(id);
    const dialog = el('quickGuide'), language = el('guideLanguage'), next = el('guideNext'), back = el('guideBack'), skip = el('guideSkip');
    let step = 0, renderedStep = -1, open = false, autoAttempted = false, opener = null, background = [];
    // Capture this before app initialization saves default preferences.
    let firstVisit = true;
    try {
      if (options.storage.getItem(SEEN_KEY) === '1') firstVisit = false;
      else {
        const readJSON = key => { try { return JSON.parse(options.storage.getItem(key) || 'null'); } catch (_) { return null; } };
        const profile = readJSON(options.learnerKey), history = readJSON(options.sessionKey);
        firstVisit = !(profile && typeof profile === 'object' && !Array.isArray(profile))
          && !(Array.isArray(history) && history.some(s => Array.isArray(s?.messages) && s.messages.length));
      }
    } catch (_) { /* A storage failure must never block the app or the dismiss buttons. */ }

    function render(focusTitle = false) {
      const lang = options.getLanguage(), text = copy[lang] || copy.en;
      const mobile = root.matchMedia('(max-width: 760px)').matches;
      dialog.lang = lang === 'hi' ? 'hi' : lang === 'hinglish' ? 'hi-Latn' : 'en';
      el('guideProgress').textContent = text.step(step + 1);
      el('guideTitle').textContent = text.titles[step];
      el('guideDescription').textContent = text.descriptions[step];
      el('guideLanguageLabel').textContent = text.label; el('guideLanguageHelp').textContent = text.help;
      el('guideLanguageGroup').hidden = step !== 0; language.value = lang;
      el('guideNote').textContent = text.note;
      skip.textContent = text.skip; back.textContent = text.back; back.hidden = step === 0;
      next.textContent = step === 3 ? text.done : text.next;
      const points = el('guidePoints'); points.textContent = '';
      text.points[step].forEach(value => { const item = doc.createElement('li'); item.textContent = value; points.appendChild(item); });
      const extra = el('guideDetails'); extra.textContent = '';
      text.details[step].forEach(value => { const item = doc.createElement('li'); item.textContent = value; extra.appendChild(item); });
      el('guideMoreLabel').textContent = text.more;
      if (step !== renderedStep) el('guideMore').removeAttribute('open');
      renderedStep = step;
      const icon = el('guideIcon'); icon.textContent = '';
      const source = el(['preferencesToggle', 'attachMenuToggle', 'learnModeBtn', mobile ? 'sessionToggle' : 'newChatBtn'][step]);
      const svg = source?.querySelector('svg');
      if (svg) icon.appendChild(svg.cloneNode(true)); else icon.textContent = step === 2 ? 'Learn' : '+ New chat';
      el('guideLocation').textContent = step === 3
        ? (lang === 'hi' ? (mobile ? 'ऊपर बाईं तरफ़ ☰ → Chats; ऊपर + → New chat' : 'बायाँ पैनल → Your chats / New chat')
          : lang === 'hinglish' ? (mobile ? 'Upar baaye ☰ → Chats; upar + → New chat' : 'Baaya panel → Your chats / New chat')
          : (mobile ? 'Top left ☰ → Chats; top + → New chat' : 'Left sidebar → Your chats / New chat'))
        : text.locations[step];
      if (focusTitle) el('guideTitle').focus();
    }

    function finish() {
      if (!open) return;
      open = false;
      let saved = true;
      try { options.storage.setItem(SEEN_KEY, '1'); } catch (_) { saved = false; }
      if (typeof dialog.close === 'function' && dialog.hasAttribute('open')) dialog.close();
      else dialog.removeAttribute('open');
      background.forEach(([node, inert]) => { node.inert = inert; }); background = [];
      if (opener?.isConnected) opener.focus();
      if (!saved) options.onStorageFailure?.();
    }

    function show() {
      if (open || !options.canOpen()) return false;
      options.beforeOpen(); opener = el('preferencesToggle'); step = 0; renderedStep = -1; render();
      background = ['appHeader', 'appRoot'].map(id => [el(id), Boolean(el(id).inert)]);
      background.forEach(([node]) => { node.inert = true; });
      try {
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else dialog.setAttribute('open', '');
      } catch (_) { dialog.setAttribute('open', ''); }
      open = true; el('guideTitle').focus(); return true;
    }

    language.addEventListener('change', () => {
      if (!['auto', 'hinglish', 'en', 'hi'].includes(language.value)) return;
      options.setLanguage(language.value); render();
    });
    next.addEventListener('click', () => { if (!open) return; if (step === 3) finish(); else { step++; render(true); } });
    back.addEventListener('click', () => { if (open && step > 0) { step--; render(true); } });
    skip.addEventListener('click', finish);
    dialog.addEventListener('cancel', e => { e.preventDefault(); finish(); });
    dialog.addEventListener('close', finish);
    dialog.addEventListener('keydown', e => {
      if (!open) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(); }
      if (e.key === 'Tab') {
        const controls = Array.from(dialog.querySelectorAll('button, select, summary')).filter(node => !node.disabled && !node.closest('[hidden]'));
        const first = controls[0], last = controls.at(-1), active = doc.activeElement;
        if (e.shiftKey && (active === first || !controls.includes(active))) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && (active === last || !controls.includes(active))) { e.preventDefault(); first?.focus(); }
      }
    });
    el('quickGuideBtn').addEventListener('click', show);
    root.addEventListener('resize', () => { if (open) render(); });
    return {
      start() { if (autoAttempted) return false; autoAttempted = true; return firstVisit ? show() : false; },
      show, close: finish
    };
  }
  root.GyanSetuOnboarding = { create };
})(typeof window === 'undefined' ? globalThis : window);

'use strict';

// Only narrow creator questions use this factual, quota-free answer. Technical,
// mixed or broader questions still use the normal truthful tutor policy.
function creatorReply(question, language) {
  const text = String(question || '')
    .trim()
    .toLowerCase()
    .replace(/[?!.।]+$/u, '')
    .trim();
  const creator =
    /^(?:who (?:made|created|built|developed) (?:you|gyansetu)|who is (?:your|gyansetu'?s) (?:creator|developer)|(?:tumhe|tumko|aapko|gyansetu ko) kisne (?:banaya|develop kiya)(?: hai)?|(?:tumhara|tumhare|aapke) (?:creator|developer) (?:kaun|kon) (?:hai|hain)|(?:तुम्हें|तुमको|आपको|ज्ञानसेतु को) किसने बनाया(?: है)?|(?:तुम्हारा|आपका) डेवलपर कौन है)$/u.test(
      text
    );
  if (!creator) return null;
  return (
    {
      en: 'GyanSetu was created by Aniket Kumar Gupta, its independent developer. He built it to help students understand concepts and learn step by step.',
      hinglish:
        'GyanSetu ko Aniket Kumar Gupta ne banaya hai. Woh iske independent developer hain. Unhone ise students ko concepts samajhne aur step by step seekhne mein madad karne ke liye banaya hai.',
      hi: 'ज्ञानसेतु को अनिकेत कुमार गुप्ता ने बनाया है। वे इसके स्वतंत्र डेवलपर हैं। उन्होंने इसे विद्यार्थियों को अवधारणाएँ समझने और चरणों में सीखने में मदद करने के लिए बनाया है।',
    }[language] || null
  );
}

module.exports = { creatorReply };

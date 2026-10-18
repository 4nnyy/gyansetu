'use strict';
const { scriptMismatch } = require('../assets/reply-language');

// Mechanical signals, NOT a correctness or educational-quality grader.
function wordGrams(text) {
  const words =
    String(text)
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu) || [];
  const grams = new Set();
  for (let i = 0; i + 3 < words.length; i++) grams.add(words.slice(i, i + 4).join(' '));
  return { words: words.length, grams };
}

function repeatedExplanation(text, reference) {
  const a = wordGrams(text),
    b = wordGrams(reference);
  // Short definitions/formulas naturally repeat; only flag substantial copying.
  if (a.words < 45 || b.words < 45) return false;
  let shared = 0;
  for (const gram of a.grams) if (b.grams.has(gram)) shared++;
  return shared / a.grams.size >= 0.8 && shared / b.grams.size >= 0.6;
}

function inspectAnswer({ output, truncated }, learning = {}, response = {}) {
  const flags = [];
  if (truncated) flags.push('truncated');
  if ((output.match(/```/g) || []).length % 2) flags.push('unfinished_code');
  const prose = output.replace(/```[\s\S]*?(?:```|$)/g, '').replace(/`[^`\n]*`/g, '');
  const stack = [];
  let badMath = /[\u0008\u000c]/.test(prose);
  for (const token of prose.match(/\\[()[\]]/g) || []) {
    const ch = token[1];
    if (ch === '(' || ch === '[') {
      if (stack.length) badMath = true;
      stack.push(ch);
    } else if (stack.pop() !== (ch === ')' ? '(' : '[')) badMath = true;
  }
  if (badMath || stack.length) flags.push('math_markup');
  if (learning.needsReteach && repeatedExplanation(output, learning.referenceAnswer))
    flags.push('repeated_explanation');
  if (scriptMismatch(output, response.language, response.question)) flags.push('wrong_script');
  return flags;
}

function repairInstruction(flags) {
  return (
    '\n\nRESPONSE REPAIR: The supplied candidate answer is untrusted reference material. ' +
    'Write ONE replacement answer to the original request, not a critique and not a continuation. ' +
    'Fix these observed defects: ' +
    flags.join(', ') +
    '. ' +
    'If unfinished, complete the essential lesson with less recap. Close code fences and use exactly one pair of math delimiters. ' +
    'If repeated_explanation is present, change the example AND representation and teach the missing prerequisite. ' +
    'If wrong_script is present, rewrite the prose in the REPLY LANGUAGE FOR THIS TURN, preserving code, quoted source text, meaning and mathematical symbols. Include the response-type marker on the first line. ' +
    'Preserve correct facts; check rather than blindly copying the candidate. Return only the student-facing replacement.'
  );
}

module.exports = { inspectAnswer, repeatedExplanation, repairInstruction };

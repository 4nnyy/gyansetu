#!/usr/bin/env node
'use strict';
// Sequential real-answer collection. Human review, never keyword-based "10/10".
const fs = require('node:fs/promises');
const path = require('node:path');
const cases = require('../evaluation/cases');

function parseArgs(args) {
  const opts = { limit: 5, out: 'evaluation-results.json' };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--list') opts.list = true;
    else if (arg === '--local') opts.local = true;
    else if (['--url', '--out', '--limit', '--case'].includes(arg)) {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error('Missing value for ' + arg);
      opts[arg.slice(2)] = value;
    } else throw new Error('Unknown argument: ' + arg);
  }
  opts.limit = Number(opts.limit);
  if (!Number.isInteger(opts.limit) || opts.limit < 1 || opts.limit > cases.length) throw new Error('Limit must be 1-' + cases.length);
  if (opts.case && !cases.some(c => c.id === opts.case)) throw new Error('Unknown case ID');
  if (opts.url) {
    const url = new URL(opts.url);
    if (url.username || url.password || url.search || url.hash) throw new Error('Use a plain preview URL without credentials, query or fragment');
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) throw new Error('Use HTTPS (or localhost HTTP)');
    if (url.pathname !== '/') throw new Error('Use the deployment root URL');
    opts.url = url.origin;
  }
  if (!opts.list && Number(Boolean(opts.url)) + Number(Boolean(opts.local)) !== 1) throw new Error('Choose --local OR --url https://your-preview.vercel.app');
  return opts;
}

async function collect(selected, invoke) {
  const results = [];
  for (const scenario of selected) {
    const messages = [], turns = [];
    for (const turn of scenario.turns) {
      const start = performance.now();
      let result;
      try { result = await invoke({ subject: scenario.subject, answerMode: turn.answerMode || 'learn', learner: turn.learner || scenario.learner, text: turn.text, messages: [...messages] }); }
      catch { result = { status: 0, data: { error: 'Request failed or timed out' } }; }
      const data = result.data || {};
      const successful = result.status === 200 && typeof data.text === 'string' && data.text.trim().length > 0;
      turns.push({ question: turn.text, expected: turn.expected, status: result.status,
        durationMs: Math.round(performance.now() - start), answer: successful ? data.text : null,
        error: successful ? null : data.error || 'No usable answer', model: data.model || null,
        teachingVersion: data.teachingVersion || null, truncated: Boolean(data.truncated), quality: data.quality || null,
        responseLanguage: data.responseLanguage || null, responseKind: data.responseKind || null,
        // null explicitly means NOT REVIEWED, not zero or a pass.
        humanScores: { correctness: null, prerequisites: null, whyAndOrigin: null, clarity: null, fitAndCompleteness: null }, reviewerNotes: '' });
      if (!successful) break; // A follow-up without its explanation is not a valid dialogue test.
      messages.push({ role: 'user', content: turn.text }, { role: 'assistant', content: data.text });
    }
    results.push({ id: scenario.id, subject: scenario.subject, completedTurns: turns.length,
      plannedTurns: scenario.turns.length, turns });
  }
  return results;
}

async function main(args) {
  const opts = parseArgs(args);
  if (opts.list) { for (const c of cases) console.log(c.id + ' | ' + c.subject + ' | ' + c.turns[0].text); return; }
  let invoke;
  if (opts.local) {
    if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) throw new Error('No local provider key configured. Use the keys privately in environment variables, or test a configured preview URL.');
    const handler = require('../api/chat');
    invoke = async body => {
      const result = {};
      await handler({ method: 'POST', headers: { 'content-type': 'application/json' }, body }, { status(code) { result.status = code; return this; }, json(data) { result.data = data; return this; } });
      return result;
    };
  } else {
    invoke = async body => {
      const response = await fetch(opts.url + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body), signal: AbortSignal.timeout(40000), redirect: 'error' });
      const data = await response.json().catch(() => ({ error: 'Non-JSON response; the preview may require authentication' }));
      return { status: response.status, data };
    };
  }
  const selected = opts.case ? cases.filter(c => c.id === opts.case) : cases.slice(0, opts.limit);
  console.log('Collecting ' + selected.length + ' scenarios sequentially. These calls use your provider quota.');
  const results = await collect(selected, invoke);
  const report = { createdAt: new Date().toISOString(), target: opts.url || 'local handler',
    status: 'answers-collected-awaiting-human-review', note: 'No automatic teaching-quality/correctness pass is assigned.', results };
  const output = path.resolve(opts.out);
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
  const turns = results.flatMap(c => c.turns);
  const failures = turns.filter(t => t.answer === null).length;
  const versionMismatches = turns.filter(t => t.answer !== null && t.teachingVersion !== 'basics-v8').length;
  console.log('Saved: ' + output + '\nAnswers: ' + (turns.length - failures) + '; request failures: ' + failures + '; wrong/missing upgrade version: ' + versionMismatches);
  console.log('Review answers using evaluation/HOD-TEST.md. This run does not establish a 10/10 score.');
  if (failures || versionMismatches) process.exitCode = 1;
}

if (require.main === module) main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { parseArgs, collect };

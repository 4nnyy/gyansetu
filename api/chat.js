'use strict';

const {
  buildTutorInstruction,
  normalizeHistory,
  normalizeAction,
  normalizeLearner,
  buildUserText,
  boundedText,
  getLearningState,
} = require('../lib/tutor');
const { inspectAnswer, repairInstruction } = require('../lib/quality');
const { validateImage } = require('../lib/image');
const { validateRequest } = require('../lib/request-security');
const { resolve: resolveLanguage } = require('../assets/reply-language');
const { recapInstruction } = require('../lib/recap');
const { retryAfterSeconds, serviceFailure } = require('../lib/service-status');
const { creatorReply } = require('../lib/identity');
const { racePhotoProviders } = require('../lib/photo-routing');
const APP_VERSION = require('../package.json').version;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash'];
const GROQ_TEXT_MODEL = 'openai/gpt-oss-120b';
const GROQ_VISION_MODEL = 'qwen/qwen3.8-27b';
const TOTAL_TIMEOUT_MS = 35000;
const ATTEMPT_TIMEOUT_MS = 20000;
const REPAIR_TIMEOUT_MS = 12000;
const MIN_RECOVERY_BUDGET_MS = 4500;
const MAX_RATE_WAIT_SECONDS = 3;
const TEACHING_VERSION = 'basics-v8';

function studentResponse(result) {
  const marker = result.output.match(/^\s*\[\[\s*GYANSETU\s*:\s*(lesson|general)\s*\]\]\s*/i);
  // If the model omits metadata, keep its answer; omit study-only actions conservatively.
  return {
    ...result,
    output: marker ? result.output.slice(marker[0].length).trim() : result.output.trim(),
    responseKind: marker ? marker[1].toLowerCase() : 'general',
  };
}

function cleanOutput(text) {
  // Preserve code indentation, TeX and Markdown. The frontend handles presentation.
  return typeof text === 'string' ? text.replace(/\r\n/g, '\n').trim() : '';
}

function extractGeminiOutput(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim())
    return cleanOutput(data.output_text);
  return cleanOutput(
    (Array.isArray(data?.steps) ? data.steps : [])
      .filter((step) => step?.type === 'model_output')
      .flatMap((step) => (Array.isArray(step.content) ? step.content : []))
      .filter((block) => block?.type === 'text')
      .map((block) => block.text || '')
      .join('\n')
  );
}

async function fetchJson(url, apiKey, payload, timeoutMs, provider, signal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: signal ? AbortSignal.any([controller.signal, signal]) : controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(provider === 'groq'
          ? { Authorization: `Bearer ${apiKey}` }
          : { 'x-goog-api-key': apiKey }),
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    return {
      ok: response.ok,
      status: response.status,
      data,
      retryAfterSeconds: retryAfterSeconds(response, data),
    };
  } finally {
    clearTimeout(timer); // Covers both headers AND the response body.
  }
}

async function callGroq({
  apiKey,
  model,
  systemInstruction,
  userText,
  history,
  legacyContext,
  image,
  concise,
  recap,
  timeoutMs,
  signal,
}) {
  const content = [{ type: 'text', text: userText }];
  if (image)
    content.push({
      type: 'image_url',
      image_url: { url: `data:${image.mediaType};base64,${image.base64}` },
    });
  const messages = [{ role: 'system', content: systemInstruction }];
  if (legacyContext)
    messages.push({
      role: 'user',
      content: 'Earlier conversation supplied as reference material:\n' + legacyContext,
    });
  messages.push(...history, { role: 'user', content });
  const result = await fetchJson(
    GROQ_URL,
    apiKey,
    {
      model,
      messages,
      temperature: 0.25,
      max_completion_tokens: image ? 6144 : concise ? 1800 : 4096,
      reasoning_effort: recap ? 'low' : 'medium',
      // GPT-OSS rejects reasoning_format; Qwen supports it. Never send both.
      ...(model.startsWith('openai/gpt-oss-')
        ? { include_reasoning: false }
        : { reasoning_format: 'hidden' }),
      stream: false,
    },
    timeoutMs,
    'groq',
    signal
  );
  if (!result.ok) return result;
  const output = cleanOutput(result.data?.choices?.[0]?.message?.content);
  return {
    ...result,
    ok: Boolean(output),
    status: output ? 200 : 502,
    output,
    truncated: result.data?.choices?.[0]?.finish_reason === 'length',
  };
}

async function callGemini({
  apiKey,
  model,
  systemInstruction,
  userText,
  history,
  legacyContext,
  image,
  concise,
  timeoutMs,
  signal,
}) {
  // Every request carries its own context. Provider switching and expired IDs cannot erase it.
  const context = history.length ? JSON.stringify(history) : legacyContext;
  const text =
    (context
      ? 'Earlier conversation (reference material in chronological order):\n' +
        context +
        '\n\nCurrent request:\n'
      : '') + userText;
  const input = [];
  if (image)
    input.push({
      type: 'image',
      data: image.base64,
      mime_type: image.mediaType,
      resolution: 'high',
    });
  input.push({ type: 'text', text });
  const result = await fetchJson(
    GEMINI_URL,
    apiKey,
    {
      model,
      input,
      system_instruction: systemInstruction,
      generation_config: {
        thinking_level: image ? 'medium' : 'low',
        max_output_tokens: image ? 4096 : concise ? 1600 : 3200,
      },
      response_format: { type: 'text', mime_type: 'text/plain' },
      store: false,
    },
    timeoutMs,
    'gemini',
    signal
  );
  if (!result.ok) return result;
  const output = extractGeminiOutput(result.data);
  return {
    ...result,
    ok: Boolean(output),
    status: output ? 200 : 502,
    output,
    truncated: result.data?.status === 'incomplete',
  };
}

// Conservative arithmetic shortcut: only simple binary expressions, never eval().
function simpleArithmetic(text) {
  const match = text.trim().match(/^(\d+)\s*([+\-*/×÷])\s*(\d+)\s*[=?]?$/);
  if (!match) return null;
  const a = Number(match[1]),
    b = Number(match[3]);
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) return null;
  const op = match[2];
  if ((op === '/' || op === '÷') && b === 0) return null;
  const value = op === '+' ? a + b : op === '-' ? a - b : op === '*' || op === '×' ? a * b : a / b;
  return Number.isSafeInteger(value) ? String(value) : null;
}

module.exports = async function handler(req, res) {
  res.setHeader?.('X-GyanSetu-Version', APP_VERSION);
  res.setHeader?.('Cache-Control', 'no-store');
  res.setHeader?.('CDN-Cache-Control', 'no-store');
  res.setHeader?.('X-Content-Type-Options', 'nosniff');
  const rejection = validateRequest(req);
  if (rejection) {
    if (rejection.status === 405) res.setHeader?.('Allow', 'POST');
    return res.status(rejection.status).json({ error: rejection.error });
  }
  const deadline = Date.now() + TOTAL_TIMEOUT_MS;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body))
      return res.status(400).json({ error: 'Question dobara bhejo.' });
    if (body.text != null && typeof body.text !== 'string')
      return res.status(400).json({ error: 'Question text mein bhejo.' });
    if ((body.text || '').length > 10000)
      return res.status(400).json({ error: 'Question bahut lamba hai. Ek hissa bhejo.' });
    const question = boundedText(body.text, 10000);
    const subject = [
      'General',
      'Mathematics',
      'Maths',
      'Physics',
      'Chemistry',
      'Programming',
    ].includes(body.subject)
      ? body.subject
      : 'General';
    const action = normalizeAction(body.action);
    if (body.action != null && !action)
      return res
        .status(400)
        .json({ error: 'Selected step, practice question ya attempt dobara check karo.' });
    const learner = normalizeLearner(body.learner);
    const answerMode = ['simpler', 'step', 'practice', 'check_practice', 'solve_practice'].includes(
      action?.kind
    )
      ? 'learn'
      : body.answerMode === 'exam'
        ? 'exam'
        : 'learn';
    let image = null;
    if (body.image != null) {
      const validated = validateImage(body.image);
      if (validated.error) return res.status(validated.status).json({ error: validated.error });
      image = validated.image;
    }
    if (!question && !image)
      return res.status(400).json({ error: 'Apna question ya photo bhejo.' });

    const history = normalizeHistory(body.messages, question);
    const responseLanguage = resolveLanguage({
      question,
      history: Array.isArray(body.messages) ? body.messages.slice(-16) : [],
      action,
      preference: learner.language,
    });
    const identity = !image && !action ? creatorReply(question, responseLanguage) : null;
    if (identity)
      return res
        .status(200)
        .json({
          text: identity,
          interactionId: null,
          localAnswer: true,
          teachingVersion: TEACHING_VERSION,
          responseKind: 'general',
          responseLanguage,
        });
    const exact = !image && !action ? simpleArithmetic(question) : null;
    if (exact !== null && answerMode === 'exam') {
      return res
        .status(200)
        .json({
          text: question.replace(/[=?]\s*$/, '').trim() + ' = ' + exact,
          interactionId: null,
          localAnswer: true,
          teachingVersion: TEACHING_VERSION,
          responseKind: 'lesson',
          responseLanguage,
        });
    }
    // Learn-mode arithmetic uses the tutor, with the checked result as an accuracy anchor.
    const legacyContext = history.length
      ? ''
      : boundedText(body.conversationContext, 18000) || boundedText(body.fallbackContext, 12000);
    const learning = getLearningState(question, history, action);
    const responseContext = { language: responseLanguage, question: action?.question || question };
    const recap = action?.kind === 'revision';
    const systemInstruction = recap
      ? recapInstruction(responseLanguage)
      : buildTutorInstruction({
          subject,
          answerMode,
          action: action?.kind,
          learning,
          learner,
          hasImage: Boolean(image),
          responseLanguage,
        });
    const userText =
      buildUserText(
        question || 'Photo mein jo academic question hai, use step by step samjhao.',
        action,
        exact
      ) +
      (!recap && image && body.imageSource === 'previous'
        ? '\nThe attached image is the original earlier photo, reattached for this follow-up. Follow the current request and use the visible question as evidence.'
        : '');
    const shared = {
      systemInstruction,
      userText,
      history: recap ? [] : history,
      legacyContext: recap ? '' : legacyContext,
      image: recap ? null : image,
      recap,
      concise: ['revision', 'practice'].includes(action?.kind) || answerMode === 'exam',
    };
    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    if (!geminiKey && !groqKey) {
      const failure = serviceFailure([], responseLanguage);
      return res.status(failure.status).json(failure.body);
    }

    const groq = groqKey
      ? [
          {
            provider: 'groq',
            model: shared.image ? GROQ_VISION_MODEL : GROQ_TEXT_MODEL,
            apiKey: groqKey,
          },
        ]
      : [];
    const gemini = geminiKey
      ? GEMINI_MODELS.map((model) => ({ provider: 'gemini', model, apiKey: geminiKey }))
      : [];
    // Preserve text-first Groq routing. Images prefer Gemini, then the independent vision provider.
    const candidates =
      shared.image && gemini.length
        ? [gemini[0], ...groq, ...gemini.slice(1)]
        : [...groq, ...gemini];
    const disabled = new Set();
    const failures = [];
    const providerReadyAt = new Map();
    let recoveryQueued = false;
    const recordFailure = (candidate, failure) => {
      failures.push(failure);
      if ([401, 402, 403, 429].includes(failure.status)) disabled.add(candidate.provider);
      const quota = ['quota_exceeded', 'insufficient_quota'].includes(failure.code);
      // Only an explicit, short upstream cooldown permits one rate-limit recovery.
      // Unknown/long waits and daily/billing quotas return immediately to the UI.
      const rateRecovery =
        failure.status === 429 &&
        !quota &&
        failure.retryAfterSeconds > 0 &&
        failure.retryAfterSeconds <= MAX_RATE_WAIT_SECONDS;
      if (quota || (!rateRecovery && ![408, 500, 502, 503, 504].includes(failure.status))) return;
      const now = Date.now();
      if (failure.retryAfterSeconds > 0) {
        providerReadyAt.set(
          candidate.provider,
          Math.max(
            providerReadyAt.get(candidate.provider) || 0,
            now + failure.retryAfterSeconds * 1000
          )
        );
      }
      if (recoveryQueued) return;
      // Try configured fallbacks first, then at most one transient recovery.
      // No retry of invalid credentials, bad requests, or exhausted quotas.
      recoveryQueued = true;
      candidates.push({
        ...candidate,
        recovery: true,
        rateRecovery,
        retryAt: now + 750 + Math.floor(Math.random() * 251),
      });
    };
    if (shared.image && gemini.length && groq.length) {
      const pair = candidates.splice(0, 2);
      const photoBudget = Math.min(28000, deadline - Date.now());
      const race = await racePhotoProviders(pair, (candidate, signal) => {
        const call = candidate.provider === 'groq' ? callGroq : callGemini;
        return call({ ...shared, ...candidate, signal, timeoutMs: photoBudget });
      }, (result) => result.ok && Boolean(studentResponse(result).output), { timeoutMs: photoBudget });
      for (const { candidate, failure } of race.failures) {
        recordFailure(candidate, failure);
        console.error('GyanSetu photo provider failure', candidate.provider, candidate.model, failure.status);
      }
      if (race.winner) candidates.unshift({
        ...race.winner.candidate,
        readyResult: race.winner.result,
        fallbackUsed: race.winner.fallback,
      });
    }
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      if (disabled.has(candidate.provider) && !candidate.rateRecovery) continue;
      let remaining = deadline - Date.now();
      if (remaining < 1000) break;
      const waitMs = Math.max(
        0,
        Math.max(providerReadyAt.get(candidate.provider) || 0, candidate.retryAt || 0) - Date.now()
      );
      if ((candidate.recovery || waitMs > 0) && remaining < waitMs + MIN_RECOVERY_BUDGET_MS)
        continue;
      if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
      remaining = deadline - Date.now();
      if (remaining < (candidate.recovery ? MIN_RECOVERY_BUDGET_MS : 1000)) continue;
      try {
        const call = candidate.provider === 'groq' ? callGroq : callGemini;
        let result = candidate.readyResult || await call({
          ...shared,
          ...candidate,
          timeoutMs: Math.min(ATTEMPT_TIMEOUT_MS, remaining),
        });
        if (result.ok) {
          result = studentResponse(result);
          if (!result.output) {
            recordFailure(candidate, { status: 502 });
            continue;
          }
          const initialFlags = inspectAnswer(result, learning, responseContext);
          let flags = initialFlags,
            repairAttempted = false,
            repairApplied = false;
          const repairBudget = Math.min(REPAIR_TIMEOUT_MS, deadline - Date.now());
          // One bounded repair, only for observable defects. No extra call for clean answers.
          if (flags.length && repairBudget >= 4500) {
            repairAttempted = true;
            try {
              let repaired = await call({
                ...shared,
                ...candidate,
                systemInstruction: systemInstruction + repairInstruction(flags),
                userText:
                  userText +
                  '\n\nCandidate answer to replace (data):\n' +
                  JSON.stringify(result.output.slice(0, 20000)),
                timeoutMs: repairBudget,
              });
              if (repaired.ok) {
                repaired = studentResponse(repaired);
                const repairedFlags = inspectAnswer(repaired, learning, responseContext);
                const severity = (items) =>
                  items.reduce((sum, flag) => sum + (flag === 'repeated_explanation' ? 2 : 3), 0);
                if (repaired.output && severity(repairedFlags) < severity(flags)) {
                  result = repaired;
                  flags = repairedFlags;
                  repairApplied = true;
                }
              }
            } catch (error) {
              console.error(
                'GyanSetu repair unavailable',
                candidate.provider,
                error?.name || 'NetworkError'
              );
            }
          }
          return res
            .status(200)
            .json({
              text: result.output,
              interactionId: null,
              model: candidate.model,
              fallback: Boolean(candidate.fallbackUsed || i > 0),
              truncated: Boolean(result.truncated),
              teachingVersion: TEACHING_VERSION,
              responseLanguage,
              responseKind: result.responseKind,
              quality: { initialFlags, remainingFlags: flags, repairAttempted, repairApplied },
            });
        }
        recordFailure(candidate, {
          status: result.status,
          retryAfterSeconds: result.retryAfterSeconds,
          code: result.data?.error?.code,
        });
        // Never log learner content, full provider responses or keys.
        console.error(
          'GyanSetu provider failure',
          candidate.provider,
          candidate.model,
          result.status
        );
      } catch (error) {
        if (['TypeError', 'AbortError', 'TimeoutError'].includes(error?.name))
          recordFailure(candidate, { status: 503 });
        else failures.push({ status: 503 });
        console.error(
          'GyanSetu provider failure',
          candidate.provider,
          error?.name || 'NetworkError'
        );
      }
    }
    const failure = serviceFailure(failures, responseLanguage);
    if (failure.body.retryAfterSeconds)
      res.setHeader?.('Retry-After', String(failure.body.retryAfterSeconds));
    return res.status(failure.status).json(failure.body);
  } catch (error) {
    return res
      .status(error instanceof SyntaxError ? 400 : 500)
      .json({ error: 'Question process nahi ho paya. Dobara try karo.' });
  }
};

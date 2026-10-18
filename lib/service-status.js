'use strict';

function retryAfterSeconds(response, data, now = Date.now()) {
  const header = response.headers?.get?.('retry-after');
  let seconds = null;
  if (header && /^\d+(\.\d+)?$/.test(header.trim())) seconds = Number(header);
  else if (header) seconds = (Date.parse(header) - now) / 1000;
  if (!Number.isFinite(seconds) || seconds <= 0) {
    const detail = data?.error?.details?.find?.(
      (item) => item?.['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
    );
    const duration = detail?.retryDelay;
    seconds =
      typeof duration === 'string' && /^\d+(\.\d+)?s$/.test(duration)
        ? Number(duration.slice(0, -1))
        : null;
  }
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(86400, Math.ceil(seconds)) : null;
}

function serviceFailure(failures, language) {
  const isQuota = (item) => item.code === 'quota_exceeded' || item.code === 'insufficient_quota';
  const quota = failures.length > 0 && failures.every(isQuota);
  const hasQuota = failures.some(isQuota);
  const limited = failures.filter((item) => item.status === 429);
  const code = quota ? 'quota_exhausted' : limited.length ? 'rate_limited' : 'service_unavailable';
  // A delay from one provider is not a promise about another. Retry follows
  // a known wait; an unknown/daily quota gets no invented countdown.
  const timed = limited.length
    ? limited
    : failures.filter((item) => [408, 500, 502, 503, 504].includes(item.status));
  const waits = timed.map((item) => item.retryAfterSeconds).filter((value) => value > 0);
  const retryAfter =
    !hasQuota && waits.length === timed.length && waits.length ? Math.max(...waits) : null;
  const texts = {
    en: {
      quota_exhausted:
        'The answer service has reached its usage limit. Your question is saved. Service capacity needs to be restored before retrying.',
      rate_limited: 'The answer service is temporarily limited. Your question is saved.',
      service_unavailable: 'Could not complete this reply. Your question is saved; you can retry.',
    },
    hi: {
      quota_exhausted:
        'उत्तर सेवा की उपयोग सीमा पूरी हो गई है। आपका सवाल सुरक्षित है। सीमा उपलब्ध होने पर फिर कोशिश करें।',
      rate_limited: 'उत्तर सेवा पर अभी अस्थायी सीमा है। आपका सवाल सुरक्षित है।',
      service_unavailable:
        'यह जवाब पूरा नहीं हो पाया। आपका सवाल सुरक्षित है; फिर कोशिश कर सकते हैं।',
    },
    hinglish: {
      quota_exhausted:
        'Answer service ki usage limit poori ho gayi hai. Tumhara sawaal saved hai. Limit available hone par dobara try karo.',
      rate_limited: 'Answer service par abhi temporary limit hai. Tumhara sawaal saved hai.',
      service_unavailable:
        'Yeh jawab poora nahi ho paaya. Tumhara sawaal saved hai; dobara try kar sakte ho.',
    },
  };
  return {
    status: limited.length || quota ? 429 : 503,
    body: {
      error: (texts[language] || texts.en)[code],
      code,
      ...(retryAfter ? { retryAfterSeconds: retryAfter } : {}),
    },
  };
}

module.exports = { retryAfterSeconds, serviceFailure };

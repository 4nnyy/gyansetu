'use strict';

// Give the independent vision provider time to answer when the preferred one stalls.
// A fast primary costs one call; a slow primary gets one delayed backup, never a fan-out.
function racePhotoProviders(candidates, invoke, usable, { delayMs = 5000, timeoutMs = 28000 } = {}) {
  return new Promise((resolve) => {
    const controllers = candidates.map(() => new AbortController());
    const started = new Set(), completed = new Set(), failures = [];
    let settled = false, backupTimer;
    const finish = (winner = null) => {
      if (settled) return;
      settled = true;
      clearTimeout(backupTimer);
      clearTimeout(deadlineTimer);
      controllers.forEach((controller) => controller.abort());
      resolve({ winner, failures });
    };
    const deadlineTimer = setTimeout(() => {
      for (const index of started) {
        if (!completed.has(index)) failures.push({ candidate: candidates[index], failure: { status: 503 } });
      }
      finish();
    }, timeoutMs);
    const start = (index) => {
      if (settled || started.has(index) || !candidates[index]) return;
      started.add(index);
      const candidate = candidates[index];
      Promise.resolve().then(() => invoke(candidate, controllers[index].signal)).then((result) => {
        if (settled) return;
        completed.add(index);
        if (usable(result)) return finish({ candidate, result, fallback: index > 0 });
        failures.push({ candidate, failure: {
          status: result.ok ? 502 : result.status,
          retryAfterSeconds: result.retryAfterSeconds,
          code: result.data?.error?.code,
        } });
        start(1);
        if (completed.size === candidates.length) finish();
      }).catch(() => {
        if (settled) return;
        completed.add(index);
        failures.push({ candidate, failure: { status: 503 } });
        start(1);
        if (completed.size === candidates.length) finish();
      });
    };
    backupTimer = setTimeout(() => start(1), delayMs);
    start(0);
  });
}

module.exports = { racePhotoProviders };

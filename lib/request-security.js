'use strict';

// Browser-origin checks reduce cross-site abuse; they are not user authentication.
const MAX_REQUEST_BYTES = 4 * 1024 * 1024;
function validateRequest(req) {
  const headers = req.headers || {};
  const header = name => {
    const value = headers[name] ?? Object.entries(headers).find(([key]) => key.toLowerCase() === name)?.[1];
    return typeof value === 'string' ? value : '';
  };
  if (req.method !== 'POST') return { status: 405, error: 'Method not allowed' };
  if (!/^application\/json(?:\s*;[^\r\n]*)?$/i.test(header('content-type').trim())) {
    return { status: 415, error: 'Send the question as JSON.' };
  }
  const site = header('sec-fetch-site'), origin = header('origin');
  if (site === 'cross-site' || (site === 'same-site' && !origin)) return { status: 403, error: 'Request origin is not allowed.' };
  if (origin) {
    try {
      const parsed = new URL(origin);
      if (!['https:', 'http:'].includes(parsed.protocol) || parsed.origin !== origin || parsed.host !== header('host').toLowerCase()) throw new Error('Origin mismatch');
    } catch (_) { return { status: 403, error: 'Request origin is not allowed.' }; }
  }
  const contentLength = header('content-length');
  if (contentLength && !/^\d+$/.test(contentLength)) return { status: 400, error: 'Invalid request size.' };
  if (contentLength && Number(contentLength) > MAX_REQUEST_BYTES) return { status: 413, error: 'Photo or conversation is too large. Send a smaller part.' };
  let serialized;
  try { serialized = typeof req.body === 'string' ? req.body : JSON.stringify(req.body); }
  catch (_) { return { status: 400, error: 'Invalid question data.' }; }
  if (serialized && Buffer.byteLength(serialized, 'utf8') > MAX_REQUEST_BYTES) return { status: 413, error: 'Photo or conversation is too large. Send a smaller part.' };
  return null;
}
module.exports = { validateRequest, MAX_REQUEST_BYTES };

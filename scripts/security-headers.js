'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto');
const root = path.join(__dirname, '..');
function securityHeaders(html) {
  const hashes = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
    .filter((match) => match[1].trim())
    .map(
      (match) => "'sha256-" + crypto.createHash('sha256').update(match[1]).digest('base64') + "'"
    );
  const math = 'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/';
  return [
    {
      key: 'Content-Security-Policy',
      value: [
        "default-src 'self'",
        "script-src 'self' " + hashes.join(' ') + ' ' + math,
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' " + math,
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ].join('; '),
    },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'no-referrer' },
    { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=()' },
  ];
}
if (require.main === module) {
  const file = path.join(root, 'vercel.json'),
    config = JSON.parse(fs.readFileSync(file, 'utf8'));
  const headers = securityHeaders(fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
  if (process.argv.includes('--check')) {
    const actual = config.headers?.find((rule) => rule.source === '/(.*)')?.headers;
    if (JSON.stringify(actual) !== JSON.stringify(headers)) {
      console.error(
        'Security headers are stale. Run npm run security:headers after editing inline scripts.'
      );
      process.exitCode = 1;
    } else console.log('Security headers match the source.');
  } else {
    config.headers = [{ source: '/(.*)', headers }];
    fs.writeFileSync(file, JSON.stringify(config, null, 2) + '\n');
    console.log('Updated security headers in vercel.json.');
  }
}
module.exports = { securityHeaders };

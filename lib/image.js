'use strict';

function validateImage(value) {
  const fail = (error, status = 400) => ({ error, status });
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return fail('Photo dobara attach karo.');
  const { base64, mediaType } = value;
  if (
    typeof base64 !== 'string' ||
    !base64 ||
    !['image/jpeg', 'image/png', 'image/webp'].includes(mediaType)
  )
    return fail('Photo JPG, PNG ya WebP format mein bhejo.');
  if (base64.length > 4 * 1024 * 1024) return fail('Photo 3 MB se chhoti rakho.', 413);
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length % 4 !== 0)
    return fail('Photo data adhura hai. Dobara attach karo.');
  const bytes = Buffer.from(base64, 'base64');
  // Check actual file signatures, not just a client-supplied MIME label.
  const actual =
    bytes.length >= 24 &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      ? 'image/png'
      : bytes.length >= 12 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        ? 'image/jpeg'
        : bytes.length >= 20 &&
            bytes.toString('ascii', 0, 4) === 'RIFF' &&
            bytes.toString('ascii', 8, 12) === 'WEBP'
          ? 'image/webp'
          : null;
  if (actual !== mediaType)
    return fail('Photo ka format ya data sahi nahi hai. Original photo dobara attach karo.');
  return { image: { base64, mediaType } };
}
module.exports = { validateImage };

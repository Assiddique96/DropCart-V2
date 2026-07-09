const ORDER_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateOrderReferenceCode(seed = '') {
  const normalizedSeed = String(seed ?? '').trim();
  let hash = 0;
  for (let index = 0; index < normalizedSeed.length; index += 1) {
    hash = (hash * 31 + normalizedSeed.charCodeAt(index)) >>> 0;
  }

  let code = '';
  for (let index = 0; index < 6; index += 1) {
    const position = hash % ORDER_CODE_ALPHABET.length;
    code += ORDER_CODE_ALPHABET[position];
    hash = Math.floor(hash / ORDER_CODE_ALPHABET.length);
  }

  return `SHP-ORD-${code}`;
}

export function formatOrderReference(orderId, fallback = 'N/A') {
  if (!orderId) return fallback;
  return generateOrderReferenceCode(orderId);
}

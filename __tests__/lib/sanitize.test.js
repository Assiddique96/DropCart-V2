/**
 * __tests__/lib/sanitize.test.js
 * Tests for all sanitization utilities — no mocking needed, pure functions.
 */

const {
  sanitizeString,
  sanitizeNumber,
  sanitizeEmail,
  sanitizePhone,
  sanitizeSlug,
  sanitizeProductInput,
  sanitizeStoreInput,
} = require('../../lib/sanitize');

// ─── sanitizeString ────────────────────────────────────────────────────────
describe('sanitizeString', () => {
  test('trims whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  test('strips HTML tags', () => {
    expect(sanitizeString('<script>alert("xss")</script>text')).toBe('text');
  });

  test('respects maxLength', () => {
    expect(sanitizeString('abcdef', 3)).toBe('abc');
  });

  test('returns empty string for non-string input', () => {
    expect(sanitizeString(null)).toBe('');
    expect(sanitizeString(undefined)).toBe('');
    expect(sanitizeString(123)).toBe('');
  });

  test('preserves normal text', () => {
    expect(sanitizeString('Hello, World!')).toBe('Hello, World!');
  });
});

// ─── sanitizeNumber ────────────────────────────────────────────────────────
describe('sanitizeNumber', () => {
  test('parses string integers', () => {
    expect(sanitizeNumber('42')).toBe(42);
  });

  test('parses floats', () => {
    expect(sanitizeNumber('3.14')).toBe(3.14);
  });

  test('returns NaN for invalid input', () => {
    expect(sanitizeNumber('abc')).toBeNaN();
    expect(sanitizeNumber(null)).toBeNaN();
  });

  test('handles numeric input directly', () => {
    expect(sanitizeNumber(100)).toBe(100);
  });
});

// ─── sanitizeEmail ─────────────────────────────────────────────────────────
describe('sanitizeEmail', () => {
  test('accepts valid email', () => {
    expect(sanitizeEmail('user@example.com')).toBe('user@example.com');
  });

  test('rejects invalid email', () => {
    expect(sanitizeEmail('not-an-email')).toBeNull();
    expect(sanitizeEmail('')).toBeNull();
    expect(sanitizeEmail('missing@domain')).toBeNull();
  });

  test('strips HTML before validating', () => {
    expect(sanitizeEmail('<b>user</b>@example.com')).toBeNull();
  });
});

// ─── sanitizePhone ─────────────────────────────────────────────────────────
describe('sanitizePhone', () => {
  test('allows digits, spaces, +, -, ()', () => {
    expect(sanitizePhone('+234 800 000 0000')).toBe('+234 800 000 0000');
  });

  test('strips invalid characters', () => {
    expect(sanitizePhone('08012<script>abc')).toBe('08012');
  });

  test('truncates to 20 chars', () => {
    expect(sanitizePhone('1'.repeat(30)).length).toBeLessThanOrEqual(20);
  });
});

// ─── sanitizeSlug ──────────────────────────────────────────────────────────
describe('sanitizeSlug', () => {
  test('lowercases input', () => {
    expect(sanitizeSlug('MyStore')).toBe('mystore');
  });

  test('removes special characters', () => {
    expect(sanitizeSlug('my store!')).toBe('mystore');
  });

  test('keeps hyphens', () => {
    expect(sanitizeSlug('my-store')).toBe('my-store');
  });

  test('truncates to 50 chars', () => {
    expect(sanitizeSlug('a'.repeat(60)).length).toBeLessThanOrEqual(50);
  });
});

// ─── sanitizeProductInput ──────────────────────────────────────────────────
describe('sanitizeProductInput', () => {
  const valid = {
    name: 'Test Product',
    description: 'A great product',
    mrp: '5000',
    price: '3500',
    category: 'Electronics',
    origin: 'LOCAL',
  };

  test('returns no errors for valid input', () => {
    const { errors } = sanitizeProductInput(valid);
    expect(errors).toHaveLength(0);
  });

  test('returns error if name is empty', () => {
    const { errors } = sanitizeProductInput({ ...valid, name: '' });
    expect(errors.some(e => e.includes('name'))).toBe(true);
  });

  test('returns error if mrp is zero', () => {
    const { errors } = sanitizeProductInput({ ...valid, mrp: '0' });
    expect(errors.some(e => e.includes('MRP'))).toBe(true);
  });

  test('returns error if price > mrp', () => {
    const { errors } = sanitizeProductInput({ ...valid, price: '9999', mrp: '1000' });
    expect(errors.some(e => e.includes('Price cannot'))).toBe(true);
  });

  test('strips HTML from name', () => {
    const { data } = sanitizeProductInput({ ...valid, name: '<b>Product</b>' });
    expect(data.name).toBe('Product');
  });

  test('parses comma-separated tags', () => {
    const { data } = sanitizeProductInput({ ...valid, tags: 'electronics, gadgets, new' });
    expect(data.tags).toEqual(['electronics', 'gadgets', 'new']);
  });

  test('caps tags at 10', () => {
    const tags = Array.from({ length: 15 }, (_, i) => `tag${i}`).join(',');
    const { data } = sanitizeProductInput({ ...valid, tags });
    expect(data.tags.length).toBeLessThanOrEqual(10);
  });

  test('defaults origin to LOCAL for unknown value', () => {
    const { data } = sanitizeProductInput({ ...valid, origin: 'UNKNOWN' });
    expect(data.origin).toBe('LOCAL');
  });

  test('accepts ABROAD origin', () => {
    const { data } = sanitizeProductInput({ ...valid, origin: 'ABROAD' });
    expect(data.origin).toBe('ABROAD');
  });

  test('returns null scheduledAt for invalid date', () => {
    const { data } = sanitizeProductInput({ ...valid, scheduledAt: 'not-a-date' });
    expect(data.scheduledAt).toBeNull();
  });

  test('returns Date object for valid scheduledAt', () => {
    const { data } = sanitizeProductInput({ ...valid, scheduledAt: '2030-01-01T00:00:00' });
    expect(data.scheduledAt).toBeInstanceOf(Date);
  });
});

// ─── sanitizeStoreInput ────────────────────────────────────────────────────
describe('sanitizeStoreInput', () => {
  const validStore = {
    name: 'My Store',
    username: 'mystore',
    description: 'A great store',
    email: 'store@example.com',
    contact: '+234 800 000 0000',
    address: '123 Main St, Lagos',
  };

  test('accepts valid store input', () => {
    const { errors } = sanitizeStoreInput(validStore);
    expect(errors).toHaveLength(0);
  });

  test('rejects invalid email', () => {
    const { errors } = sanitizeStoreInput({ ...validStore, email: 'bad-email' });
    expect(errors.length).toBeGreaterThan(0);
  });

  test('normalizes username to lowercase and removes special chars', () => {
    const { data } = sanitizeStoreInput({ ...validStore, username: 'My Store!' });
    expect(data.username).toBe('mystore');
  });

  test('returns error for empty name', () => {
    const { errors } = sanitizeStoreInput({ ...validStore, name: '' });
    expect(errors.some(e => e.includes('name'))).toBe(true);
  });
});

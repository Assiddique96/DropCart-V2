/**
 * __tests__/lib/currency.test.js
 * Tests for currency conversion and formatting utilities.
 */

// Mock env vars before importing
process.env.NEXT_PUBLIC_CURRENCY_SYMBOL = '₦';
process.env.NEXT_PUBLIC_CURRENCY_CODE = 'NGN';
process.env.NEXT_PUBLIC_CURRENCY_SUBUNIT = '100';

const { toSubunit, fromSubunit, formatCurrency, CURRENCY_CODE, CURRENCY_SYMBOL, CURRENCY_SUBUNIT } = require('../../lib/currency');

describe('currency constants', () => {
  test('CURRENCY_SYMBOL is ₦', () => {
    expect(CURRENCY_SYMBOL).toBe('₦');
  });

  test('CURRENCY_CODE is NGN', () => {
    expect(CURRENCY_CODE).toBe('NGN');
  });

  test('CURRENCY_SUBUNIT is 100', () => {
    expect(CURRENCY_SUBUNIT).toBe(100);
  });
});

describe('toSubunit', () => {
  test('converts 1500 NGN to 150000 kobo', () => {
    expect(toSubunit(1500)).toBe(150000);
  });

  test('converts 0.50 to 50 (cents)', () => {
    expect(toSubunit(0.50)).toBe(50);
  });

  test('rounds correctly for floating point edge cases', () => {
    expect(toSubunit(29.99)).toBe(2999);
  });

  test('handles zero', () => {
    expect(toSubunit(0)).toBe(0);
  });
});

describe('fromSubunit', () => {
  test('converts 150000 kobo to 1500 NGN', () => {
    expect(fromSubunit(150000)).toBe(1500);
  });

  test('converts 0 to 0', () => {
    expect(fromSubunit(0)).toBe(0);
  });

  test('round-trips correctly with toSubunit', () => {
    const original = 2499;
    expect(fromSubunit(toSubunit(original))).toBe(original);
  });
});

describe('formatCurrency', () => {
  test('formats with symbol prefix', () => {
    const result = formatCurrency(1500);
    expect(result).toContain('₦');
    expect(result).toContain('1,500');
  });

  test('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('₦0.00');
  });

  test('includes 2 decimal places', () => {
    expect(formatCurrency(100)).toContain('.00');
  });
});

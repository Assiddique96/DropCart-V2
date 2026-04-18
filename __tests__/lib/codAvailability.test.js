const { cartBlocksCod } = require('../../lib/codAvailability');

describe('cartBlocksCod', () => {
  const p = (id, origin, acceptCod) => ({ id, origin, acceptCod });

  test('false for empty cart', () => {
    expect(cartBlocksCod([], [])).toBe(false);
  });

  test('true when any product is ABROAD', () => {
    expect(cartBlocksCod([p('1', 'ABROAD', true)], [{ id: '1' }])).toBe(true);
  });

  test('true when LOCAL product has acceptCod false', () => {
    expect(cartBlocksCod([p('1', 'LOCAL', false)], [{ id: '1' }])).toBe(true);
  });

  test('false for LOCAL with acceptCod true', () => {
    expect(cartBlocksCod([p('1', 'LOCAL', true)], [{ id: '1' }])).toBe(false);
  });

  test('false for LOCAL when acceptCod undefined (legacy)', () => {
    expect(cartBlocksCod([{ id: '1', origin: 'LOCAL' }], [{ id: '1' }])).toBe(false);
  });
});

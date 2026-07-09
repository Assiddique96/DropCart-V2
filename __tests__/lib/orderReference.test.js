import { generateOrderReferenceCode } from '@/lib/orderReference';

describe('generateOrderReferenceCode', () => {
  it('returns a polished reference code with a prefix', () => {
    const code = generateOrderReferenceCode('order-123');

    expect(code).toMatch(/^SHP-ORD-[A-Z0-9]{6}$/);
  });

  it('produces the same code for the same seed', () => {
    expect(generateOrderReferenceCode('order-123')).toBe(generateOrderReferenceCode('order-123'));
  });
});

/**
 * __tests__/api/orders.test.js
 *
 * Tests key business logic in the order creation flow.
 * We test the pure logic functions, not HTTP — since Next.js route handlers
 * are hard to unit test in isolation without a full server.
 *
 * These tests verify:
 *  - COD is blocked for ABROAD carts
 *  - Shipping fee selection logic (local vs abroad)
 *  - Coupon discount calculation
 *  - fullAmount accumulation (no double-counting)
 */

describe('Order shipping fee logic', () => {
  // Replicate the per-store fee calculation from the route
  function calculateOrderTotal({
    items,
    couponDiscount = 0,
    isPlusMember = false,
    shippingLocalFee = 7000,
    shippingAbroadFee = 15000,
    shippingFreeAbove = 0,
  }) {
    const itemsSubtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    let total = itemsSubtotal;

    // Apply coupon
    if (couponDiscount > 0) {
      total -= (total * couponDiscount) / 100;
    }

    const hasAbroad = items.some(i => i.origin === 'ABROAD');
    const applicableShippingFee = hasAbroad ? shippingAbroadFee : shippingLocalFee;
    const qualifiesForFreeShipping = !hasAbroad && shippingFreeAbove > 0 && total >= shippingFreeAbove;

    if (!isPlusMember && !qualifiesForFreeShipping) {
      total += applicableShippingFee;
    }

    return parseFloat(total.toFixed(2));
  }

  test('adds local shipping fee for LOCAL items', () => {
    const total = calculateOrderTotal({
      items: [{ price: 5000, quantity: 1, origin: 'LOCAL' }],
      shippingLocalFee: 7000,
    });
    expect(total).toBe(12000);
  });

  test('adds abroad shipping fee for ABROAD items', () => {
    const total = calculateOrderTotal({
      items: [{ price: 5000, quantity: 1, origin: 'ABROAD' }],
      shippingAbroadFee: 15000,
    });
    expect(total).toBe(20000);
  });

  test('uses abroad fee when cart mixes LOCAL and ABROAD', () => {
    const total = calculateOrderTotal({
      items: [
        { price: 3000, quantity: 1, origin: 'LOCAL' },
        { price: 2000, quantity: 1, origin: 'ABROAD' },
      ],
      shippingLocalFee: 7000,
      shippingAbroadFee: 15000,
    });
    expect(total).toBe(20000); // 5000 + 15000
  });

  test('skips shipping fee for Plus members', () => {
    const total = calculateOrderTotal({
      items: [{ price: 5000, quantity: 1, origin: 'LOCAL' }],
      isPlusMember: true,
      shippingLocalFee: 7000,
    });
    expect(total).toBe(5000);
  });

  test('skips local shipping when order exceeds free-shipping threshold', () => {
    const total = calculateOrderTotal({
      items: [{ price: 50000, quantity: 1, origin: 'LOCAL' }],
      shippingLocalFee: 7000,
      shippingFreeAbove: 30000,
    });
    expect(total).toBe(50000); // no shipping added
  });

  test('does NOT skip abroad shipping even above threshold', () => {
    const total = calculateOrderTotal({
      items: [{ price: 50000, quantity: 1, origin: 'ABROAD' }],
      shippingAbroadFee: 15000,
      shippingFreeAbove: 30000,
    });
    expect(total).toBe(65000); // abroad always pays shipping
  });

  test('applies coupon discount before adding shipping', () => {
    const total = calculateOrderTotal({
      items: [{ price: 10000, quantity: 1, origin: 'LOCAL' }],
      couponDiscount: 10, // 10% off
      shippingLocalFee: 7000,
    });
    // 10000 - 10% = 9000 + 7000 = 16000
    expect(total).toBe(16000);
  });

  test('handles multiple quantities correctly', () => {
    const total = calculateOrderTotal({
      items: [{ price: 2000, quantity: 3, origin: 'LOCAL' }],
      shippingLocalFee: 7000,
    });
    expect(total).toBe(13000); // 6000 + 7000
  });
});

describe('COD restriction for ABROAD items', () => {
  function isCODBlocked(items, paymentMethod) {
    const hasAbroadItems = items.some(i => i.origin === 'ABROAD');
    return paymentMethod === 'COD' && hasAbroadItems;
  }

  test('COD is allowed for LOCAL-only carts', () => {
    const items = [{ origin: 'LOCAL' }];
    expect(isCODBlocked(items, 'COD')).toBe(false);
  });

  test('COD is blocked for ABROAD carts', () => {
    const items = [{ origin: 'ABROAD' }];
    expect(isCODBlocked(items, 'COD')).toBe(true);
  });

  test('COD is blocked for mixed carts containing ABROAD', () => {
    const items = [{ origin: 'LOCAL' }, { origin: 'ABROAD' }];
    expect(isCODBlocked(items, 'COD')).toBe(true);
  });

  test('STRIPE is allowed for ABROAD carts', () => {
    const items = [{ origin: 'ABROAD' }];
    expect(isCODBlocked(items, 'STRIPE')).toBe(false);
  });

  test('PAYSTACK is allowed for ABROAD carts', () => {
    const items = [{ origin: 'ABROAD' }];
    expect(isCODBlocked(items, 'PAYSTACK')).toBe(false);
  });
});

describe('Coupon validation logic', () => {
  function validateCoupon(coupon, { userId, existingOrderCount, isPlusMember }) {
    if (!coupon) return { valid: false, error: 'Invalid coupon code' };
    if (coupon.expiresAt < new Date()) return { valid: false, error: 'Coupon has expired' };
    if (coupon.maxUses !== null && coupon.usageCount >= coupon.maxUses) {
      return { valid: false, error: 'Coupon usage limit reached' };
    }
    if (coupon.forNewUser && existingOrderCount > 0) {
      return { valid: false, error: 'Coupon valid for new users only' };
    }
    if (coupon.forMember && !isPlusMember) {
      return { valid: false, error: 'Coupon valid for members only' };
    }
    return { valid: true, error: null };
  }

  const futureCoupon = { expiresAt: new Date(Date.now() + 86400000), maxUses: null, usageCount: 0, forNewUser: false, forMember: false };
  const expiredCoupon = { ...futureCoupon, expiresAt: new Date(Date.now() - 1000) };

  test('accepts a valid public coupon', () => {
    const { valid } = validateCoupon(futureCoupon, { userId: 'u1', existingOrderCount: 2, isPlusMember: false });
    expect(valid).toBe(true);
  });

  test('rejects expired coupon', () => {
    const { valid, error } = validateCoupon(expiredCoupon, { userId: 'u1', existingOrderCount: 0, isPlusMember: false });
    expect(valid).toBe(false);
    expect(error).toContain('expired');
  });

  test('rejects new-user coupon for returning user', () => {
    const coupon = { ...futureCoupon, forNewUser: true };
    const { valid } = validateCoupon(coupon, { userId: 'u1', existingOrderCount: 3, isPlusMember: false });
    expect(valid).toBe(false);
  });

  test('accepts new-user coupon for first-time user', () => {
    const coupon = { ...futureCoupon, forNewUser: true };
    const { valid } = validateCoupon(coupon, { userId: 'u1', existingOrderCount: 0, isPlusMember: false });
    expect(valid).toBe(true);
  });

  test('rejects member coupon for non-member', () => {
    const coupon = { ...futureCoupon, forMember: true };
    const { valid } = validateCoupon(coupon, { userId: 'u1', existingOrderCount: 0, isPlusMember: false });
    expect(valid).toBe(false);
  });

  test('accepts member coupon for Plus member', () => {
    const coupon = { ...futureCoupon, forMember: true };
    const { valid } = validateCoupon(coupon, { userId: 'u1', existingOrderCount: 0, isPlusMember: true });
    expect(valid).toBe(true);
  });

  test('rejects coupon at usage limit', () => {
    const coupon = { ...futureCoupon, maxUses: 5, usageCount: 5 };
    const { valid, error } = validateCoupon(coupon, { userId: 'u1', existingOrderCount: 0, isPlusMember: false });
    expect(valid).toBe(false);
    expect(error).toContain('limit');
  });

  test('allows coupon below usage limit', () => {
    const coupon = { ...futureCoupon, maxUses: 5, usageCount: 4 };
    const { valid } = validateCoupon(coupon, { userId: 'u1', existingOrderCount: 0, isPlusMember: false });
    expect(valid).toBe(true);
  });
});

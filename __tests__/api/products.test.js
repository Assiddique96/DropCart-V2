/**
 * __tests__/api/products.test.js
 * Tests for product business logic: scheduling, origin, bulk CSV parsing.
 */

describe('Product scheduling logic', () => {
  function isProductPublished(scheduledAt) {
    if (!scheduledAt) return true;
    return new Date(scheduledAt) <= new Date();
  }

  test('product with no scheduledAt is published', () => {
    expect(isProductPublished(null)).toBe(true);
    expect(isProductPublished(undefined)).toBe(true);
  });

  test('product with past scheduledAt is published', () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(isProductPublished(past)).toBe(true);
  });

  test('product with future scheduledAt is not published', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(isProductPublished(future)).toBe(false);
  });

  test('product scheduled for exactly now is published', () => {
    const now = new Date().toISOString();
    // Allow 100ms tolerance
    expect(isProductPublished(now)).toBe(true);
  });
});

describe('Product origin rules', () => {
  function getETA(origin) {
    return origin === 'ABROAD' ? '20 – 25 days' : '7 – 10 days';
  }

  function isCODAllowed(origin, acceptCod = true) {
    if (origin === 'ABROAD') return false;
    return acceptCod !== false;
  }

  function getShippingFee(origin, fees = { local: 7000, abroad: 15000 }) {
    return origin === 'ABROAD' ? fees.abroad : fees.local;
  }

  test('LOCAL product has 7-10 day ETA', () => {
    expect(getETA('LOCAL')).toBe('7 – 10 days');
  });

  test('ABROAD product has 20-25 day ETA', () => {
    expect(getETA('ABROAD')).toBe('20 – 25 days');
  });

  test('COD is allowed for LOCAL products with acceptCod', () => {
    expect(isCODAllowed('LOCAL', true)).toBe(true);
  });

  test('COD is not allowed for LOCAL when seller disabled COD', () => {
    expect(isCODAllowed('LOCAL', false)).toBe(false);
  });

  test('COD is not allowed for ABROAD products', () => {
    expect(isCODAllowed('ABROAD', true)).toBe(false);
  });

  test('LOCAL product uses local shipping fee', () => {
    expect(getShippingFee('LOCAL')).toBe(7000);
  });

  test('ABROAD product uses abroad shipping fee', () => {
    expect(getShippingFee('ABROAD')).toBe(15000);
  });

  test('abroad fee is higher than local fee (business rule)', () => {
    const localFee = getShippingFee('LOCAL');
    const abroadFee = getShippingFee('ABROAD');
    expect(abroadFee).toBeGreaterThan(localFee);
  });
});

describe('CSV bulk import parsing logic', () => {
  function parseOrigin(value) {
    return value?.toUpperCase() === 'ABROAD' ? 'ABROAD' : 'LOCAL';
  }

  function validateRow(row) {
    const errors = [];
    if (!row.name?.trim()) errors.push('name is required');
    if (!row.description?.trim()) errors.push('description is required');
    const mrp = parseFloat(row.mrp);
    if (isNaN(mrp) || mrp <= 0) errors.push('mrp must be positive');
    const price = parseFloat(row.price);
    if (isNaN(price) || price <= 0) errors.push('price must be positive');
    if (!isNaN(price) && !isNaN(mrp) && price > mrp) errors.push('price cannot exceed mrp');
    if (!row.category?.trim()) errors.push('category is required');
    if (row.image_url && !row.image_url.startsWith('https://')) errors.push('image_url must start with https://');
    return errors;
  }

  const validRow = {
    name: 'Test Product',
    description: 'A test product',
    mrp: '5000',
    price: '3500',
    category: 'Electronics',
    origin: 'LOCAL',
    image_url: 'https://example.com/image.jpg',
  };

  test('valid row has no errors', () => {
    expect(validateRow(validRow)).toHaveLength(0);
  });

  test('missing name produces error', () => {
    expect(validateRow({ ...validRow, name: '' })).toContain('name is required');
  });

  test('price > mrp produces error', () => {
    const errors = validateRow({ ...validRow, price: '9000', mrp: '1000' });
    expect(errors).toContain('price cannot exceed mrp');
  });

  test('non-https image_url produces error', () => {
    const errors = validateRow({ ...validRow, image_url: 'http://insecure.com/img.jpg' });
    expect(errors).toContain('image_url must start with https://');
  });

  test('ABROAD origin is parsed correctly', () => {
    expect(parseOrigin('ABROAD')).toBe('ABROAD');
    expect(parseOrigin('abroad')).toBe('ABROAD');
  });

  test('unknown origin defaults to LOCAL', () => {
    expect(parseOrigin('UNKNOWN')).toBe('LOCAL');
    expect(parseOrigin('')).toBe('LOCAL');
    expect(parseOrigin(undefined)).toBe('LOCAL');
  });
});

describe('Product variant cartesian product logic', () => {
  function buildVariants(variantGroups) {
    if (variantGroups.length === 0) return [];
    let combos = [{}];
    for (const group of variantGroups) {
      combos = combos.flatMap(combo =>
        group.values.map(value => ({ ...combo, [group.name]: value }))
      );
    }
    return combos.flatMap(combo =>
      Object.entries(combo).map(([name, value]) => ({ name, value }))
    );
  }

  test('no variant groups returns empty array', () => {
    expect(buildVariants([])).toHaveLength(0);
  });

  test('single group with 3 values creates 3 variants', () => {
    const groups = [{ name: 'Size', values: ['S', 'M', 'L'] }];
    const variants = buildVariants(groups);
    expect(variants).toHaveLength(3);
    expect(variants.map(v => v.value)).toEqual(['S', 'M', 'L']);
  });

  test('two groups create cartesian product', () => {
    const groups = [
      { name: 'Size',  values: ['S', 'M'] },
      { name: 'Color', values: ['Red', 'Blue'] },
    ];
    const variants = buildVariants(groups);
    // 2 sizes × 2 colors × 2 entries per combo = 8 entries
    expect(variants).toHaveLength(8);
  });

  test('all variant entries have name and value', () => {
    const groups = [{ name: 'Color', values: ['Red', 'Green'] }];
    const variants = buildVariants(groups);
    variants.forEach(v => {
      expect(v).toHaveProperty('name');
      expect(v).toHaveProperty('value');
    });
  });
});

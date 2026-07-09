const { buildStoreSubdomainUrl } = require('../../lib/subdomain');

describe('buildStoreSubdomainUrl', () => {
  test('builds a store subdomain URL for the root storefront', () => {
    expect(buildStoreSubdomainUrl('adaelectronics')).toBe('https://adaelectronics.shpinx.com/');
  });

  test('preserves a nested path on the store subdomain', () => {
    expect(buildStoreSubdomainUrl('adaelectronics', '/products/123')).toBe('https://adaelectronics.shpinx.com/products/123');
  });

  test('returns the original path when username is missing', () => {
    expect(buildStoreSubdomainUrl('', '/')).toBe('/');
  });
});

/**
 * __tests__/lib/rateLimit.test.js
 * Tests for the in-memory sliding-window rate limiter.
 */

const { rateLimit } = require('../../lib/rateLimit');

// Helper: create a fake Next.js Request with a given IP
function mockRequest(ip = '127.0.0.1') {
  return {
    headers: {
      get: (key) => {
        if (key === 'x-forwarded-for') return ip;
        return null;
      },
    },
  };
}

describe('rateLimit', () => {
  test('allows requests under the limit', () => {
    const limiter = rateLimit({ limit: 5, windowMs: 60_000 });
    const req = mockRequest('1.2.3.4');
    for (let i = 0; i < 5; i++) {
      const result = limiter.check(req);
      expect(result.allowed).toBe(true);
    }
  });

  test('blocks requests over the limit', () => {
    const limiter = rateLimit({ limit: 3, windowMs: 60_000 });
    const req = mockRequest('5.6.7.8');
    limiter.check(req);
    limiter.check(req);
    limiter.check(req);
    const blocked = limiter.check(req);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  test('tracks different IPs independently', () => {
    const limiter = rateLimit({ limit: 2, windowMs: 60_000 });
    const reqA = mockRequest('10.0.0.1');
    const reqB = mockRequest('10.0.0.2');

    limiter.check(reqA);
    limiter.check(reqA);
    const blockedA = limiter.check(reqA);
    expect(blockedA.allowed).toBe(false);

    // Different IP should still be allowed
    const allowedB = limiter.check(reqB);
    expect(allowedB.allowed).toBe(true);
  });

  test('returns remaining count correctly', () => {
    const limiter = rateLimit({ limit: 5, windowMs: 60_000 });
    const req = mockRequest('20.0.0.1');
    const result = limiter.check(req);
    expect(result.remaining).toBe(4);
  });

  test('uses "unknown" key when no IP header is present', () => {
    const limiter = rateLimit({ limit: 2, windowMs: 60_000 });
    const req = { headers: { get: () => null } };
    limiter.check(req);
    limiter.check(req);
    const blocked = limiter.check(req);
    expect(blocked.allowed).toBe(false);
  });
});

import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../website/server/src/utils/dailyRateLimit.js', () => ({
  dailyRateLimiter: null,
}));

vi.mock('../../../website/server/src/utils/logger.js', () => ({
  logWarning: vi.fn(),
}));

describe('rateLimitMiddleware', () => {
  it('bypasses rate limiting for local path directory browsing', async () => {
    const { shouldBypassRateLimit } = await import('../../../website/server/src/middlewares/rateLimit.js');
    expect(shouldBypassRateLimit('GET', '/api/local-path/directories')).toBe(true);
  });

  it('keeps rate limiting enabled for pack requests', async () => {
    const { shouldBypassRateLimit } = await import('../../../website/server/src/middlewares/rateLimit.js');
    expect(shouldBypassRateLimit('POST', '/api/pack')).toBe(false);
  });
});

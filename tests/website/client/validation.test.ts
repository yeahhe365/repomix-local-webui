import { describe, expect, it } from 'vitest';
import { isValidRemoteValue } from '../../../website/client/components/utils/validation.js';

describe('website remote validation', () => {
  it('accepts SSH Git remotes that core validation already supports', () => {
    expect(isValidRemoteValue('git@github.com:user/repo.git')).toBe(true);
  });

  it('accepts HTTPS remotes without pulling in git-url-parse', () => {
    expect(isValidRemoteValue('https://github.com/user/repo')).toBe(true);
  });

  it('rejects local absolute paths', () => {
    expect(isValidRemoteValue('/Users/jones/Documents/Code/repomix-local-webui')).toBe(false);
  });
});

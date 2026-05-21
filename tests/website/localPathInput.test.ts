import { describe, expect, it } from 'vitest';
import { isValidAbsolutePath } from '../../website/client/local-webui/utils/tryIt/localPathInput.js';

describe('localPathInput', () => {
  it('accepts unix-style absolute paths', () => {
    expect(isValidAbsolutePath('/Users/jones/Documents/Code')).toBe(true);
  });

  it('rejects relative paths', () => {
    expect(isValidAbsolutePath('Documents/Code')).toBe(false);
  });
});

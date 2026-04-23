import { describe, expect, test } from 'vitest';
import { isAzureDevOpsUrl, isValidShorthand } from '../../../src/core/git/gitRemoteValidationShared.js';

describe('gitRemoteValidationShared', () => {
  test('accepts valid shorthand repository values', () => {
    expect(isValidShorthand('user/repo')).toBe(true);
    expect(isValidShorthand('user-name/repo_name')).toBe(true);
  });

  test('rejects invalid shorthand repository values', () => {
    expect(isValidShorthand('user')).toBe(false);
    expect(isValidShorthand('/repo')).toBe(false);
  });

  test('detects Azure DevOps hosts without trusting path substrings', () => {
    expect(isAzureDevOpsUrl('git@ssh.dev.azure.com:v3/organization/project/repo')).toBe(true);
    expect(isAzureDevOpsUrl('https://dev.azure.com/organization/project/_git/repo')).toBe(true);
    expect(isAzureDevOpsUrl('https://evil.com/dev.azure.com/fake/repo')).toBe(false);
  });
});

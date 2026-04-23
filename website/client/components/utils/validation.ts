import { isAzureDevOpsUrl, isValidShorthand } from '../../../../src/core/git/gitRemoteValidationShared.js';

const SCP_GIT_REMOTE_REGEX = /^[^@\s]+@[^:\s]+:(?:[^/\s]+\/)+[^\s]+$/;
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'ssh:', 'git:']);

export function isValidRemoteValue(remoteValue: string): boolean {
  const trimmedValue = remoteValue.trim();
  if (!trimmedValue) {
    return false;
  }

  if (isValidShorthand(trimmedValue) || isAzureDevOpsUrl(trimmedValue) || SCP_GIT_REMOTE_REGEX.test(trimmedValue)) {
    return true;
  }

  try {
    const url = new URL(trimmedValue);
    return ALLOWED_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}

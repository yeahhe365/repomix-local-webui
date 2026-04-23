const VALID_NAME_PATTERN = '[a-zA-Z0-9](?:[a-zA-Z0-9._-]*[a-zA-Z0-9])?';
const validShorthandRegex = new RegExp(`^${VALID_NAME_PATTERN}/${VALID_NAME_PATTERN}$`);

export const isValidShorthand = (remoteValue: string): boolean => {
  return validShorthandRegex.test(remoteValue);
};

/**
 * Check if a URL is an Azure DevOps repository URL by validating the hostname.
 * This uses proper URL parsing to avoid security issues with substring matching.
 */
export const isAzureDevOpsUrl = (remoteValue: string): boolean => {
  if (remoteValue.startsWith('git@ssh.dev.azure.com:')) {
    return true;
  }

  try {
    const url = new URL(remoteValue);
    const hostname = url.hostname.toLowerCase();

    if (hostname === 'dev.azure.com' || hostname === 'ssh.dev.azure.com') {
      return true;
    }

    if (hostname.endsWith('.visualstudio.com')) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
};

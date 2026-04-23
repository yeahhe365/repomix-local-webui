import gitUrlParse, { type GitUrl } from 'git-url-parse';
import { isAzureDevOpsUrl, isValidShorthand } from './gitRemoteValidationShared.js';

interface IGitUrl extends GitUrl {
  commit: string | undefined;
}

export { isAzureDevOpsUrl, isValidShorthand } from './gitRemoteValidationShared.js';

export const isValidRemoteValue = (remoteValue: string, refs: string[] = []): boolean => {
  if (isValidShorthand(remoteValue) || isAzureDevOpsUrl(remoteValue)) {
    return true;
  }

  try {
    const parseGitUrl = gitUrlParse as unknown as (value: string, refs?: string[]) => IGitUrl;
    const parsedFields = parseGitUrl(remoteValue, refs);
    const ownerSlashRepo =
      parsedFields.full_name.split('/').length > 1 ? parsedFields.full_name.split('/').slice(-2).join('/') : '';

    return ownerSlashRepo === '' || isValidShorthand(ownerSlashRepo);
  } catch {
    return false;
  }
};

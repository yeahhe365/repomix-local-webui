import { describe, expect, it } from 'vitest';
import { formatRepositoryName } from '../../../website/client/local-webui/utils/tryIt/resultViewer.js';

describe('formatRepositoryName', () => {
  it('strips parent directories from Unix local paths', () => {
    expect(formatRepositoryName('/Users/jones/Desktop/AlbumBrowser')).toBe('AlbumBrowser');
  });

  it('handles trailing slashes on Unix paths', () => {
    expect(formatRepositoryName('/Users/jones/Desktop/AlbumBrowser/')).toBe('AlbumBrowser');
  });

  it('handles Windows backslash paths', () => {
    expect(formatRepositoryName('C:\\Users\\jones\\Code\\AlbumBrowser')).toBe('AlbumBrowser');
  });

  it('extracts owner-repo from full GitHub URLs', () => {
    expect(formatRepositoryName('https://github.com/facebook/react')).toBe('facebook-react');
  });

  it('strips .git suffix from GitHub URLs', () => {
    expect(formatRepositoryName('https://github.com/facebook/react.git')).toBe('facebook-react');
  });

  it('extracts owner-repo from GitHub shorthand', () => {
    expect(formatRepositoryName('facebook/react')).toBe('facebook-react');
  });

  it('keeps ZIP filenames as-is', () => {
    expect(formatRepositoryName('my-project.zip')).toBe('my-project.zip');
  });

  it('does not confuse a local path with an owner/repo shorthand', () => {
    // Paths ending in X/Y are the bug that was fixed — they must not match
    // the GitHub regex.
    expect(formatRepositoryName('/Users/me/Desktop/MyProject')).toBe('MyProject');

    // A valid GitHub shorthand in the same position stays correct.
    expect(formatRepositoryName('facebook/react')).toBe('facebook-react');
  });
});

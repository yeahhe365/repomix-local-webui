import { describe, expect, it } from 'vitest';
import type { StorageLike } from '../../../website/client/local-webui/utils/tryItPersistence.js';
import {
  clearRecentPacks,
  deriveRecentPackLabel,
  loadRecentPacks,
  MAX_RECENT_PACKS,
  upsertRecentPack,
} from '../../../website/client/local-webui/utils/tryItRecentPacks.js';

function createMemoryStorage(): StorageLike {
  const store = new Map<string, string>();
  return {
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
  };
}

describe('tryItRecentPacks', () => {
  it('derives a label from the source depending on mode', () => {
    expect(deriveRecentPackLabel('url', 'https://github.com/owner/repo')).toBe('owner/repo');
    expect(deriveRecentPackLabel('url', 'owner/repo')).toBe('owner/repo');
    expect(deriveRecentPackLabel('localPath', '/Users/jones/Code/MyProject')).toBe('MyProject');
    expect(deriveRecentPackLabel('file', 'archive.zip')).toBe('archive.zip');
    expect(deriveRecentPackLabel('url', '')).toBe('Untitled');
  });

  it('round-trips recent packs and dedupes by mode:source:format', () => {
    const storage = createMemoryStorage();

    const first = upsertRecentPack(
      {
        mode: 'url',
        source: 'owner/repo',
        format: 'plain',
        includePatterns: 'src/**',
        ignorePatterns: '**/*.test.*',
      },
      storage,
      1000,
    );

    expect(first).toHaveLength(1);
    expect(first[0]).toMatchObject({
      mode: 'url',
      source: 'owner/repo',
      label: 'owner/repo',
      format: 'plain',
      includePatterns: 'src/**',
      ignorePatterns: '**/*.test.*',
      createdAt: 1000,
    });
    expect(first[0].id).toBeTruthy();

    // Same mode+source+format updates in place and bumps to top.
    const updated = upsertRecentPack(
      {
        mode: 'url',
        source: 'owner/repo',
        format: 'plain',
        ignorePatterns: 'node_modules/**',
      },
      storage,
      2000,
    );

    expect(updated).toHaveLength(1);
    expect(updated[0]).toMatchObject({
      id: first[0].id,
      mode: 'url',
      source: 'owner/repo',
      format: 'plain',
      includePatterns: '',
      ignorePatterns: 'node_modules/**',
      createdAt: 2000,
    });

    // A different format creates a separate entry.
    const second = upsertRecentPack(
      { mode: 'url', source: 'owner/repo', format: 'xml' },
      storage,
      3000,
    );

    expect(second).toHaveLength(2);
    expect(second[0].format).toBe('xml');
  });

  it('keeps newest first and enforces the max cap', () => {
    const storage = createMemoryStorage();

    for (let index = 0; index < MAX_RECENT_PACKS + 3; index += 1) {
      upsertRecentPack(
        { mode: 'localPath', source: `/Users/jones/Code/project-${index}`, format: 'plain' },
        storage,
        index + 1,
      );
    }

    const packs = loadRecentPacks(storage);
    expect(packs).toHaveLength(MAX_RECENT_PACKS);
    expect(packs[0].source).toBe(`/Users/jones/Code/project-${MAX_RECENT_PACKS + 2}`);
    expect(packs[packs.length - 1].source).toBe('/Users/jones/Code/project-3');
  });

  it('clears all recent packs', () => {
    const storage = createMemoryStorage();

    upsertRecentPack({ mode: 'file', source: 'archive.zip', format: 'plain' }, storage);
    expect(loadRecentPacks(storage)).toHaveLength(1);

    clearRecentPacks(storage);
    expect(loadRecentPacks(storage)).toEqual([]);
  });

  it('ignores invalid stored payload', () => {
    const storage = createMemoryStorage();
    storage.setItem('repomix-tryit-recent-packs-v1', '{not-json');
    expect(loadRecentPacks(storage)).toEqual([]);

    storage.setItem(
      'repomix-tryit-recent-packs-v1',
      JSON.stringify([
        { id: 'ok', mode: 'url', source: 'owner/repo', format: 'plain', label: 'owner/repo' },
        { id: 'bad-mode', mode: 'ftp', source: 'x', format: 'plain' },
        { id: 'no-source', mode: 'url', format: 'plain' },
        null,
      ]),
    );

    const packs = loadRecentPacks(storage);
    expect(packs).toHaveLength(1);
    expect(packs[0]).toMatchObject({
      id: 'ok',
      mode: 'url',
      source: 'owner/repo',
      format: 'plain',
      label: 'owner/repo',
    });
  });
});

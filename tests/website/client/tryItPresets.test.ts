import { describe, expect, it } from 'vitest';
import type { StorageLike } from '../../../website/client/local-webui/utils/tryItPersistence.js';
import {
  clearTryItPresets,
  deleteTryItPreset,
  derivePresetNameFromPath,
  loadTryItPresets,
  MAX_TRY_IT_PRESETS,
  upsertTryItPreset,
} from '../../../website/client/local-webui/utils/tryItPresets.js';

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

describe('tryItPresets', () => {
  it('derives a preset name from the last path segment', () => {
    expect(derivePresetNameFromPath('/Users/jones/Code/MyProject/')).toBe('MyProject');
    expect(derivePresetNameFromPath('C:\\Users\\jones\\Code\\App')).toBe('App');
  });

  it('round-trips presets and upserts by local path', () => {
    const storage = createMemoryStorage();

    const created = upsertTryItPreset(
      {
        name: 'My App',
        localPath: '/Users/jones/Code/MyApp',
        ignorePatterns: '**/*.test.ts,dist/**',
        includePatterns: 'src/**',
      },
      storage,
      1000,
    );

    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      name: 'My App',
      localPath: '/Users/jones/Code/MyApp',
      ignorePatterns: '**/*.test.ts,dist/**',
      includePatterns: 'src/**',
      updatedAt: 1000,
    });
    expect(created[0].id).toBeTruthy();

    const updated = upsertTryItPreset(
      {
        name: 'My App Updated',
        localPath: '/Users/jones/Code/MyApp',
        ignorePatterns: 'node_modules/**',
      },
      storage,
      2000,
    );

    expect(updated).toHaveLength(1);
    expect(updated[0]).toMatchObject({
      id: created[0].id,
      name: 'My App Updated',
      localPath: '/Users/jones/Code/MyApp',
      ignorePatterns: 'node_modules/**',
      includePatterns: '',
      updatedAt: 2000,
    });
  });

  it('keeps newest presets first and enforces max count', () => {
    const storage = createMemoryStorage();

    for (let index = 0; index < MAX_TRY_IT_PRESETS + 3; index += 1) {
      upsertTryItPreset(
        {
          name: `Project ${index}`,
          localPath: `/Users/jones/Code/project-${index}`,
          ignorePatterns: `ignore-${index}`,
        },
        storage,
        index + 1,
      );
    }

    const presets = loadTryItPresets(storage);
    expect(presets).toHaveLength(MAX_TRY_IT_PRESETS);
    expect(presets[0].localPath).toBe(`/Users/jones/Code/project-${MAX_TRY_IT_PRESETS + 2}`);
    expect(presets[presets.length - 1].localPath).toBe('/Users/jones/Code/project-3');
  });

  it('deletes and clears presets', () => {
    const storage = createMemoryStorage();

    const presets = upsertTryItPreset(
      {
        name: 'Keep',
        localPath: '/Users/jones/Code/keep',
      },
      storage,
    );
    upsertTryItPreset(
      {
        name: 'Drop',
        localPath: '/Users/jones/Code/drop',
      },
      storage,
    );

    const afterDelete = deleteTryItPreset(presets[0].id, storage);
    expect(afterDelete).toHaveLength(1);
    expect(afterDelete[0].localPath).toBe('/Users/jones/Code/drop');

    clearTryItPresets(storage);
    expect(loadTryItPresets(storage)).toEqual([]);
  });

  it('ignores invalid stored payload', () => {
    const storage = createMemoryStorage();
    storage.setItem('repomix-tryit-presets-v1', '{not-json');
    expect(loadTryItPresets(storage)).toEqual([]);

    storage.setItem(
      'repomix-tryit-presets-v1',
      JSON.stringify([
        { id: 'ok', localPath: '/tmp/a', name: 'A', ignorePatterns: 'x' },
        { name: 'missing-path' },
        null,
      ]),
    );

    expect(loadTryItPresets(storage)).toEqual([
      {
        id: 'ok',
        localPath: '/tmp/a',
        name: 'A',
        includePatterns: '',
        ignorePatterns: 'x',
        updatedAt: expect.any(Number),
      },
    ]);
  });
});

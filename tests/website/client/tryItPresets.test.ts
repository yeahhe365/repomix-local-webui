import { describe, expect, it } from 'vitest';
import type { StorageLike } from '../../../website/client/local-webui/utils/tryItPersistence.js';
import {
  clearTryItPresets,
  deleteTryItPreset,
  derivePresetNameFromPath,
  derivePresetNameFromSource,
  loadTryItPresets,
  MAX_TRY_IT_PRESETS,
  presetToPageState,
  reorderTryItPresets,
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

describe('tryItPresets v2', () => {
  it('derives a preset name from the last path segment', () => {
    expect(derivePresetNameFromPath('/Users/jones/Code/MyProject/')).toBe('MyProject');
    expect(derivePresetNameFromPath('C:\\Users\\jones\\Code\\App')).toBe('App');
  });

  it('derives a preset name from source with mode awareness', () => {
    expect(derivePresetNameFromSource('/Users/jones/Code/MyProject/', 'localPath')).toBe('MyProject');
    expect(derivePresetNameFromSource('yamadashy/repomix', 'url')).toBe('yamadashy/repomix');
    expect(derivePresetNameFromSource('https://github.com/owner/repo.git', 'url')).toBe('owner/repo');
  });

  it('round-trips presets and upserts by mode+source', () => {
    const storage = createMemoryStorage();

    const created = upsertTryItPreset(
      {
        name: 'My App',
        mode: 'localPath',
        source: '/Users/jones/Code/MyApp',
        format: 'xml',
        ignorePatterns: '**/*.test.ts,dist/**',
        includePatterns: 'src/**',
      },
      storage,
      1000,
    );

    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      name: 'My App',
      mode: 'localPath',
      source: '/Users/jones/Code/MyApp',
      format: 'xml',
      ignorePatterns: '**/*.test.ts,dist/**',
      includePatterns: 'src/**',
      sortOrder: 1,
      updatedAt: 1000,
    });
    expect(created[0].id).toBeTruthy();
    expect(created[0].sortOrder).toBeGreaterThan(0);

    // Upsert updates the same mode+source
    const updated = upsertTryItPreset(
      {
        name: 'My App Updated',
        mode: 'localPath',
        source: '/Users/jones/Code/MyApp',
        format: 'markdown',
        ignorePatterns: 'node_modules/**',
      },
      storage,
      2000,
    );

    expect(updated).toHaveLength(1);
    expect(updated[0]).toMatchObject({
      id: created[0].id,
      name: 'My App Updated',
      mode: 'localPath',
      source: '/Users/jones/Code/MyApp',
      format: 'markdown',
      ignorePatterns: 'node_modules/**',
      includePatterns: '',
      updatedAt: 2000,
      sortOrder: created[0].sortOrder, // preserved on update
    });
  });

  it('preserves separate presets when mode differs even if source is similar', () => {
    const storage = createMemoryStorage();

    upsertTryItPreset(
      { name: 'Local', mode: 'localPath', source: '/Users/jones/Code/App', format: 'plain' },
      storage,
    );
    upsertTryItPreset(
      { name: 'Remote', mode: 'url', source: 'https://github.com/owner/App', format: 'xml' },
      storage,
    );

    const presets = loadTryItPresets(storage);
    expect(presets).toHaveLength(2);
    expect(presets[0].mode).toBe('localPath');
    expect(presets[1].mode).toBe('url');
  });

  it('keeps sorted by sortOrder and enforces max count', () => {
    const storage = createMemoryStorage();

    for (let index = 0; index < MAX_TRY_IT_PRESETS + 3; index += 1) {
      upsertTryItPreset(
        {
          name: `Project ${index}`,
          mode: 'localPath',
          source: `/Users/jones/Code/project-${index}`,
          format: 'plain',
          ignorePatterns: `ignore-${index}`,
        },
        storage,
        index + 1,
      );
    }

    const presets = loadTryItPresets(storage);
    expect(presets).toHaveLength(MAX_TRY_IT_PRESETS);
    // Sorted by sortOrder ascending — newer entries get higher sortOrder
    expect(presets[0].source).toBe(`/Users/jones/Code/project-0`);
    expect(presets[presets.length - 1].source).toBe(
      `/Users/jones/Code/project-${MAX_TRY_IT_PRESETS - 1}`,
    );
  });

  it('deletes and clears presets', () => {
    const storage = createMemoryStorage();

    const presets = upsertTryItPreset(
      { name: 'Keep', mode: 'localPath', source: '/Users/jones/Code/keep', format: 'plain' },
      storage,
    );
    upsertTryItPreset(
      { name: 'Drop', mode: 'localPath', source: '/Users/jones/Code/drop', format: 'plain' },
      storage,
    );

    const afterDelete = deleteTryItPreset(presets[0].id, storage);
    expect(afterDelete).toHaveLength(1);
    expect(afterDelete[0].source).toBe('/Users/jones/Code/drop');

    clearTryItPresets(storage);
    expect(loadTryItPresets(storage)).toEqual([]);
  });

  it('ignores invalid stored payload', () => {
    const storage = createMemoryStorage();
    storage.setItem('repomix-tryit-presets-v2', '{not-json');
    expect(loadTryItPresets(storage)).toEqual([]);

    storage.setItem(
      'repomix-tryit-presets-v2',
      JSON.stringify([
        {
          id: 'ok',
          mode: 'localPath',
          source: '/tmp/a',
          format: 'xml',
          name: 'A',
          sortOrder: 1,
          ignorePatterns: 'x',
        },
        { name: 'missing-mode', source: '/tmp/b', format: 'plain' },
        null,
      ]),
    );

    expect(loadTryItPresets(storage)).toEqual([
      {
        id: 'ok',
        mode: 'localPath',
        source: '/tmp/a',
        format: 'xml',
        name: 'A',
        includePatterns: '',
        ignorePatterns: 'x',
        sortOrder: 1,
        updatedAt: expect.any(Number),
      },
    ]);
  });

  it('reorders presets by id list', () => {
    const storage = createMemoryStorage();

    upsertTryItPreset(
      { name: 'First', mode: 'localPath', source: '/a', format: 'plain' },
      storage,
      100,
    );
    upsertTryItPreset(
      { name: 'Second', mode: 'localPath', source: '/b', format: 'plain' },
      storage,
      200,
    );
    upsertTryItPreset(
      { name: 'Third', mode: 'localPath', source: '/c', format: 'plain' },
      storage,
      300,
    );

    const before = loadTryItPresets(storage);
    expect(before.map((p) => p.name)).toEqual(['First', 'Second', 'Third']);

    // Reverse order
    const after = reorderTryItPresets(
      [before[2].id, before[1].id, before[0].id],
      storage,
    );
    expect(after.map((p) => p.name)).toEqual(['Third', 'Second', 'First']);

    // Confirm persisted
    const reloaded = loadTryItPresets(storage);
    expect(reloaded.map((p) => p.name)).toEqual(['Third', 'Second', 'First']);
  });

  it('presetToPageState extracts the correct fields', () => {
    const preset = {
      id: 'p1',
      name: 'Test',
      mode: 'url' as const,
      source: 'owner/repo',
      format: 'xml' as const,
      includePatterns: 'src/**',
      ignorePatterns: '',
      sortOrder: 1,
      updatedAt: 1000,
    };

    const state = presetToPageState(preset);
    expect(state).toEqual({
      mode: 'url',
      source: 'owner/repo',
      format: 'xml',
      includePatterns: 'src/**',
      ignorePatterns: '',
    });
  });

  describe('v1 → v2 migration', () => {
    it('migrates v1 presets stored under the old key when v2 key is absent', () => {
      const storage = createMemoryStorage();

      // Write v1 data under the old key
      storage.setItem(
        'repomix-tryit-presets-v1',
        JSON.stringify([
          {
            id: 'v1-id',
            name: 'Legacy',
            localPath: '/Users/jones/Code/Legacy',
            includePatterns: '',
            ignorePatterns: 'dist/**',
            updatedAt: 500,
          },
          {
            id: 'v1-id-2',
            name: 'Old Project',
            localPath: '/Users/jones/Code/Old',
            includePatterns: 'src/**',
            ignorePatterns: '',
            updatedAt: 1000,
          },
        ]),
      );

      const presets = loadTryItPresets(storage);

      expect(presets).toHaveLength(2);
      expect(presets[0]).toMatchObject({
        id: 'v1-id',
        name: 'Legacy',
        mode: 'localPath',
        source: '/Users/jones/Code/Legacy',
        format: 'plain',
        ignorePatterns: 'dist/**',
        includePatterns: '',
        sortOrder: 1,
        updatedAt: 500,
      });
      expect(presets[1]).toMatchObject({
        id: 'v1-id-2',
        name: 'Old Project',
        mode: 'localPath',
        source: '/Users/jones/Code/Old',
        format: 'plain',
        includePatterns: 'src/**',
        sortOrder: 2,
        updatedAt: 1000,
      });

      // v2 key should have been created during migration
      const v2Raw = storage.getItem('repomix-tryit-presets-v2');
      expect(v2Raw).toBeTruthy();
      const v2Parsed = JSON.parse(v2Raw!);
      expect(v2Parsed).toHaveLength(2);

      // v1 key should remain untouched
      expect(storage.getItem('repomix-tryit-presets-v1')).toBeTruthy();
    });

    it('prefers v2 data when both keys exist', () => {
      const storage = createMemoryStorage();

      // Write v2 data
      storage.setItem(
        'repomix-tryit-presets-v2',
        JSON.stringify([
          {
            id: 'v2-id',
            name: 'V2 Preset',
            mode: 'url',
            source: 'owner/repo',
            format: 'xml',
            includePatterns: '',
            ignorePatterns: '',
            sortOrder: 1,
            updatedAt: 2000,
          },
        ]),
      );

      // Write conflicting v1 data
      storage.setItem(
        'repomix-tryit-presets-v1',
        JSON.stringify([
          {
            id: 'v1-id',
            name: 'V1 Only',
            localPath: '/Users/jones/Code/V1',
            updatedAt: 500,
          },
        ]),
      );

      const presets = loadTryItPresets(storage);
      expect(presets).toHaveLength(1);
      expect(presets[0].id).toBe('v2-id');
      expect(presets[0].mode).toBe('url');
    });

    it('handles empty v1 key gracefully', () => {
      const storage = createMemoryStorage();

      storage.setItem('repomix-tryit-presets-v1', '');
      expect(loadTryItPresets(storage)).toEqual([]);
    });
  });
});

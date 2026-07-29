import { describe, expect, it } from 'vitest';
import { DEFAULT_PACK_OPTIONS } from '../../../website/client/local-webui/types/pack.js';
import {
  clearLocalPathBrowserState,
  createDefaultLocalPathBrowserState,
  loadLocalPathBrowserState,
  loadTryItPageState,
  resolveInitialTryItPageState,
  type StorageLike,
  saveLocalPathBrowserState,
  saveTryItPageState,
} from '../../../website/client/local-webui/utils/tryItPersistence.js';

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

describe('tryItPersistence', () => {
  it('round-trips persisted page state', () => {
    const storage = createMemoryStorage();

    saveTryItPageState(
      {
        mode: 'localPath',
        remoteUrl: 'yamadashy/repomix',
        localPath: '/Users/jones/Desktop/superpowers',
        packOptions: {
          ...DEFAULT_PACK_OPTIONS,
          format: 'markdown',
          compress: true,
        },
      },
      storage,
    );

    const restored = loadTryItPageState(DEFAULT_PACK_OPTIONS, storage);

    expect(restored).toEqual({
      mode: 'localPath',
      remoteUrl: 'yamadashy/repomix',
      localPath: '/Users/jones/Desktop/superpowers',
      packOptions: {
        ...DEFAULT_PACK_OPTIONS,
        format: 'markdown',
        compress: true,
      },
    });
  });

  it('prefers URL params over persisted local path state while resetting to url mode', () => {
    const resolved = resolveInitialTryItPageState({
      defaultOptions: DEFAULT_PACK_OPTIONS,
      persistedState: {
        mode: 'localPath',
        remoteUrl: 'old/repo',
        localPath: '/Users/jones/Desktop/superpowers',
        packOptions: {
          ...DEFAULT_PACK_OPTIONS,
          format: 'plain',
        },
      },
      urlParams: {
        repo: 'new/repo',
        format: 'xml',
        directoryStructure: false,
      },
    });

    expect(resolved.mode).toBe('url');
    expect(resolved.remoteUrl).toBe('new/repo');
    expect(resolved.localPath).toBe('/Users/jones/Desktop/superpowers');
    expect(resolved.packOptions.format).toBe('xml');
    expect(resolved.packOptions.directoryStructure).toBe(false);
  });

  it('defaults to local-path mode and plain format when no state is persisted', () => {
    const resolved = resolveInitialTryItPageState({
      defaultOptions: DEFAULT_PACK_OPTIONS,
      persistedState: null,
      urlParams: {},
    });

    expect(resolved.mode).toBe('localPath');
    expect(resolved.remoteUrl).toBe('');
    expect(resolved.localPath).toBe('');
    expect(resolved.packOptions.format).toBe('plain');
  });

  it('falls back to local-path mode when persisted mode is missing or invalid', () => {
    const storage = createMemoryStorage();

    saveTryItPageState(
      {
        mode: 'localPath',
        remoteUrl: '',
        localPath: '/Users/jones/Desktop/superpowers',
        packOptions: { ...DEFAULT_PACK_OPTIONS },
      },
      storage,
    );
    // Corrupt the persisted mode; the loader must coerce to the default.
    const raw = JSON.parse(storage.getItem('repomix-tryit-page-state-v1') ?? '');
    raw.mode = 'bogus';
    storage.setItem('repomix-tryit-page-state-v1', JSON.stringify(raw));

    const restored = loadTryItPageState(DEFAULT_PACK_OPTIONS, storage);
    expect(restored?.mode).toBe('localPath');
  });

  it('restores and clears persisted local path browser state', () => {
    const storage = createMemoryStorage();

    saveLocalPathBrowserState(
      {
        currentPath: '/Users/jones/Desktop',
        selectedPath: '/Users/jones/Desktop/superpowers',
        scrollTop: 128,
        recentPaths: ['/Users/jones/Desktop/superpowers'],
      },
      storage,
    );

    expect(loadLocalPathBrowserState(storage)).toEqual({
      currentPath: '/Users/jones/Desktop',
      selectedPath: '/Users/jones/Desktop/superpowers',
      scrollTop: 128,
      recentPaths: ['/Users/jones/Desktop/superpowers'],
    });

    clearLocalPathBrowserState(storage);

    expect(loadLocalPathBrowserState(storage)).toEqual(createDefaultLocalPathBrowserState());
  });
});

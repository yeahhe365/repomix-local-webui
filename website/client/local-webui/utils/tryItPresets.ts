import type { StorageLike } from './tryItPersistence';

export interface TryItPreset {
  id: string;
  name: string;
  localPath: string;
  includePatterns: string;
  ignorePatterns: string;
  updatedAt: number;
}

export interface TryItPresetInput {
  name: string;
  localPath: string;
  includePatterns?: string;
  ignorePatterns?: string;
}

const TRY_IT_PRESETS_KEY = 'repomix-tryit-presets-v1';
export const MAX_TRY_IT_PRESETS = 20;

function getDefaultStorage(storage?: StorageLike): StorageLike | null {
  if (storage) {
    return storage;
  }

  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  return window.localStorage;
}

function createPresetId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `preset-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizePath(path: string): string {
  return path.trim();
}

function normalizeName(name: string, localPath: string): string {
  const trimmed = name.trim();
  if (trimmed) {
    return trimmed;
  }

  return derivePresetNameFromPath(localPath);
}

export function derivePresetNameFromPath(localPath: string): string {
  const trimmed = localPath.trim().replace(/[\\/]+$/, '');
  if (!trimmed) {
    return 'Untitled';
  }

  const segments = trimmed.split(/[\\/]/).filter(Boolean);
  return segments[segments.length - 1] || trimmed;
}

function sanitizePreset(candidate: unknown): TryItPreset | null {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const value = candidate as Partial<TryItPreset>;
  if (typeof value.id !== 'string' || !value.id.trim()) {
    return null;
  }

  if (typeof value.localPath !== 'string' || !value.localPath.trim()) {
    return null;
  }

  const localPath = normalizePath(value.localPath);
  const name =
    typeof value.name === 'string' && value.name.trim()
      ? value.name.trim()
      : derivePresetNameFromPath(localPath);

  return {
    id: value.id.trim(),
    name,
    localPath,
    includePatterns: typeof value.includePatterns === 'string' ? value.includePatterns : '',
    ignorePatterns: typeof value.ignorePatterns === 'string' ? value.ignorePatterns : '',
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : Date.now(),
  };
}

function sortPresets(presets: TryItPreset[]): TryItPreset[] {
  return [...presets].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function loadTryItPresets(storage?: StorageLike): TryItPreset[] {
  const resolvedStorage = getDefaultStorage(storage);
  if (!resolvedStorage) {
    return [];
  }

  try {
    const raw = resolvedStorage.getItem(TRY_IT_PRESETS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    const presets = parsed
      .map((item) => sanitizePreset(item))
      .filter((item): item is TryItPreset => item !== null);

    return sortPresets(presets).slice(0, MAX_TRY_IT_PRESETS);
  } catch {
    return [];
  }
}

export function saveTryItPresets(presets: TryItPreset[], storage?: StorageLike): void {
  const resolvedStorage = getDefaultStorage(storage);
  if (!resolvedStorage) {
    return;
  }

  const sanitized = sortPresets(
    presets
      .map((item) => sanitizePreset(item))
      .filter((item): item is TryItPreset => item !== null),
  ).slice(0, MAX_TRY_IT_PRESETS);

  resolvedStorage.setItem(TRY_IT_PRESETS_KEY, JSON.stringify(sanitized));
}

/**
 * Upsert a preset. Matching priority:
 * 1. same id (when provided)
 * 2. same localPath
 * Otherwise create a new preset.
 */
export function upsertTryItPreset(
  input: TryItPresetInput & { id?: string },
  storage?: StorageLike,
  now = Date.now(),
): TryItPreset[] {
  const localPath = normalizePath(input.localPath);
  if (!localPath) {
    return loadTryItPresets(storage);
  }

  const presets = loadTryItPresets(storage);
  const name = normalizeName(input.name, localPath);
  const includePatterns = input.includePatterns?.trim() ? input.includePatterns.trim() : '';
  const ignorePatterns = input.ignorePatterns?.trim() ? input.ignorePatterns.trim() : '';

  const existingIndex = presets.findIndex((preset) => {
    if (input.id && preset.id === input.id) {
      return true;
    }
    return preset.localPath === localPath;
  });

  if (existingIndex >= 0) {
    const existing = presets[existingIndex];
    presets[existingIndex] = {
      ...existing,
      name,
      localPath,
      includePatterns,
      ignorePatterns,
      updatedAt: now,
    };
  } else {
    presets.unshift({
      id: input.id?.trim() || createPresetId(),
      name,
      localPath,
      includePatterns,
      ignorePatterns,
      updatedAt: now,
    });
  }

  const next = sortPresets(presets).slice(0, MAX_TRY_IT_PRESETS);
  saveTryItPresets(next, storage);
  return next;
}

export function deleteTryItPreset(id: string, storage?: StorageLike): TryItPreset[] {
  const presets = loadTryItPresets(storage).filter((preset) => preset.id !== id);
  saveTryItPresets(presets, storage);
  return presets;
}

export function clearTryItPresets(storage?: StorageLike): void {
  const resolvedStorage = getDefaultStorage(storage);
  resolvedStorage?.removeItem(TRY_IT_PRESETS_KEY);
}

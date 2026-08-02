import type { InputMode } from '../types/tryIt';
import type { PackFormat } from '../types/pack';
import type { StorageLike } from './tryItPersistence';

/**
 * V2 preset: a complete configuration snapshot (mode + source + format + patterns).
 * Formerly (v1) only stored localPath + patterns.
 */
export interface TryItPreset {
  id: string;
  name: string;
  mode: InputMode;
  source: string;
  format: PackFormat;
  includePatterns: string;
  ignorePatterns: string;
  group?: string; // reserved for future grouping UI
  sortOrder: number;
  updatedAt: number;
}

export interface TryItPresetInput {
  name: string;
  mode: InputMode;
  source: string;
  format: PackFormat;
  includePatterns?: string;
  ignorePatterns?: string;
}

/** Result of presetToPageState — the subset of page state a preset can restore. */
export interface PresetPageState {
  mode: InputMode;
  source: string;
  format: PackFormat;
  includePatterns: string;
  ignorePatterns: string;
}

/**
 * V1 preset type (for migration).
 * Stored under repomix-tryit-presets-v1.
 */
interface TryItPresetV1 {
  id: string;
  name: string;
  localPath: string;
  includePatterns: string;
  ignorePatterns: string;
  updatedAt: number;
}

const TRY_IT_PRESETS_KEY_V2 = 'repomix-tryit-presets-v2';
const TRY_IT_PRESETS_KEY_V1 = 'repomix-tryit-presets-v1';
export const MAX_TRY_IT_PRESETS = 20;

type InputModeAll = InputMode;
type PackFormatAll = PackFormat;

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

function normalizeName(name: string, source: string, mode: InputModeAll): string {
  const trimmed = name.trim();
  if (trimmed) {
    return trimmed;
  }

  return derivePresetNameFromSource(source, mode);
}

/** Derive a human-readable name from a source string (local path or URL). */
export function derivePresetNameFromSource(source: string, mode?: InputModeAll): string {
  const trimmed = source.trim().replace(/[\\/]+$/, '');
  if (!trimmed) {
    return 'Untitled';
  }

  // GitHub URLs: owner/repo
  if (mode !== 'localPath') {
    const githubMatch = trimmed.match(
      /(?:https:\/\/github\.com\/)?([^/]+)\/([^/?#]+?)(?:\.git)?(?:[/?#]|$)/i,
    );
    if (githubMatch) {
      return `${githubMatch[1]}/${githubMatch[2]}`;
    }
  }

  const segments = trimmed.split(/[\\/]/).filter(Boolean);
  return segments[segments.length - 1] || trimmed;
}

/**
 * Legacy alias for backward-compatible preset name derivation.
 * @deprecated Use derivePresetNameFromSource instead.
 */
export function derivePresetNameFromPath(localPath: string): string {
  return derivePresetNameFromSource(localPath, 'localPath');
}

// ── V1 → V2 migration ──────────────────────────────────────

const V2_MODES: ReadonlySet<string> = new Set(['url', 'localPath', 'file']);
const V2_FORMATS: ReadonlySet<string> = new Set(['xml', 'markdown', 'plain']);

function isValidV2Mode(s: string): s is InputModeAll {
  return V2_MODES.has(s);
}

function isValidV2Format(s: string): s is PackFormatAll {
  return V2_FORMATS.has(s);
}

function sanitizeV1Preset(candidate: unknown): TryItPresetV1 | null {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const value = candidate as Partial<TryItPresetV1>;
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
      : derivePresetNameFromSource(localPath, 'localPath');

  return {
    id: value.id.trim(),
    name,
    localPath,
    includePatterns: typeof value.includePatterns === 'string' ? value.includePatterns : '',
    ignorePatterns: typeof value.ignorePatterns === 'string' ? value.ignorePatterns : '',
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : Date.now(),
  };
}

/** Migrate a v1 preset record to v2 format. */
function migrateV1ToV2(v1: TryItPresetV1, sortOrder: number): TryItPreset {
  return {
    id: v1.id,
    name: v1.name,
    mode: 'localPath',
    source: v1.localPath,
    format: 'plain' as PackFormatAll,
    includePatterns: v1.includePatterns,
    ignorePatterns: v1.ignorePatterns,
    sortOrder,
    updatedAt: v1.updatedAt,
  };
}

/** Load and auto-migrate v1 data from localStorage if v2 key is empty. */
function loadAllPresets(storage: StorageLike): TryItPreset[] {
  // 1. Try V2
  try {
    const rawV2 = storage.getItem(TRY_IT_PRESETS_KEY_V2);
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as unknown;
      if (Array.isArray(parsed)) {
        const presets = parsed
          .map((item) => sanitizeV2Preset(item))
          .filter((item): item is TryItPreset => item !== null);
        return sortPresetsV2(presets);
      }
    }
  } catch {
    // continue to v1 migration
  }

  // 2. Try V1 → migrate
  try {
    const rawV1 = storage.getItem(TRY_IT_PRESETS_KEY_V1);
    if (!rawV1) {
      return [];
    }

    const parsed = JSON.parse(rawV1) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    const v1Presets = parsed
      .map((item) => sanitizeV1Preset(item))
      .filter((item): item is TryItPresetV1 => item !== null);

    if (v1Presets.length === 0) {
      return [];
    }

    // Migrate in original order (reverse of updatedAt sort so most recent gets highest order)
    const sortedV1 = [...v1Presets].sort((a, b) => b.updatedAt - a.updatedAt);
    const migrated = sortedV1.map((v1, index) => migrateV1ToV2(v1, v1Presets.length - index));

    // Persist under V2 key (silent migration)
    saveV2Presets(migrated, storage);

    return sortPresetsV2(migrated);
  } catch {
    return [];
  }
}

function sanitizeV2Preset(candidate: unknown): TryItPreset | null {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const value = candidate as Partial<TryItPreset>;
  if (typeof value.id !== 'string' || !value.id.trim()) {
    return null;
  }
  if (typeof value.mode !== 'string' || !isValidV2Mode(value.mode)) {
    return null;
  }
  if (typeof value.source !== 'string' || !value.source.trim()) {
    return null;
  }
  if (typeof value.format !== 'string' || !isValidV2Format(value.format)) {
    return null;
  }

  const mode = value.mode;
  const source = normalizePath(value.source);
  const name =
    typeof value.name === 'string' && value.name.trim()
      ? value.name.trim()
      : derivePresetNameFromSource(source, mode);

  return {
    id: value.id.trim(),
    name,
    mode,
    source,
    format: value.format,
    includePatterns: typeof value.includePatterns === 'string' ? value.includePatterns : '',
    ignorePatterns: typeof value.ignorePatterns === 'string' ? value.ignorePatterns : '',
    sortOrder: typeof value.sortOrder === 'number' ? value.sortOrder : Date.now(),
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : Date.now(),
  };
}

function sortPresetsV2(presets: TryItPreset[]): TryItPreset[] {
  return [...presets].sort((a, b) => a.sortOrder - b.sortOrder);
}

function saveV2Presets(presets: TryItPreset[], storage: StorageLike): void {
  const sanitized = sortPresetsV2(
    presets.map((item) => sanitizeV2Preset(item)).filter((item): item is TryItPreset => item !== null),
  ).slice(0, MAX_TRY_IT_PRESETS);

  storage.setItem(TRY_IT_PRESETS_KEY_V2, JSON.stringify(sanitized));
}

// ── Public API ──────────────────────────────────────────────

export function loadTryItPresets(storage?: StorageLike): TryItPreset[] {
  const resolvedStorage = getDefaultStorage(storage);
  if (!resolvedStorage) {
    return [];
  }

  return loadAllPresets(resolvedStorage);
}

export function saveTryItPresets(presets: TryItPreset[], storage?: StorageLike): void {
  const resolvedStorage = getDefaultStorage(storage);
  if (!resolvedStorage) {
    return;
  }

  saveV2Presets(presets, resolvedStorage);
}

/**
 * Upsert a preset. Matching priority:
 * 1. same id (when provided)
 * 2. same mode + source
 * Otherwise create a new preset at the highest sortOrder.
 */
export function upsertTryItPreset(
  input: TryItPresetInput & { id?: string },
  storage?: StorageLike,
  now = Date.now(),
): TryItPreset[] {
  const source = normalizePath(input.source);
  if (!source) {
    return loadTryItPresets(storage);
  }

  if (!isValidV2Mode(input.mode)) {
    return loadTryItPresets(storage);
  }

  if (!isValidV2Format(input.format)) {
    return loadTryItPresets(storage);
  }

  const presets = loadTryItPresets(storage);
  const name = normalizeName(input.name, source, input.mode);
  const includePatterns = input.includePatterns?.trim() ? input.includePatterns.trim() : '';
  const ignorePatterns = input.ignorePatterns?.trim() ? input.ignorePatterns.trim() : '';
  const format: PackFormatAll = input.format;

  // Match by id first, then by mode+source
  const existingIndex = presets.findIndex((preset) => {
    if (input.id && preset.id === input.id) {
      return true;
    }
    return preset.mode === input.mode && preset.source === source;
  });

  if (existingIndex >= 0) {
    const existing = presets[existingIndex];
    presets[existingIndex] = {
      ...existing,
      name,
      mode: input.mode,
      source,
      format,
      includePatterns,
      ignorePatterns,
      updatedAt: now,
      // keep existing sortOrder
    };
  } else {
    // New preset: sortOrder after all existing
    const maxOrder = presets.reduce((max, p) => Math.max(max, p.sortOrder), 0);
    presets.push({
      id: input.id?.trim() || createPresetId(),
      name,
      mode: input.mode,
      source,
      format,
      includePatterns,
      ignorePatterns,
      sortOrder: maxOrder + 1,
      updatedAt: now,
    });
  }

  const next = sortPresetsV2(presets).slice(0, MAX_TRY_IT_PRESETS);
  saveV2Presets(next, getDefaultStorage(storage) as StorageLike);
  return next;
}

export function deleteTryItPreset(id: string, storage?: StorageLike): TryItPreset[] {
  const presets = loadTryItPresets(storage).filter((preset) => preset.id !== id);
  saveTryItPresets(presets, storage);
  return presets;
}

/**
 * Reorder presets by providing their IDs in the desired display order.
 * Remaining presets (not in the list) keep their current sortOrder.
 */
export function reorderTryItPresets(ids: string[], storage?: StorageLike): TryItPreset[] {
  const presets = loadTryItPresets(storage);
  const idSet = new Set(ids);

  // Re-index the specified IDs in order
  const reordered = presets.map((preset) => {
    if (idSet.has(preset.id)) {
      const newIndex = ids.indexOf(preset.id);
      return { ...preset, sortOrder: newIndex };
    }
    return preset; // keep existing sortOrder for unspecified presets
  });

  const next = sortPresetsV2(reordered).slice(0, MAX_TRY_IT_PRESETS);
  saveV2Presets(next, getDefaultStorage(storage) as StorageLike);
  return next;
}

/** Extract the page-state fields from a preset — a pure function. */
export function presetToPageState(preset: TryItPreset): PresetPageState {
  return {
    mode: preset.mode,
    source: preset.source,
    format: preset.format,
    includePatterns: preset.includePatterns,
    ignorePatterns: preset.ignorePatterns,
  };
}

export function clearTryItPresets(storage?: StorageLike): void {
  const resolvedStorage = getDefaultStorage(storage);
  if (resolvedStorage) {
    resolvedStorage.removeItem(TRY_IT_PRESETS_KEY_V2);
  }
}

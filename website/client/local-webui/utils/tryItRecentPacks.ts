import type { StorageLike } from './tryItPersistence';
import type { InputMode } from '../types/tryIt';

export type RecentPackMode = Extract<InputMode, 'url' | 'localPath' | 'file'>;

export interface RecentPack {
  id: string;
  label: string;
  mode: RecentPackMode;
  source: string;
  format: string;
  includePatterns: string;
  ignorePatterns: string;
  createdAt: number;
}

export interface RecentPackInput {
  mode: RecentPackMode;
  source: string;
  label?: string;
  format: string;
  includePatterns?: string;
  ignorePatterns?: string;
}

const TRY_IT_RECENT_PACKS_KEY = 'repomix-tryit-recent-packs-v1';
export const MAX_RECENT_PACKS = 5;

const ALLOWED_MODES: ReadonlySet<RecentPackMode> = new Set(['url', 'localPath', 'file']);

function getDefaultStorage(storage?: StorageLike): StorageLike | null {
  if (storage) {
    return storage;
  }

  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  return window.localStorage;
}

function createRecentPackId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `recent-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Derive a short, human-readable label from a source string.
 * URLs (GitHub owner/repo) and local paths both reduce to their final meaningful segment.
 */
export function deriveRecentPackLabel(mode: RecentPackMode, source: string): string {
  const trimmed = source.trim();
  if (!trimmed) {
    return 'Untitled';
  }

  // GitHub URLs: https://github.com/owner/repo(.git)? -> owner/repo
  const githubMatch = trimmed.match(/(?:https:\/\/github\.com\/)?([^/]+)\/([^/?#]+?)(?:\.git)?(?:[/?#]|$)/i);
  if (githubMatch && mode === 'url') {
    return `${githubMatch[1]}/${githubMatch[2]}`;
  }

  // Local paths / file names: take the last non-empty path segment.
  const segments = trimmed.replace(/[\\/]+$/, '').split(/[\\/]/).filter(Boolean);
  return segments[segments.length - 1] || trimmed;
}

function normalizeSource(mode: RecentPackMode, source: string): string {
  return mode === 'file' ? source.trim() : source.trim().replace(/\.git$/, '');
}

function sanitizeRecentPack(candidate: unknown): RecentPack | null {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const value = candidate as Partial<RecentPack>;
  if (typeof value.id !== 'string' || !value.id.trim()) {
    return null;
  }
  if (typeof value.mode !== 'string' || !ALLOWED_MODES.has(value.mode as RecentPackMode)) {
    return null;
  }
  if (typeof value.source !== 'string' || !value.source.trim()) {
    return null;
  }
  if (typeof value.format !== 'string' || !value.format.trim()) {
    return null;
  }

  const mode = value.mode as RecentPackMode;
  const source = value.source.trim();
  const label =
    typeof value.label === 'string' && value.label.trim()
      ? value.label.trim()
      : deriveRecentPackLabel(mode, source);

  return {
    id: value.id.trim(),
    label,
    mode,
    source,
    format: value.format.trim(),
    includePatterns: typeof value.includePatterns === 'string' ? value.includePatterns : '',
    ignorePatterns: typeof value.ignorePatterns === 'string' ? value.ignorePatterns : '',
    createdAt: typeof value.createdAt === 'number' ? value.createdAt : Date.now(),
  };
}

function sortRecentPacks(packs: RecentPack[]): RecentPack[] {
  return [...packs].sort((a, b) => b.createdAt - a.createdAt);
}

export function loadRecentPacks(storage?: StorageLike): RecentPack[] {
  const resolvedStorage = getDefaultStorage(storage);
  if (!resolvedStorage) {
    return [];
  }

  try {
    const raw = resolvedStorage.getItem(TRY_IT_RECENT_PACKS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    const packs = parsed
      .map((item) => sanitizeRecentPack(item))
      .filter((item): item is RecentPack => item !== null);

    return sortRecentPacks(packs).slice(0, MAX_RECENT_PACKS);
  } catch {
    return [];
  }
}

function saveRecentPacks(packs: RecentPack[], storage?: StorageLike): void {
  const resolvedStorage = getDefaultStorage(storage);
  if (!resolvedStorage) {
    return;
  }

  const sanitized = sortRecentPacks(
    packs
      .map((item) => sanitizeRecentPack(item))
      .filter((item): item is RecentPack => item !== null),
  ).slice(0, MAX_RECENT_PACKS);

  resolvedStorage.setItem(TRY_IT_RECENT_PACKS_KEY, JSON.stringify(sanitized));
}

/**
 * Upsert a recent pack. Packs are deduplicated by `${mode}:${source}:${format}`;
 * an existing match moves to the top and is updated with the latest patterns.
 * The list is capped at MAX_RECENT_PACKS entries.
 */
export function upsertRecentPack(
  input: RecentPackInput,
  storage?: StorageLike,
  now = Date.now(),
): RecentPack[] {
  const source = normalizeSource(input.mode, input.source);
  if (!source) {
    return loadRecentPacks(storage);
  }

  const packs = loadRecentPacks(storage);
  const label = input.label?.trim() ? input.label.trim() : deriveRecentPackLabel(input.mode, source);
  const includePatterns = input.includePatterns?.trim() ? input.includePatterns.trim() : '';
  const ignorePatterns = input.ignorePatterns?.trim() ? input.ignorePatterns.trim() : '';

  const dedupeKey = `${input.mode}:${source}:${input.format}`;
  const existingIndex = packs.findIndex((pack) => `${pack.mode}:${pack.source}:${pack.format}` === dedupeKey);

  if (existingIndex >= 0) {
    const existing = packs[existingIndex];
    packs[existingIndex] = {
      ...existing,
      label,
      mode: input.mode,
      source,
      format: input.format,
      includePatterns,
      ignorePatterns,
      createdAt: now,
    };
  } else {
    packs.unshift({
      id: createRecentPackId(),
      label,
      mode: input.mode,
      source,
      format: input.format,
      includePatterns,
      ignorePatterns,
      createdAt: now,
    });
  }

  const next = sortRecentPacks(packs).slice(0, MAX_RECENT_PACKS);
  saveRecentPacks(next, storage);
  return next;
}

export function clearRecentPacks(storage?: StorageLike): void {
  const resolvedStorage = getDefaultStorage(storage);
  resolvedStorage?.removeItem(TRY_IT_RECENT_PACKS_KEY);
}

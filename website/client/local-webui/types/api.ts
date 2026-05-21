import type { PackFormat, PackRequestOptions } from './pack';

export interface FileInfo {
  path: string;
  charCount: number;
  selected?: boolean;
}

export interface LocalPathDirectoryEntry {
  name: string;
  path: string;
}

export interface LocalPathDirectoryListing {
  currentPath: string | null;
  parentPath: string | null;
  entries: LocalPathDirectoryEntry[];
}

export interface PackRequest {
  url?: string;
  localPath?: string;
  format: PackFormat;
  options: PackRequestOptions;
  file?: File;
}

export interface SuspiciousFile {
  filePath: string;
  messages: string[];
}

export interface PackResult {
  content: string;
  format: string;
  metadata: {
    repository: string;
    timestamp: string;
    summary: {
      totalFiles: number;
      totalCharacters: number;
      totalTokens: number;
    };
    topFiles: {
      path: string;
      charCount: number;
      tokenCount: number;
    }[];
    allFiles?: FileInfo[];
    suspiciousFiles?: SuspiciousFile[];
  };
}

export interface ErrorResponse {
  error: string;
}

export type PackProgressStage = 'cache-check' | 'cloning' | 'repository-fetch' | 'extracting' | 'processing';

export interface PackStreamCallbacks {
  onProgress?: (stage: PackProgressStage, message?: string) => void;
  signal?: AbortSignal;
}

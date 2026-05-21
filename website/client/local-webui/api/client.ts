import type {
  ErrorResponse,
  LocalPathDirectoryListing,
  PackProgressStage,
  PackRequest,
  PackResult,
  PackStreamCallbacks,
} from '../types/api';
import { resolveApiBaseUrl } from './baseUrl';

export type {
  ErrorResponse,
  FileInfo,
  LocalPathDirectoryEntry,
  LocalPathDirectoryListing,
  PackProgressStage,
  PackRequest,
  PackResult,
  PackStreamCallbacks,
  SuspiciousFile,
} from '../types/api';

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const API_BASE_URL = resolveApiBaseUrl(import.meta.env);

// NDJSON stream event types
interface ProgressEvent {
  type: 'progress';
  stage: PackProgressStage;
  message?: string;
}

interface ResultEvent {
  type: 'result';
  data: PackResult;
}

interface StreamErrorEvent {
  type: 'error';
  message: string;
}

type StreamEvent = ProgressEvent | ResultEvent | StreamErrorEvent;

async function extractErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const data = await response.json();
    return (data as ErrorResponse).error;
  }

  const fallback = response.statusText
    ? `${response.status} ${response.statusText}`
    : `Request failed with status ${response.status}`;

  try {
    const text = await response.text();
    const compactText = text.replace(/\s+/g, ' ').trim();
    return compactText ? `${fallback}\n${compactText}` : fallback;
  } catch {
    return fallback;
  }
}

export async function browseLocalPathDirectories(selectedPath?: string): Promise<LocalPathDirectoryListing> {
  const endpoint = new URL(`${API_BASE_URL}/api/local-path/directories`);
  if (selectedPath?.trim()) {
    endpoint.searchParams.set('path', selectedPath.trim());
  }

  const response = await fetch(endpoint.toString());

  if (!response.ok) {
    throw new ApiError(await extractErrorMessage(response));
  }

  return (await response.json()) as LocalPathDirectoryListing;
}

export async function packRepository(request: PackRequest, callbacks?: PackStreamCallbacks): Promise<PackResult> {
  const formData = new FormData();

  if (request.file) {
    formData.append('file', request.file);
  } else if (request.localPath) {
    formData.append('localPath', request.localPath);
  } else {
    formData.append('url', request.url ?? '');
  }
  formData.append('format', request.format);
  formData.append('options', JSON.stringify(request.options));

  const response = await fetch(`${API_BASE_URL}/api/pack`, {
    method: 'POST',
    body: formData,
    signal: callbacks?.signal,
  });

  // Handle non-streaming error responses (validation errors return JSON)
  if (!response.ok) {
    throw new ApiError(await extractErrorMessage(response));
  }

  // Handle NDJSON stream
  if (!response.body) {
    throw new ApiError('No response body received');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result: PackResult | null = null;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse complete lines from buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        const event = JSON.parse(line) as StreamEvent;
        if (event.type === 'progress') {
          callbacks?.onProgress?.(event.stage, event.message);
        } else if (event.type === 'result') {
          result = event.data;
        } else if (event.type === 'error') {
          throw new ApiError(event.message);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!result) {
    throw new ApiError('No result received from server');
  }

  return result;
}

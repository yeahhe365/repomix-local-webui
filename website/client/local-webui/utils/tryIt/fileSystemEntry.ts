export interface DirectoryCollectionMessages {
  directoryTooDeep?: (maxDepth: number) => string;
  tooManyFiles?: (maxFiles: number) => string;
}

interface CollectFilesOptions {
  path?: string;
  depth?: number;
  fileCount?: { current: number };
  maxDepth?: number;
  maxFiles?: number;
  messages?: DirectoryCollectionMessages;
}

const DEFAULT_MAX_DEPTH = 20;
const DEFAULT_MAX_FILES = 10000;

function createTooDeepError(maxDepth: number, messages?: DirectoryCollectionMessages): Error {
  return new Error(messages?.directoryTooDeep?.(maxDepth) || `Directory structure too deep (max depth: ${maxDepth})`);
}

function createTooManyFilesError(maxFiles: number, messages?: DirectoryCollectionMessages): Error {
  return new Error(
    messages?.tooManyFiles?.(maxFiles) || `Too many files in directory structure (max files: ${maxFiles})`,
  );
}

function assertCollectionLimits(
  depth: number,
  fileCount: { current: number },
  maxDepth: number,
  maxFiles: number,
  messages?: DirectoryCollectionMessages,
) {
  if (depth > maxDepth) {
    throw createTooDeepError(maxDepth, messages);
  }
  if (fileCount.current > maxFiles) {
    throw createTooManyFilesError(maxFiles, messages);
  }
}

function readFileEntry(
  entry: FileSystemEntry,
  path: string,
  fileCount: { current: number },
  maxFiles: number,
  messages?: DirectoryCollectionMessages,
) {
  return new Promise<File[]>((resolve, reject) => {
    (entry as FileSystemFileEntry).file((file: File) => {
      if (fileCount.current >= maxFiles) {
        reject(createTooManyFilesError(maxFiles, messages));
        return;
      }

      fileCount.current++;

      const customFile = new File([file], file.name, {
        type: file.type,
        lastModified: file.lastModified,
      });

      Object.defineProperty(customFile, 'webkitRelativePath', {
        value: path ? `${path}/${file.name}` : file.name,
      });

      resolve([customFile]);
    }, reject);
  });
}

export async function collectFilesFromEntry(
  entry: FileSystemEntry,
  options: CollectFilesOptions = {},
): Promise<File[]> {
  const path = options.path ?? '';
  const depth = options.depth ?? 0;
  const fileCount = options.fileCount ?? { current: 0 };
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;

  assertCollectionLimits(depth, fileCount, maxDepth, maxFiles, options.messages);

  if (entry.isFile) {
    return readFileEntry(entry, path, fileCount, maxFiles, options.messages);
  }

  if (entry.isDirectory && (entry as FileSystemDirectoryEntry).createReader) {
    return new Promise((resolve, reject) => {
      const dirReader = (entry as FileSystemDirectoryEntry).createReader();
      const allFiles: File[] = [];

      function readEntries() {
        dirReader.readEntries(async (entries: FileSystemEntry[]) => {
          if (entries.length === 0) {
            resolve(allFiles);
            return;
          }

          try {
            for (const childEntry of entries) {
              assertCollectionLimits(depth + 1, fileCount, maxDepth, maxFiles, options.messages);

              const childPath = path ? `${path}/${childEntry.name}` : childEntry.name;
              const files = await collectFilesFromEntry(childEntry, {
                path: childPath,
                depth: depth + 1,
                fileCount,
                maxDepth,
                maxFiles,
                messages: options.messages,
              });
              allFiles.push(...files);
            }
            readEntries();
          } catch (error) {
            reject(error);
          }
        }, reject);
      }

      readEntries();
    });
  }

  return [];
}

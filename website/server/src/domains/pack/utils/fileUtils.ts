import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { unzip } from 'fflate';
import { AppError } from '../../../utils/errorHandler.js';

export async function extractZip(file: File, destPath: string): Promise<void> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Unzip using fflate with promise wrapper
    const files = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
      unzip(buffer, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    const filePaths = Object.keys(files);
    const processedPaths = new Set<string>();

    // Validate every entry for path traversal (ZipSlip) and duplicate paths.
    // These guards are kept intentionally: dropping them would reintroduce a real
    // directory-traversal vulnerability that lets a malicious archive escape destPath.
    for (const entryPath of filePaths) {
      if (entryPath.endsWith('/')) continue; // Skip directory entries

      const fullPath = path.resolve(destPath, entryPath);
      const relativePath = path.relative(destPath, fullPath);
      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        throw new AppError(`Security violation: Potential directory traversal attack detected in path: ${entryPath}`);
      }

      const normalizedPath = path.normalize(fullPath);
      if (processedPaths.has(normalizedPath)) {
        throw new AppError(`Duplicate file path detected: ${entryPath}. This could indicate a malicious archive.`);
      }
      processedPaths.add(normalizedPath);
    }

    await fs.mkdir(destPath, { recursive: true });

    // Extract files using fflate with parallel writes
    const writePromises = Object.entries(files)
      .filter(([filePath]) => !filePath.endsWith('/')) // Skip directories
      .map(async ([filePath, data]) => {
        const fullPath = path.join(destPath, filePath);
        const dirPath = path.dirname(fullPath);

        // Create directory if it doesn't exist
        await fs.mkdir(dirPath, { recursive: true });

        // Write the file
        await fs.writeFile(fullPath, data);
      });

    await Promise.all(writePromises);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Failed to extract ZIP file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const createTempDirectory = async (): Promise<string> => {
  try {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'repomix-'));
    return tempDir;
  } catch (error) {
    throw new AppError(`Failed to create temporary directory: ${(error as Error).message}`);
  }
};

export const cleanupTempDirectory = async (directory: string): Promise<void> => {
  try {
    if (!directory.includes('repomix-')) {
      throw new AppError('Invalid temporary directory path');
    }
    await fs.rm(directory, { recursive: true, force: true });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error(`Failed to cleanup temporary directory: ${directory}`, error);
  }
};

export const copyOutputToCurrentDirectory = async (
  sourceDir: string,
  targetDir: string,
  outputFileName: string,
): Promise<void> => {
  // Sanitize file paths
  const sanitizedFileName = path.basename(outputFileName);
  const sourcePath = path.join(sourceDir, sanitizedFileName);
  const targetPath = path.join(targetDir, sanitizedFileName);

  try {
    // Verify source exists
    await fs.access(sourcePath);

    // Ensure target directory exists
    await fs.mkdir(targetDir, { recursive: true });

    await fs.copyFile(sourcePath, targetPath);
  } catch (error) {
    throw new AppError(
      `Failed to copy output file: ${(error as Error).message}. Source: ${sourcePath}, Target: ${targetPath}`,
    );
  }
};

import type { FileUploadMessages, FileValidationResult } from '../../types/fileUpload';

interface DefaultFileValidationOptions {
  acceptedTypes: string[];
  maxFileSize: number;
  messages?: FileUploadMessages;
}

const formatFileSizeMB = (bytes: number, decimals: number) => (bytes / (1024 * 1024)).toFixed(decimals);

export const validateSingleFile = (
  file: File,
  { acceptedTypes, maxFileSize, messages }: DefaultFileValidationOptions,
): FileValidationResult => {
  if (acceptedTypes.length > 0) {
    const isValidType = acceptedTypes.some((type) => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return file.type === type;
    });

    if (!isValidType) {
      return {
        valid: false,
        error: messages?.invalidFileType?.(acceptedTypes) ?? `Please upload a ${acceptedTypes.join(' or ')} file`,
      };
    }
  }

  if (file.size > maxFileSize) {
    const sizeMB = formatFileSizeMB(file.size, 1);
    const limitMB = formatFileSizeMB(maxFileSize, 0);
    return {
      valid: false,
      error: messages?.fileTooLarge?.(sizeMB, limitMB) ?? `File size (${sizeMB}MB) exceeds the ${limitMB}MB limit`,
    };
  }

  return { valid: true };
};

export const validateFileList = (
  files: File[],
  { maxFileSize, messages }: Pick<DefaultFileValidationOptions, 'maxFileSize' | 'messages'>,
): FileValidationResult => {
  if (files.length === 0) {
    return { valid: false, error: messages?.noFilesFound ?? 'No files found' };
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > maxFileSize) {
    const sizeMB = formatFileSizeMB(totalSize, 1);
    const limitMB = formatFileSizeMB(maxFileSize, 0);
    return {
      valid: false,
      error: messages?.totalSizeTooLarge?.(sizeMB, limitMB) ?? `Total size (${sizeMB}MB) exceeds the ${limitMB}MB limit`,
    };
  }

  return { valid: true };
};

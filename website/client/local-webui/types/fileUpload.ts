export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface FileUploadResult {
  success: boolean;
  result?: File;
  error?: string;
}

export interface FileUploadMessages {
  invalidFileType?: (acceptedTypes: string[]) => string;
  fileTooLarge?: (sizeMB: string, limitMB: string) => string;
  totalSizeTooLarge?: (sizeMB: string, limitMB: string) => string;
  noFilesFound?: string;
  validationFailed?: string;
  multipleFilesNeedPreprocessor?: string;
  processingFailed?: string;
  noFilesSelected?: string;
  noItemsFound?: string;
  folderDropUnsupported?: string;
  dropFolderNotFile?: string;
  failedToProcessFolder?: string;
  directoryTooDeep?: (maxDepth: number) => string;
  tooManyFiles?: (maxFiles: number) => string;
}

export interface FileUploadOptions {
  maxFileSize?: number;
  acceptedTypes?: string[];
  accept?: string;
  multiple?: boolean;
  webkitdirectory?: boolean;
  validateFile?: (file: File) => FileValidationResult;
  validateFiles?: (files: File[]) => FileValidationResult;
  preprocessFiles?: (files: File[], folderName?: string) => Promise<File>;
}

export interface FileUploadConfig {
  mode: 'file' | 'folder';
  placeholder: string;
  icon: 'file' | 'folder';
  options: FileUploadOptions;
  messages?: FileUploadMessages;
}

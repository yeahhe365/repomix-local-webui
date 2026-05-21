import { computed, ref } from 'vue';
import type { FileUploadConfig, FileUploadResult, FileValidationResult } from '../types/fileUpload';
import { collectFilesFromEntry } from '../utils/tryIt/fileSystemEntry';
import { validateFileList, validateSingleFile } from '../utils/tryIt/fileUploadValidation';

export function useFileUpload(config: FileUploadConfig) {
  const {
    maxFileSize = 10 * 1024 * 1024, // 10MB default
    acceptedTypes = [],
    accept = '',
    multiple = false,
    webkitdirectory = false,
    validateFile,
    validateFiles,
    preprocessFiles,
  } = config.options;

  // Reactive state
  const fileInput = ref<HTMLInputElement | null>(null);
  const dragActive = ref(false);
  const selectedItem = ref<string | null>(null);
  const errorMessage = ref<string | null>(null);
  const isProcessing = ref(false);

  // Computed
  const hasError = computed(() => !!errorMessage.value);
  const hasSelection = computed(() => !!selectedItem.value);
  const isValid = computed(() => hasSelection.value && !hasError.value);

  const defaultValidateFile = (file: File) =>
    validateSingleFile(file, {
      acceptedTypes,
      maxFileSize,
      messages: config.messages,
    });

  const defaultValidateFiles = (files: File[]) =>
    validateFileList(files, {
      maxFileSize,
      messages: config.messages,
    });

  // Clear error and selection
  function clearError() {
    errorMessage.value = null;
  }

  function clearSelection() {
    selectedItem.value = null;
    errorMessage.value = null;
    // Clear file input to prevent re-selection issues
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }

  // Validate and process files
  async function processFiles(
    files: File[],
    folderName?: string,
  ): Promise<FileUploadResult> {
    clearError();
    isProcessing.value = true;

    try {
      // Validation
      const validator =
        config.mode === 'folder' || multiple
          ? validateFiles || defaultValidateFiles
          : validateFile || defaultValidateFile;

      let validationResult: FileValidationResult;
      if (config.mode === 'folder' || multiple) {
        validationResult = (validator as typeof defaultValidateFiles)(files);
      } else {
        validationResult = (validator as typeof defaultValidateFile)(files[0]);
      }

      if (!validationResult.valid) {
        errorMessage.value = validationResult.error || config.messages?.validationFailed || 'Validation failed';
        return { success: false, error: validationResult.error };
      }

      // Preprocessing (e.g., ZIP creation for folders)
      let resultFile: File;
      if (preprocessFiles) {
        resultFile = await preprocessFiles(files, folderName);
      } else {
        if ((config.mode === 'folder' || multiple) && files.length > 1) {
          throw new Error(
            config.messages?.multipleFilesNeedPreprocessor || 'Multiple files require a preprocessor function',
          );
        }
        resultFile = files[0];
      }

      // Update selection
      selectedItem.value = folderName || resultFile.name;

      // Clear file input to prevent re-selection issues
      if (fileInput.value) {
        fileInput.value.value = '';
      }

      return { success: true, result: resultFile };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : config.messages?.processingFailed || 'Processing failed';
      errorMessage.value = errorMsg;
      return { success: false, error: errorMsg };
    } finally {
      isProcessing.value = false;
    }
  }

  // Handle file input selection
  async function handleFileSelect(
    files: FileList | null,
  ): Promise<FileUploadResult> {
    if (!files || files.length === 0) {
      return { success: false, error: config.messages?.noFilesSelected || 'No files selected' };
    }

    const fileArray = Array.from(files);
    let folderName: string | undefined;

    if (config.mode === 'folder' && files[0].webkitRelativePath) {
      folderName = files[0].webkitRelativePath.split('/')[0];
    }

    return await processFiles(fileArray, folderName);
  }

  // Handle drag and drop
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragActive.value = true;
  }

  function handleDragLeave() {
    dragActive.value = false;
  }

  async function handleDrop(event: DragEvent): Promise<FileUploadResult> {
    event.preventDefault();
    dragActive.value = false;

    if (config.mode === 'folder') {
      return await handleFolderDrop(event);
    }
    return await handleFileSelect(event.dataTransfer?.files || null);
  }

  // Specialized folder drop handling
  async function handleFolderDrop(event: DragEvent): Promise<FileUploadResult> {
    if (!event.dataTransfer?.items?.length) {
      return { success: false, error: config.messages?.noItemsFound || 'No items found' };
    }

    // Check directory reading capability
    if (!('webkitGetAsEntry' in DataTransferItem.prototype)) {
      const error =
        config.messages?.folderDropUnsupported ||
        "Your browser doesn't support folder drop. Please use the browse button instead.";
      errorMessage.value = error;
      return { success: false, error };
    }

    const entry = event.dataTransfer.items[0].webkitGetAsEntry();
    if (!entry?.isDirectory) {
      const error = config.messages?.dropFolderNotFile || 'Please drop a folder, not a file.';
      errorMessage.value = error;
      return { success: false, error };
    }

    try {
      const files = await collectFilesFromEntry(entry, {
        messages: {
          directoryTooDeep: config.messages?.directoryTooDeep,
          tooManyFiles: config.messages?.tooManyFiles,
        },
      });
      return await processFiles(files, entry.name);
    } catch {
      const errorMsg =
        config.messages?.failedToProcessFolder ||
        'Failed to process the folder. Please try again or use the browse button.';
      errorMessage.value = errorMsg;
      return { success: false, error: errorMsg };
    }
  }

  // Trigger file input
  function triggerFileInput() {
    fileInput.value?.click();
  }

  // Input attributes for template
  const inputAttributes = computed(() => ({
    type: 'file',
    accept,
    multiple,
    webkitdirectory: webkitdirectory || config.mode === 'folder',
    ...(config.mode === 'folder' && {
      directory: true,
      mozdirectory: true,
    }),
  }));

  return {
    // Refs
    fileInput,
    dragActive,
    selectedItem,
    errorMessage,
    isProcessing,

    // Computed
    hasError,
    hasSelection,
    isValid,
    inputAttributes,

    // Methods
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    triggerFileInput,
    clearError,
    clearSelection,
    processFiles,
  };
}

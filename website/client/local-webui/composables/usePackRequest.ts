import { computed, onMounted, ref, watch } from 'vue';
import { useHomeUiText } from '../components/Home/useHomeUiText';
import type { FileInfo, PackProgressStage, PackResult } from '../types/api';
import type { InputMode } from '../types/tryIt';
import { isValidAbsolutePath } from '../utils/tryIt/localPathInput';
import { isValidRemoteValue } from '../utils/tryIt/remoteValidation';
import { handlePackRequest } from '../utils/tryIt/requestHandlers';
import { downloadResult } from '../utils/tryIt/resultViewer';
import { loadTryItPageState, resolveInitialTryItPageState, saveTryItPageState } from '../utils/tryItPersistence';
import { deriveRecentPackLabel, upsertRecentPack } from '../utils/tryItRecentPacks';
import { parseUrlParameters } from '../utils/urlParams';
import { usePackOptions } from './usePackOptions';

export function usePackRequest() {
  const uiText = useHomeUiText();
  const packOptionsComposable = usePackOptions();
  const { packOptions, getPackRequestOptions, resetOptions, DEFAULT_PACK_OPTIONS } = packOptionsComposable;

  // Input states
  const inputUrl = ref('');
  const inputLocalPath = ref('');
  const inputRepositoryUrl = ref('');
  const mode = ref<InputMode>('localPath');
  const uploadedFile = ref<File | null>(null);

  // Request states
  const loading = ref(false);
  const error = ref<string | null>(null);
  const errorType = ref<'error' | 'warning'>('error');
  const result = ref<PackResult | null>(null);
  const hasExecuted = ref(false);
  const progressStage = ref<PackProgressStage | null>(null);
  const progressMessage = ref<string | null>(null);

  // Request controller for cancellation
  let requestController: AbortController | null = null;

  // Computed validation
  const isSubmitValid = computed(() => {
    switch (mode.value) {
      case 'url':
        return !!inputUrl.value && isValidRemoteValue(inputUrl.value.trim());
      case 'localPath':
        return !!inputLocalPath.value && isValidAbsolutePath(inputLocalPath.value.trim());
      case 'file':
        return !!uploadedFile.value;
      default:
        return false;
    }
  });

  function setMode(newMode: InputMode) {
    mode.value = newMode;
  }

  function handleFileUpload(file: File) {
    uploadedFile.value = file;
  }

  function resetRequest() {
    error.value = null;
    errorType.value = 'error';
    result.value = null;
    hasExecuted.value = false;
  }

  async function submitRequest() {
    if (!isSubmitValid.value) return;

    // Cancel any pending request
    if (requestController) {
      requestController.abort();
    }
    requestController = new AbortController();

    loading.value = true;
    error.value = null;
    errorType.value = 'error';
    result.value = null;
    hasExecuted.value = true;
    progressStage.value = null;
    progressMessage.value = null;
    inputRepositoryUrl.value = mode.value === 'localPath' ? inputLocalPath.value : inputUrl.value;

    try {
      await handlePackRequest(
        mode.value === 'url' ? inputUrl.value : '',
        packOptions.format,
        getPackRequestOptions.value,
        {
          onSuccess: (response) => {
            result.value = response;

            // Record a recent-pack entry on success so users can re-run quickly.
            if (mode.value === 'url') {
              const source = inputUrl.value.trim();
              upsertRecentPack({
                mode: 'url',
                source,
                label: deriveRecentPackLabel('url', source),
                format: packOptions.format,
                includePatterns: packOptions.includePatterns,
                ignorePatterns: packOptions.ignorePatterns,
              });
            } else if (mode.value === 'localPath') {
              const source = inputLocalPath.value.trim();
              upsertRecentPack({
                mode: 'localPath',
                source,
                label: deriveRecentPackLabel('localPath', source),
                format: packOptions.format,
                includePatterns: packOptions.includePatterns,
                ignorePatterns: packOptions.ignorePatterns,
              });
            } else if (mode.value === 'file') {
              const fileName = uploadedFile.value?.name ?? '';
              if (fileName) {
                upsertRecentPack({
                  mode: 'file',
                  source: fileName,
                  label: deriveRecentPackLabel('file', fileName),
                  format: packOptions.format,
                  includePatterns: packOptions.includePatterns,
                  ignorePatterns: packOptions.ignorePatterns,
                });
              }
            }
          },
          onError: (errorMessage) => {
            error.value = errorMessage;
          },
          onAbort: (message) => {
            error.value = message;
            errorType.value = 'warning';
          },
          onProgress: (stage, message) => {
            progressStage.value = stage;
            progressMessage.value = message ?? null;
          },
          signal: requestController.signal,
          file: mode.value === 'file' ? uploadedFile.value || undefined : undefined,
          localPath: mode.value === 'localPath' ? inputLocalPath.value : undefined,
          messages: {
            requestTimedOut: uiText.value.errors.requestTimedOut,
            requestCancelled: uiText.value.errors.requestCancelled,
            requestCancelledUnknown: uiText.value.errors.requestCancelledUnknown,
            unexpectedError: uiText.value.errors.unexpectedError,
          },
        },
      );
    } finally {
      loading.value = false;
      requestController = null;
    }
  }

  async function submitAndDownloadRequest() {
    await submitRequest();
    // Only trigger download when packing actually succeeded (a result exists and no error).
    // submitRequest resets result/error at the start, so there's no risk of reading a stale result.
    // Early-return on invalid input, abort (onAbort), and server errors (onError) all leave result.value null.
    if (result.value && !error.value) {
      downloadResult(result.value.content, result.value.format, result.value);
    }
  }

  async function repackWithSelectedFiles(selectedFiles: FileInfo[]) {
    if (!result.value || selectedFiles.length === 0) return;

    // Generate include patterns from selected files
    const selectedPaths = selectedFiles.map((file) => file.path);
    const includePatterns = selectedPaths.join(',');

    // Temporarily update pack options with include patterns
    const originalIncludePatterns = packOptions.includePatterns;
    const originalIgnorePatterns = packOptions.ignorePatterns;

    packOptions.includePatterns = includePatterns;
    packOptions.ignorePatterns = ''; // Clear ignore patterns to ensure selected files are included

    try {
      // Use the same loading state as normal pack processing
      await submitRequest();

      // Update file selection state in the new result
      if (result.value?.metadata?.allFiles) {
        for (const file of result.value.metadata.allFiles) {
          file.selected = selectedPaths.includes(file.path);
        }
      }
    } finally {
      // Restore original pack options
      packOptions.includePatterns = originalIncludePatterns;
      packOptions.ignorePatterns = originalIgnorePatterns;
    }
  }

  function cancelRequest() {
    if (requestController) {
      requestController.abort('cancel');
      requestController = null;
    }
    loading.value = false;
  }

  // Apply URL parameters after component mounts
  // This must be done here (not during setup) because during SSR/hydration,
  // browser globals like `window.location.search` are not available.
  // Accessing them before mounting would cause errors in SSR environments.
  onMounted(() => {
    const urlParams = parseUrlParameters();
    const persistedState = loadTryItPageState(DEFAULT_PACK_OPTIONS);
    const initialState = resolveInitialTryItPageState({
      defaultOptions: DEFAULT_PACK_OPTIONS,
      persistedState,
      urlParams,
    });

    mode.value = initialState.mode;
    inputUrl.value = initialState.remoteUrl;
    inputLocalPath.value = initialState.localPath;
    Object.assign(packOptions, initialState.packOptions);
  });

  watch(
    [mode, inputUrl, inputLocalPath, packOptions],
    () => {
      saveTryItPageState({
        mode: mode.value,
        remoteUrl: inputUrl.value,
        localPath: inputLocalPath.value,
        packOptions: { ...packOptions },
      });
    },
    { deep: true },
  );

  return {
    // Pack options (re-exported for convenience)
    ...packOptionsComposable,

    // Input states
    inputUrl,
    inputLocalPath,
    inputRepositoryUrl,
    mode,
    uploadedFile,

    // Request states
    loading,
    error,
    errorType,
    result,
    hasExecuted,
    progressStage,
    progressMessage,

    // Computed
    isSubmitValid,

    // Actions
    setMode,
    handleFileUpload,
    resetRequest,
    submitRequest,
    submitAndDownloadRequest,
    repackWithSelectedFiles,
    cancelRequest,

    // Pack option actions
    resetOptions,
    DEFAULT_PACK_OPTIONS,
  };
}

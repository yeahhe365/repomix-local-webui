import { computed, reactive } from 'vue';
import { DEFAULT_PACK_OPTIONS, type PackOptions } from './packOptionsShared.js';

export function usePackOptions() {
  // Initialize with default options only
  const packOptions = reactive<PackOptions>({ ...DEFAULT_PACK_OPTIONS });

  // Function to apply URL parameters (exposed for external use)
  function applyUrlParameters(urlParams: Record<string, unknown>) {
    for (const key of Object.keys(packOptions) as Array<keyof PackOptions>) {
      if (key in urlParams && urlParams[key] !== undefined) {
        // Type-safe assignment: only assign if the key is a valid PackOptions key
        // @ts-expect-error
        packOptions[key] = urlParams[key];
      }
    }
  }

  const getPackRequestOptions = computed(() => ({
    removeComments: packOptions.removeComments,
    removeEmptyLines: packOptions.removeEmptyLines,
    showLineNumbers: packOptions.showLineNumbers,
    fileSummary: packOptions.fileSummary,
    directoryStructure: packOptions.directoryStructure,
    includePatterns: packOptions.includePatterns ? packOptions.includePatterns.trim() : undefined,
    ignorePatterns: packOptions.ignorePatterns ? packOptions.ignorePatterns.trim() : undefined,
    outputParsable: packOptions.outputParsable,
    compress: packOptions.compress,
  }));

  function updateOption<K extends keyof PackOptions>(key: K, value: PackOptions[K]) {
    packOptions[key] = value;
  }

  function resetOptions() {
    Object.assign(packOptions, DEFAULT_PACK_OPTIONS);
  }

  return {
    packOptions,
    getPackRequestOptions,
    updateOption,
    resetOptions,
    applyUrlParameters,
    DEFAULT_PACK_OPTIONS,
  };
}

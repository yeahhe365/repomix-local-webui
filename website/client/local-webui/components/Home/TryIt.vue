<template>
  <div class="container">
    <form class="try-it-container" @submit.prevent="handleSubmit($event)">
      <TryItInputRow
        v-model:mode="mode"
        v-model:url="inputUrl"
        v-model:local-path="inputLocalPath"
        :loading="loading"
        :is-submit-valid="isSubmitValid"
        :should-show-reset="shouldShowReset"
        @upload="handleFileUpload"
        @keydown="handleKeydown"
        @submit="handleSubmit"
        @reset="handleReset"
        @cancel="handleCancel"
      />

      <TryItPresets
        :mode="mode"
        :local-path="inputLocalPath"
        :include-patterns="packOptions.includePatterns"
        :ignore-patterns="packOptions.ignorePatterns"
        :loading="loading"
        @apply="handleApplyPreset"
      />

      <TryItPackOptions
        v-model:format="packOptions.format"
        v-model:include-patterns="packOptions.includePatterns"
        v-model:ignore-patterns="packOptions.ignorePatterns"
        v-model:file-summary="packOptions.fileSummary"
        v-model:directory-structure="packOptions.directoryStructure"
        v-model:remove-comments="packOptions.removeComments"
        v-model:remove-empty-lines="packOptions.removeEmptyLines"
        v-model:show-line-numbers="packOptions.showLineNumbers"
        v-model:output-parsable="packOptions.outputParsable"
        v-model:compress="packOptions.compress"
      />

      <div v-if="hasExecuted">
        <TryItResult
          :result="result"
          :loading="loading"
          :error="error"
          :error-type="errorType"
          :repository-url="inputRepositoryUrl"
          :pack-options="packOptions"
          :progress-stage="progressStage"
          :progress-message="progressMessage"
          @repack="handleRepack"
        />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, watch } from 'vue';
import { usePackRequest } from '../../composables/usePackRequest';
import { isBot } from '../../utils/botDetect';
import { clearLocalPathBrowserState, clearTryItPageState } from '../../utils/tryItPersistence';
import { isValidRemoteValue } from '../../utils/tryIt/remoteValidation';
import { hasNonDefaultValues, parseUrlParameters, updateUrlParameters } from '../../utils/urlParams';
import type { FileInfo } from '../../types/api';
import type { TryItPreset } from '../../utils/tryItPresets';
import TryItInputRow from './TryItInputRow.vue';
import TryItPackOptions from './TryItPackOptions.vue';
import TryItPresets from './TryItPresets.vue';
import TryItResult from './TryItResult.vue';

// Use composables for state management
const {
  // Pack options
  packOptions,
  DEFAULT_PACK_OPTIONS,

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
  submitRequest,
  repackWithSelectedFiles,
  resetOptions,
  cancelRequest,
} = usePackRequest();

// Check if reset button should be shown
const shouldShowReset = computed(() => {
  return (
    hasNonDefaultValues(
      '',
      packOptions as unknown as Record<string, unknown>,
      DEFAULT_PACK_OPTIONS as unknown as Record<string, unknown>,
    ) ||
    mode.value !== 'url' ||
    Boolean(inputUrl.value.trim()) ||
    Boolean(inputLocalPath.value.trim()) ||
    Boolean(uploadedFile.value)
  );
});

// Function to update URL parameters based on current state
function updateUrlFromCurrentState() {
  const urlParamsToUpdate: Record<string, unknown> = {};

  // Add repository URL if it exists and is valid
  if (inputUrl.value && isValidRemoteValue(inputUrl.value.trim())) {
    urlParamsToUpdate.repo = inputUrl.value.trim();
  }

  // Only add pack options that differ from defaults
  for (const [key, value] of Object.entries(packOptions)) {
    const defaultValue = DEFAULT_PACK_OPTIONS[key as keyof typeof DEFAULT_PACK_OPTIONS];
    if (value !== defaultValue) {
      // For string values, also check if they're not empty
      if (typeof value === 'string' && value.trim() === '' && defaultValue === '') {
        continue; // Skip empty strings that match default empty strings
      }

      urlParamsToUpdate[key] = value;
    }
  }

  updateUrlParameters(urlParamsToUpdate);
}

async function handleSubmit(event?: SubmitEvent) {
  // Prevent form submission when already loading
  if (loading.value) {
    event?.preventDefault();
    return;
  }

  // Prevent accidental form submissions from unintended buttons
  if (event?.submitter && !isSubmitValid.value) {
    const submitter = event.submitter as HTMLElement;
    if (!submitter.matches('.pack-button, [type="submit"]')) {
      return; // Ignore submission from non-pack buttons when form is invalid
    }
  }

  // Only proceed if form is valid
  if (!isSubmitValid.value) {
    return;
  }

  await submitRequest();
}

function handleKeydown(event: KeyboardEvent) {
  if (
    event.key === 'Enter' &&
    (mode.value === 'url' || mode.value === 'localPath') &&
    isSubmitValid.value &&
    !loading.value
  ) {
    handleSubmit();
  }
}

function handleReset() {
  resetOptions();
  inputUrl.value = '';
  inputLocalPath.value = '';
  uploadedFile.value = null;
  mode.value = 'url';
  clearTryItPageState();
  clearLocalPathBrowserState();

  // Clear URL parameters
  updateUrlParameters({});
}

function handleRepack(selectedFiles: FileInfo[]) {
  repackWithSelectedFiles(selectedFiles);
}

function handleCancel() {
  cancelRequest();
}

function handleApplyPreset(preset: TryItPreset) {
  mode.value = 'localPath';
  inputLocalPath.value = preset.localPath;
  packOptions.includePatterns = preset.includePatterns;
  packOptions.ignorePatterns = preset.ignorePatterns;
  uploadedFile.value = null;
}

// Watch for changes in packOptions and inputUrl to update URL in real-time
watch(
  [packOptions, inputUrl],
  () => {
    updateUrlFromCurrentState();
  },
  { deep: true },
);

// Handle URL parameters when component mounts
onMounted(() => {
  const urlParams = parseUrlParameters();

  // If repository parameter exists and is valid, trigger packing automatically
  // Skip auto-execution for bots/crawlers to prevent unintended API calls
  // (e.g., Applebot executing JS on permalink URLs causes mass pack requests)
  if (urlParams.repo && isValidRemoteValue(urlParams.repo.trim()) && !isBot()) {
    // Use nextTick to ensure all reactive values are properly initialized
    nextTick(async () => {
      try {
        await handleSubmit();
      } catch (error) {
        console.error('Auto-execution failed:', error);
      }
    });
  }
});
</script>

<style scoped>
.container {
  padding: 0 20px;
  margin: 0 auto;
  max-width: 960px;
}

.try-it-container {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  padding: 24px;
}
</style>

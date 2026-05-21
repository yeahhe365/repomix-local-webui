<script setup lang="ts">
import { AlertTriangle, FolderOpen } from 'lucide-vue-next';
import { useFileUpload } from '../../composables/useFileUpload';
import { useZipProcessor } from '../../composables/useZipProcessor';
import PackButton from './PackButton.vue';
import { useHomeUiText } from './useHomeUiText';

defineProps<{
  loading: boolean;
  showButton?: boolean;
}>();

const emit = defineEmits<{
  upload: [file: File];
  cancel: [];
}>();

const uiText = useHomeUiText();

const { createZipFromFiles } = useZipProcessor({
  failedToCreateZip: (message) => uiText.value.errors.failedToCreateZip(message),
  uploadZipFile: uiText.value.errors.uploadZipFile,
  unknownError: uiText.value.errors.unknownError,
});

const {
  fileInput,
  dragActive,
  selectedItem: selectedFolder,
  errorMessage,
  hasError,
  isValid,
  inputAttributes,
  handleFileSelect,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  triggerFileInput,
  clearSelection,
} = useFileUpload({
  mode: 'folder',
  placeholder: uiText.value.upload.folderPlaceholder,
  icon: 'folder',
  options: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    webkitdirectory: true,
    validateFiles: (files: File[]) => {
      if (files.length === 0) {
        return { valid: false, error: uiText.value.errors.folderEmpty };
      }
      return { valid: true };
    },
    preprocessFiles: async (files: File[], folderName?: string) => {
      if (!folderName) {
        throw new Error(uiText.value.errors.folderNameRequired);
      }
      return await createZipFromFiles(files, folderName);
    },
  },
  messages: {
    invalidFileType: (acceptedTypes) => uiText.value.errors.invalidFileType(acceptedTypes),
    fileTooLarge: (sizeMB, limitMB) => uiText.value.errors.fileTooLarge(sizeMB, limitMB),
    totalSizeTooLarge: (sizeMB, limitMB) => uiText.value.errors.totalSizeTooLarge(sizeMB, limitMB),
    noFilesFound: uiText.value.errors.noFilesFound,
    validationFailed: uiText.value.errors.validationFailed,
    multipleFilesNeedPreprocessor: uiText.value.errors.multipleFilesNeedPreprocessor,
    processingFailed: uiText.value.errors.processingFailed,
    noFilesSelected: uiText.value.errors.noFilesSelected,
    noItemsFound: uiText.value.errors.noItemsFound,
    folderDropUnsupported: uiText.value.errors.folderDropUnsupported,
    dropFolderNotFile: uiText.value.errors.dropFolderNotFile,
    failedToProcessFolder: uiText.value.errors.failedToProcessFolder,
    directoryTooDeep: (maxDepth) => uiText.value.errors.directoryTooDeep(maxDepth),
    tooManyFiles: (maxFiles) => uiText.value.errors.tooManyFiles(maxFiles),
  },
});

async function onFileSelect(files: FileList | null) {
  const result = await handleFileSelect(files);
  if (result.success && result.result) {
    emit('upload', result.result);
  }
}

async function onDrop(event: DragEvent) {
  const result = await handleDrop(event);
  if (result.success && result.result) {
    emit('upload', result.result);
  }
}

function clearFolder() {
  clearSelection();
}
</script>

<template>
  <div class="upload-wrapper">
    <div
      class="upload-container"
      :class="{ 'drag-active': dragActive, 'has-error': hasError }"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @drop.prevent="onDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        v-bind="inputAttributes"
        class="hidden-input"
        @change="(e) => onFileSelect((e.target as HTMLInputElement).files)"
      />
      <div class="upload-content">
        <div class="upload-icon">
          <AlertTriangle v-if="hasError" class="icon-error" size="20" />
          <FolderOpen v-else class="icon-folder" size="20" />
        </div>
        <div class="upload-text">
          <p v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </p>
          <p v-else-if="selectedFolder" class="selected-file">
            {{ uiText.upload.selectedPrefix }} {{ selectedFolder }}
            <button class="clear-button" @click.stop="clearFolder">×</button>
          </p>
          <template v-else>
            <p>{{ uiText.upload.folderPlaceholder }}</p>
          </template>
        </div>
      </div>
    </div>
  </div>
  <div v-if="showButton" class="pack-button-container">
    <PackButton
      :loading="loading"
      :isValid="isValid"
      @cancel="$emit('cancel')"
    />
  </div>
</template>

<style scoped src="./TryItUploadInput.css"></style>

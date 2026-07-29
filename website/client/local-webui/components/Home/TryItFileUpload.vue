<script setup lang="ts">
import { AlertTriangle, FolderArchive } from 'lucide-vue-next';
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

const { validateZipFile } = useZipProcessor({
  failedToCreateZip: (message) => uiText.value.errors.failedToCreateZip(message),
  uploadZipFile: uiText.value.errors.uploadZipFile,
  unknownError: uiText.value.errors.unknownError,
});

const {
  fileInput,
  dragActive,
  selectedItem: selectedFile,
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
  mode: 'file',
  placeholder: uiText.value.upload.zipPlaceholder,
  icon: 'file',
  options: {
    acceptedTypes: ['.zip'],
    accept: '.zip',
    validateFile: validateZipFile,
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

function clearFile() {
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
          <FolderArchive v-else class="icon-folder" size="20" />
        </div>
        <div class="upload-text">
          <p v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </p>
          <p v-else-if="selectedFile" class="selected-file">
            {{ uiText.upload.selectedPrefix }} {{ selectedFile }}
            <button class="clear-button" @click.stop="clearFile">×</button>
          </p>
          <template v-else>
            <p>{{ uiText.upload.zipPlaceholder }}</p>
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

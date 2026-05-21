<template>
  <div class="file-selection-container">
    <div class="file-selection-header">
      <h3 class="file-selection-title">
        <FileText :size="16" class="title-icon" />
        {{ uiText.fileSelection.title }}
      </h3>
      <div class="file-selection-actions">
        <button
          type="button"
          class="action-btn select-all"
          @click="selectAll"
          :disabled="!hasFiles"
          :aria-label="uiText.fileSelection.selectAllAria"
        >
          {{ uiText.fileSelection.selectAll }}
        </button>
        <button
          type="button"
          class="action-btn deselect-all"
          @click="deselectAll"
          :disabled="!hasFiles"
          :aria-label="uiText.fileSelection.deselectAllAria"
        >
          {{ uiText.fileSelection.deselectAll }}
        </button>
        <button
          type="button"
          class="action-btn repack"
          @click="handleRepack"
          :disabled="!hasSelectedFiles || loading"
          :aria-label="loading ? uiText.fileSelection.repacking : uiText.fileSelection.repackSelectedAria(selectedFiles.length)"
        >
          {{ loading ? uiText.fileSelection.repacking : uiText.fileSelection.repackSelected }}
          <PackIcon v-if="!loading" :size="14" />
        </button>
      </div>
    </div>

    <div class="file-selection-stats">
      <span class="stat-item">
        {{ uiText.fileSelection.selectedFilesSummary(selectedFiles.length, allFiles.length) }}
      </span>
      <span class="stat-separator">|</span>
      <span class="stat-item">
        {{ uiText.fileSelection.selectedCharsSummary(selectedChars, totalChars) }}
      </span>
    </div>

    <div class="file-list-container">
      <div class="file-list-scroll">
        <table class="file-table" :aria-label="uiText.fileSelection.tableAria">
          <thead>
            <tr>
              <th class="checkbox-column">
                <input
                  type="checkbox"
                  :checked="selectedFiles.length === allFiles.length && allFiles.length > 0"
                  :indeterminate="selectedFiles.length > 0 && selectedFiles.length < allFiles.length"
                  @change="($event.target as HTMLInputElement).checked ? selectAll() : deselectAll()"
                  class="header-checkbox"
                  :aria-label="uiText.fileSelection.toggleAllFilesAria"
                />
              </th>
              <th class="file-path-column">{{ uiText.fileSelection.filePath }}</th>
              <th class="chars-column">{{ uiText.fileSelection.chars }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="file in sortedFiles"
              :key="file.path"
              class="file-row"
              :class="{ 'file-row-selected': file.selected }"
              @click="toggleFileSelection(file, $event)"
            >
              <td class="checkbox-cell">
                <input
                  type="checkbox"
                  v-model="file.selected"
                  class="file-checkbox"
                  :aria-label="uiText.fileSelection.selectFileAria(file.path)"
                />
              </td>
              <td class="file-path-cell">
                <span class="file-path">{{ file.path }}</span>
              </td>
              <td class="chars-cell">
                <span class="file-chars">{{ file.charCount.toLocaleString() }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <FileSelectionWarning
      v-if="selectedFiles.length > FILE_SELECTION_WARNING_THRESHOLD"
      :threshold="FILE_SELECTION_WARNING_THRESHOLD"
    />
  </div>
</template>

<script setup lang="ts">
import { FileText } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { FILE_SELECTION_WARNING_THRESHOLD } from '../../constants/fileSelection';
import type { FileInfo } from '../../types/api';
import FileSelectionWarning from './FileSelectionWarning.vue';
import PackIcon from './PackIcon.vue';
import { useHomeUiText } from './useHomeUiText';

interface Props {
  allFiles: FileInfo[];
  loading?: boolean;
}

type Emits = (e: 'repack', selectedFiles: FileInfo[]) => void;

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<Emits>();
const uiText = useHomeUiText();

// Local reactive state to avoid mutating props directly (Vue one-way data flow)
const localFiles = ref<FileInfo[]>([]);

// Sync props.allFiles to localFiles with deep copying to maintain reactivity
watch(
  () => props.allFiles,
  (newFiles) => {
    // Deep clone to avoid mutating props - fallback to JSON method for compatibility
    try {
      localFiles.value = structuredClone(newFiles || []);
    } catch {
      localFiles.value = JSON.parse(JSON.stringify(newFiles || []));
    }
  },
  { immediate: true },
);

const hasFiles = computed(() => localFiles.value.length > 0);

const selectedFiles = computed(() => localFiles.value.filter((file) => file.selected));

const hasSelectedFiles = computed(() => selectedFiles.value.length > 0);

const totalChars = computed(() => localFiles.value.reduce((sum, file) => sum + file.charCount, 0));

const selectedChars = computed(() => selectedFiles.value.reduce((sum, file) => sum + file.charCount, 0));

const sortedFiles = computed(() => [...localFiles.value].sort((a, b) => b.charCount - a.charCount));

const selectAll = () => {
  for (const file of localFiles.value) {
    file.selected = true;
  }
};

const deselectAll = () => {
  for (const file of localFiles.value) {
    file.selected = false;
  }
};

const handleRepack = () => {
  if (hasSelectedFiles.value) {
    emit('repack', selectedFiles.value);
  }
};

const toggleFileSelection = (file: FileInfo, event?: Event) => {
  // Prevent double-toggling when clicking directly on checkbox
  if (event?.target && (event.target as HTMLInputElement).type === 'checkbox') {
    return;
  }

  file.selected = !file.selected;
};
</script>

<style scoped src="./TryItFileSelection.css"></style>

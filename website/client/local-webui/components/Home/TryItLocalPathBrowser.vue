<script setup lang="ts">
import { Check, ChevronLeft, FolderOpen, LoaderCircle, Pencil, RefreshCw, X } from 'lucide-vue-next';
import { computed, ref, toRef, watch } from 'vue';
import { useLocalPathBrowser } from '../../composables/useLocalPathBrowser';
import { useHomeUiText } from './useHomeUiText';
import { isValidAbsolutePath } from '../../utils/tryIt/localPathInput';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  select: [path: string];
}>();

const uiText = useHomeUiText();
const rootLabel = computed(() => uiText.value.upload.localPathBrowserRoots);
const unexpectedErrorMessage = computed(() => uiText.value.errors.unexpectedError);

const {
  browserState,
  breadcrumbs,
  currentLabel,
  dialogRef,
  enterDirectory,
  error,
  handleKeydown,
  handleListScroll,
  handleOverlayClick,
  jumpToBreadcrumb,
  listRef,
  listing,
  loadParent,
  loading,
  openRecentPath,
  retry,
  searchQuery,
  selectCurrentPath,
  selectEntry,
  selectedEntry,
  selectedIndex,
  visibleEntries,
} = useLocalPathBrowser({
  open: toRef(props, 'open'),
  rootLabel,
  unexpectedErrorMessage,
  close: () => emit('update:open', false),
  select: (path) => emit('select', path),
});

// ── Direct path editing state ──
const isEditingPath = ref(false);
const pathDraft = ref('');
const pathInputError = ref(false);
const pathInputRef = ref<HTMLInputElement | null>(null);

function startEditing() {
  if (loading.value) return;
  pathDraft.value = listing.value?.currentPath ?? '';
  pathInputError.value = false;
  isEditingPath.value = true;
  // Auto-focus & select on next tick
  setTimeout(() => {
    pathInputRef.value?.focus();
    pathInputRef.value?.select();
  }, 0);
}

function cancelPathInput() {
  isEditingPath.value = false;
  pathDraft.value = '';
  pathInputError.value = false;
}

async function applyPathInput() {
  const trimmed = pathDraft.value.trim();
  if (!trimmed) {
    cancelPathInput();
    return;
  }
  if (!isValidAbsolutePath(trimmed)) {
    pathInputError.value = true;
    return;
  }
  pathInputError.value = false;
  isEditingPath.value = false;
  await enterDirectory(trimmed);
}

function onPathInputKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.stopPropagation();
    event.preventDefault();
    applyPathInput();
  } else if (event.key === 'Escape') {
    event.stopPropagation();
    event.preventDefault();
    cancelPathInput();
  }
}

function onDialogKeydown(event: KeyboardEvent) {
  if (isEditingPath.value && event.key === 'Escape') {
    event.stopPropagation();
    cancelPathInput();
    return;
  }
  handleKeydown(event);
}

// Clear editing state when dialog closes
watch(() => props.open, (isOpen) => {
  if (!isOpen) {
    cancelPathInput();
  }
});
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="browser-overlay" @click="handleOverlayClick">
      <div
        ref="dialogRef"
        class="browser-dialog"
        role="dialog"
        aria-modal="true"
        tabindex="0"
        :aria-label="uiText.upload.localPathBrowserTitle"
        @keydown="onDialogKeydown"
      >
        <div class="browser-header">
          <div class="header-copy">
            <h3>{{ uiText.upload.localPathBrowserTitle }}</h3>
            <div v-if="!isEditingPath" class="breadcrumbs-row">
              <div v-if="breadcrumbs.length" class="breadcrumbs" :aria-label="currentLabel">
                <button
                  v-for="crumb in breadcrumbs"
                  :key="crumb.path"
                  type="button"
                  class="breadcrumb-button"
                  @click="jumpToBreadcrumb(crumb.path)"
                >
                  {{ crumb.label }}
                </button>
              </div>
              <p v-else class="root-label">{{ currentLabel }}</p>
              <button
                type="button"
                class="breadcrumb-edit-button icon-button"
                :disabled="loading"
                :aria-label="uiText.upload.breadcrumbEditAria"
                :title="uiText.upload.breadcrumbEditAria"
                @click="startEditing"
              >
                <Pencil :size="14" />
              </button>
            </div>
            <div v-else class="path-direct-row">
              <input
                ref="pathInputRef"
                v-model="pathDraft"
                type="text"
                class="path-direct-input"
                :class="{ 'is-invalid': pathInputError }"
                :placeholder="uiText.upload.pathDirectPlaceholder"
                :readonly="loading"
                @keydown="onPathInputKeydown"
              />
              <button
                type="button"
                class="path-direct-apply icon-button"
                :disabled="loading"
                :aria-label="uiText.upload.pathDirectApplyAria"
                :title="uiText.upload.pathDirectApplyAria"
                @click="applyPathInput"
              >
                <Check :size="16" />
              </button>
              <button
                type="button"
                class="path-direct-cancel icon-button"
                :disabled="loading"
                :aria-label="uiText.upload.pathDirectCancelAria"
                :title="uiText.upload.pathDirectCancelAria"
                @click="cancelPathInput"
              >
                <X :size="16" />
              </button>
              <p v-if="pathInputError" class="path-direct-error">{{ uiText.upload.invalidLocalPath }}</p>
            </div>
          </div>
          <button type="button" class="icon-button" :aria-label="uiText.upload.localPathBrowserClose" @click="emit('update:open', false)">
            <X :size="18" />
          </button>
        </div>

        <div class="browser-actions">
          <button type="button" class="secondary-button" @click="loadParent" :disabled="loading">
            <ChevronLeft :size="16" />
            <span>{{ uiText.upload.localPathBrowserBack }}</span>
          </button>
        </div>

        <div class="browser-search">
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            :placeholder="uiText.upload.localPathBrowserSearchPlaceholder"
          />
        </div>

        <div v-if="browserState.recentPaths.length" class="recent-section">
          <p class="recent-title">{{ uiText.upload.localPathBrowserRecentTitle }}</p>
          <div class="recent-list">
            <button
              v-for="recentPath in browserState.recentPaths"
              :key="recentPath"
              type="button"
              class="recent-chip"
              @click="openRecentPath(recentPath)"
            >
              {{ recentPath }}
            </button>
          </div>
        </div>

        <div v-if="loading" class="browser-state">
          <LoaderCircle :size="18" class="spin" />
          <span>{{ uiText.upload.localPathBrowserLoading }}</span>
        </div>

        <div v-else-if="error" class="browser-state browser-error">
          <p>{{ error }}</p>
          <button type="button" class="secondary-button" @click="retry">
            <RefreshCw :size="16" />
            <span>{{ uiText.upload.localPathBrowserRetry }}</span>
          </button>
        </div>

        <ul v-else ref="listRef" class="directory-list" @scroll="handleListScroll">
          <li v-if="!listing?.entries.length" class="empty-state">
            {{ uiText.upload.localPathBrowserEmpty }}
          </li>
          <li v-for="(entry, index) in visibleEntries" :key="entry.path">
            <button
              type="button"
              class="directory-button"
              :class="{ selected: index === selectedIndex }"
              @click="selectEntry(index)"
              @dblclick="enterDirectory(entry.path)"
            >
              <FolderOpen :size="18" />
              <span class="directory-name">{{ entry.name }}</span>
            </button>
          </li>
        </ul>

        <div class="browser-footer">
          <div class="footer-copy">
            <p class="selected-path">
              {{ selectedEntry?.path ?? listing?.currentPath ?? currentLabel }}
            </p>
            <p class="keyboard-hint">{{ uiText.upload.localPathBrowserKeyboardHint }}</p>
          </div>
          <button
            type="button"
            class="primary-button footer-button"
            @click="selectCurrentPath"
            :disabled="loading || !listing?.currentPath"
          >
            {{ uiText.upload.localPathBrowserSelectCurrent }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped src="./TryItLocalPathBrowser.css"></style>

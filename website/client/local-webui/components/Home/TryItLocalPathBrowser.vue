<script setup lang="ts">
import { ChevronLeft, FolderOpen, LoaderCircle, RefreshCw, X } from 'lucide-vue-next';
import { computed, toRef } from 'vue';
import { useLocalPathBrowser } from '../../composables/useLocalPathBrowser';
import { useHomeUiText } from './useHomeUiText';

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
        @keydown="handleKeydown"
      >
        <div class="browser-header">
          <div class="header-copy">
            <h3>{{ uiText.upload.localPathBrowserTitle }}</h3>
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

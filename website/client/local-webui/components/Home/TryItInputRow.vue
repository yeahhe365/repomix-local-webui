<script setup lang="ts">
import { ChevronDown, FolderArchive, FolderOpen, Link2 } from 'lucide-vue-next';
import { onMounted, onUnmounted, ref } from 'vue';
import type { InputMode } from '../../types/tryIt';
import PackButton from './PackButton.vue';
import TryItFileUpload from './TryItFileUpload.vue';
import TryItLocalPathInput from './TryItLocalPathInput.vue';
import TryItUrlInput from './TryItUrlInput.vue';
import { useHomeUiText } from './useHomeUiText';

defineProps<{
  mode: InputMode;
  url: string;
  localPath: string;
  loading: boolean;
  isSubmitValid: boolean;
  shouldShowReset: boolean;
}>();

const emit = defineEmits<{
  'update:mode': [value: InputMode];
  'update:url': [value: string];
  'update:localPath': [value: string];
  upload: [file: File];
  keydown: [event: KeyboardEvent];
  submit: [];
  reset: [];
  cancel: [];
  'pack-download': [];
}>();

const uiText = useHomeUiText();

function setMode(mode: InputMode) {
  emit('update:mode', mode);
}

// Split dropdown state + outside-click handling.
const splitRef = ref<HTMLDetailsElement | null>(null);

function closeSplitMenu() {
  if (splitRef.value) {
    splitRef.value.open = false;
  }
}

function onPackDownload() {
  emit('pack-download');
  closeSplitMenu();
}

function handleOutsideClick(event: MouseEvent) {
  if (splitRef.value && !splitRef.value.contains(event.target as Node)) {
    closeSplitMenu();
  }
}

// Keyboard shortcuts: Ctrl/Cmd+Enter to submit, Esc to cancel while loading.
function handleGlobalKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    if (!event.defaultPrevented) {
      event.preventDefault();
    }
    emit('submit');
    return;
  }

  if (event.key === 'Escape') {
    closeSplitMenu();
    emit('cancel');
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleOutsideClick);
  window.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleOutsideClick);
  window.removeEventListener('keydown', handleGlobalKeydown);
});
</script>

<template>
  <div>
    <div class="input-row">
      <div class="segmented" role="tablist" :aria-label="uiText.upload.localPathBrowserRoots">
        <button
          type="button"
          class="segmented__item"
          :class="{ 'is-active': mode === 'url' }"
          role="tab"
          :aria-selected="mode === 'url'"
          :title="uiText.upload.modeHints.url"
          @click="setMode('url')"
        >
          <Link2 :size="16" />
          <span class="segmented__label">{{ uiText.upload.modeLabels.url }}</span>
        </button>
        <button
          type="button"
          class="segmented__item"
          :class="{ 'is-active': mode === 'localPath' }"
          role="tab"
          :aria-selected="mode === 'localPath'"
          :title="uiText.upload.modeHints.localPath"
          @click="setMode('localPath')"
        >
          <FolderOpen :size="16" />
          <span class="segmented__label">{{ uiText.upload.modeLabels.localPath }}</span>
        </button>
        <button
          type="button"
          class="segmented__item"
          :class="{ 'is-active': mode === 'file' }"
          role="tab"
          :aria-selected="mode === 'file'"
          :title="uiText.upload.modeHints.file"
          @click="setMode('file')"
        >
          <FolderArchive :size="16" />
          <span class="segmented__label">{{ uiText.upload.modeLabels.file }}</span>
        </button>
      </div>

      <div class="input-field">
        <TryItFileUpload v-if="mode === 'file'" @upload="emit('upload', $event)" :loading="loading" :show-button="false" />
        <TryItLocalPathInput
          v-else-if="mode === 'localPath'"
          :path="localPath"
          :loading="loading"
          @update:path="emit('update:localPath', $event)"
          @keydown="emit('keydown', $event)"
          @submit="emit('submit')"
          :show-button="false"
        />
        <TryItUrlInput
          v-else
          :url="url"
          :loading="loading"
          @update:url="emit('update:url', $event)"
          @keydown="emit('keydown', $event)"
          @submit="emit('submit')"
          :show-button="false"
        />
      </div>

      <div class="pack-split">
        <PackButton :loading="loading" :isValid="isSubmitValid" @cancel="emit('cancel')" />
        <details class="split-menu" ref="splitRef">
          <summary class="split-trigger" :aria-label="uiText.actions.moreActions" :title="uiText.actions.moreActions">
            <ChevronDown :size="16" />
          </summary>
          <div class="split-menu__panel">
            <button
              type="button"
              class="split-menu__item"
              :disabled="loading || !isSubmitValid"
              :title="uiText.actions.packDownloadTooltip"
              @click="onPackDownload"
            >
              {{ uiText.actions.packDownload }}
            </button>
          </div>
        </details>
      </div>
    </div>

    <div class="input-footer">
      <span class="kbd-hint">{{ uiText.actions.submitHint }}</span>
      <button v-if="shouldShowReset" type="button" class="reset-link" @click="emit('reset')">
        {{ uiText.actions.clear }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.input-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--amc-space-3, 12px);
  margin-bottom: var(--amc-space-2, 8px);
  align-items: start;
}

/* Segmented control — Linear-style. A single rounded container with dividers
 * between items; the active item gets a subtle fill + accent text. */
.segmented {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--amc-border, var(--vp-c-border));
  border-radius: var(--amc-radius, 6px);
  background: var(--amc-surface-muted, var(--vp-c-bg-soft));
}

.segmented__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: var(--amc-control-h-sm, 32px);
  padding: 0 var(--amc-space-3, 12px);
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--amc-text-muted, var(--vp-c-text-2));
  font-size: var(--amc-text-sm, 13px);
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--amc-transition, 0.15s ease), color var(--amc-transition, 0.15s ease);
  white-space: nowrap;
}

.segmented__item:hover:not(.is-active) {
  color: var(--amc-text, var(--vp-c-text-1));
}

.segmented__item.is-active {
  background: var(--amc-surface, var(--vp-c-bg));
  color: var(--amc-text, var(--vp-c-text-1));
  box-shadow: var(--amc-shadow-sm, 0 1px 2px rgb(0 0 0 / 0.04));
}

.input-field {
  align-self: stretch;
  min-width: 0;
  flex: 1;
  overflow: hidden;
}

.pack-split {
  display: inline-flex;
  align-items: stretch;
  align-self: stretch;
  flex-shrink: 0;
  position: relative;
}

/* Rounded-left modifier applied to the PackButton without changing PackButton.vue itself. */
.pack-split :deep(.pack-button) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.split-menu {
  position: relative;
}

.split-menu > summary {
  list-style: none;
}
.split-menu > summary::-webkit-details-marker {
  display: none;
}

.split-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: var(--amc-control-h, 40px);
  border: 1px solid var(--amc-accent, var(--vp-c-brand-1));
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-top-right-radius: var(--amc-radius, 6px);
  border-bottom-right-radius: var(--amc-radius, 6px);
  background: var(--amc-accent, var(--vp-c-brand-1));
  color: var(--amc-accent-on, #fff);
  cursor: pointer;
  transition: background-color var(--amc-transition-slow, 0.2s ease), border-color var(--amc-transition-slow, 0.2s ease);
  /* 1px inner divider between the two halves (avoids border-left width jitter). */
  box-shadow: inset 1px 0 0 color-mix(in srgb, #fff 30%, transparent);
}

/* Unified hover for both halves; skip the loading state so the Cancel-hover (red) still applies. */
.pack-split:hover :deep(.pack-button:not(.pack-button--loading):not(:disabled)),
.pack-split:hover .split-trigger {
  background: var(--amc-accent-hover, var(--vp-c-brand-2));
  border-color: var(--amc-accent-hover, var(--vp-c-brand-2));
}

.split-menu__panel {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  min-width: 180px;
  padding: var(--amc-space-1, 4px);
  border: 1px solid var(--amc-border, var(--vp-c-border));
  border-radius: var(--amc-radius, 6px);
  background: var(--amc-surface, var(--vp-c-bg));
  box-shadow: var(--amc-shadow, 0 4px 12px rgb(0 0 0 / 0.12));
  z-index: 20;
}

.split-menu__item {
  display: block;
  width: 100%;
  padding: var(--amc-space-2, 8px) var(--amc-space-3, 12px);
  border: none;
  border-radius: var(--amc-radius-sm, 4px);
  background: transparent;
  color: var(--amc-text, var(--vp-c-text-1));
  font-size: var(--amc-text-sm, 13px);
  text-align: left;
  cursor: pointer;
  transition: background-color var(--amc-transition, 0.15s ease), color var(--amc-transition, 0.15s ease);
}

.split-menu__item:hover:not(:disabled) {
  background: var(--amc-surface-muted, var(--vp-c-bg-soft));
  color: var(--amc-accent, var(--vp-c-brand-1));
}

.split-menu__item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: -8px;
  margin-bottom: var(--amc-space-3, 12px);
  gap: var(--amc-space-2, 8px);
}

.kbd-hint {
  font-size: var(--amc-text-xs, 12px);
  color: var(--amc-text-subtle, var(--vp-c-text-3));
}

.reset-link {
  border: none;
  background: transparent;
  padding: 0;
  font-size: var(--amc-text-xs, 12px);
  color: var(--amc-text-subtle, var(--vp-c-text-3));
  cursor: pointer;
  transition: color var(--amc-transition, 0.15s ease);
}

.reset-link:hover {
  color: var(--amc-accent, var(--vp-c-brand-1));
}

@media (max-width: 768px) {
  .input-row {
    grid-template-columns: 1fr;
    gap: var(--amc-space-3, 12px);
  }

  .segmented {
    width: 100%;
    justify-content: space-between;
  }

  .segmented__item {
    flex: 1;
    justify-content: center;
  }

  .pack-split {
    width: 100%;
  }

  .pack-split :deep(.pack-button) {
    flex: 1;
  }
}
</style>

<script setup lang="ts">
import { Download, FolderArchive, FolderOpen, Link2 } from 'lucide-vue-next';
import { onMounted, onUnmounted } from 'vue';
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

// Keyboard shortcuts
function handleGlobalKeydown(event: KeyboardEvent) {
  const mod = event.ctrlKey || event.metaKey;

  // Ctrl+Shift+Enter → pack & download (check first to avoid double-handling)
  if (mod && event.shiftKey && event.key === 'Enter') {
    event.preventDefault();
    emit('pack-download');
    return;
  }

  // Ctrl+Enter → pack
  if (mod && event.key === 'Enter') {
    if (!event.defaultPrevented) {
      event.preventDefault();
    }
    emit('submit');
    return;
  }

  if (event.key === 'Escape') {
    emit('cancel');
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
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

      <div class="pack-actions">
        <PackButton :loading="loading" :isValid="isSubmitValid" @cancel="emit('cancel')" />
        <button
          type="button"
          class="pack-download-button"
          :disabled="loading || !isSubmitValid"
          :aria-label="uiText.actions.packDownloadAria"
          :title="uiText.actions.packDownloadTooltip"
          @click="emit('pack-download')"
        >
          <Download :size="16" />
          <span class="pack-download-button__label">{{ uiText.actions.packDownload }}</span>
        </button>
      </div>
    </div>

    <div class="input-footer">
      <span class="kbd-hint">{{ uiText.actions.submitHint }} · {{ uiText.actions.submitHintDownload }}</span>
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
  margin-bottom: var(--amc-space-1, 4px);
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
  background: var(--amc-surface-raised, var(--vp-c-bg-elv));
  color: var(--amc-text, var(--vp-c-text-1));
  box-shadow: var(--amc-shadow-sm, 0 1px 2px rgb(0 0 0 / 0.04));
}

.input-field {
  align-self: stretch;
  min-width: 0;
  flex: 1;
  overflow: hidden;
}

.pack-actions {
  display: inline-flex;
  align-items: stretch;
  align-self: stretch;
  flex-shrink: 0;
  gap: var(--amc-space-2, 8px);
}

.pack-download-button {
  display: inline-flex;
  align-items: center;
  gap: var(--amc-space-2, 8px);
  height: var(--amc-control-h, 40px);
  padding: 0 var(--amc-space-3, 12px);
  border: 1px solid var(--amc-border, var(--vp-c-border));
  border-radius: var(--amc-radius, 6px);
  background: var(--amc-surface, var(--vp-c-bg));
  color: var(--amc-text, var(--vp-c-text-1));
  font-size: var(--amc-text-sm, 13px);
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color var(--amc-transition, 0.15s ease), border-color var(--amc-transition, 0.15s ease), color var(--amc-transition, 0.15s ease);
}

.pack-download-button:hover:not(:disabled) {
  background: var(--amc-surface-muted, var(--vp-c-bg-soft));
  border-color: var(--amc-text-muted, var(--vp-c-text-2));
  color: var(--amc-text, var(--vp-c-text-1));
}

.pack-download-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0;
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

  .pack-actions {
    width: 100%;
  }

  .pack-actions :deep(.pack-button),
  .pack-actions .pack-download-button {
    flex: 1;
  }
}

@media (max-width: 480px) {
  .segmented__label {
    display: none;
  }

  .segmented__item {
    padding: 0 var(--amc-space-2, 8px);
  }
}
</style>

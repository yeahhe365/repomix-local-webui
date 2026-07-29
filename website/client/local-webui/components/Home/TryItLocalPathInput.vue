<script setup lang="ts">
import { AlertTriangle, FolderOpen } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { isValidAbsolutePath } from '../../utils/tryIt/localPathInput';
import PackButton from './PackButton.vue';
import TryItLocalPathBrowser from './TryItLocalPathBrowser.vue';
import { useHomeUiText } from './useHomeUiText';

const props = defineProps<{
  path: string;
  loading: boolean;
  showButton?: boolean;
}>();

const uiText = useHomeUiText();
const browserOpen = ref(false);

const emit = defineEmits<{
  'update:path': [value: string];
  submit: [];
  keydown: [event: KeyboardEvent];
  cancel: [];
}>();

const isValidPath = computed(() => {
  if (!props.path) return false;
  return isValidAbsolutePath(props.path);
});

function handlePathInput(event: Event) {
  const input = event.target as HTMLInputElement;
  emit('update:path', input.value);
}

function handleSubmit() {
  emit('submit');
}

function handleKeydown(event: KeyboardEvent) {
  emit('keydown', event);
}

function openBrowser() {
  browserOpen.value = true;
}

function handlePathSelected(selectedPath: string) {
  emit('update:path', selectedPath);
}
</script>

<template>
  <div class="input-group">
    <div class="path-input-row">
      <div class="path-input-container">
        <input
          :value="path"
          @input="handlePathInput"
          @keydown="handleKeydown"
          type="text"
          :placeholder="uiText.upload.localPathPlaceholder"
          class="repository-input"
          :class="{ invalid: path && !isValidPath }"
          :aria-label="uiText.upload.localPathInputAria"
          autocomplete="off"
        />
      </div>
      <button
        type="button"
        class="browse-button"
        :disabled="loading"
        :aria-label="uiText.upload.browseLocalPathAria"
        @click="openBrowser"
      >
        <FolderOpen :size="16" />
        <span>{{ uiText.upload.browseLocalPath }}</span>
      </button>
    </div>

    <div v-if="path && !isValidPath" class="path-warning">
      <AlertTriangle class="warning-icon" :size="16" />
      <span>{{ uiText.upload.invalidLocalPath }}</span>
    </div>
    <TryItLocalPathBrowser v-model:open="browserOpen" @select="handlePathSelected" />
    <div v-if="showButton" class="pack-button-container">
      <PackButton :isValid="isValidPath" :loading="loading" @click="handleSubmit" @cancel="$emit('cancel')" />
    </div>
  </div>
</template>

<style scoped>
.input-group {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--amc-space-2, 8px);
}

.path-input-row {
  display: flex;
  gap: var(--amc-space-2, 8px);
  align-items: stretch;
}

.path-input-container {
  flex: 1;
  position: relative;
  height: 100%;
}

.repository-input {
  width: 100%;
  height: var(--amc-control-h, 40px);
  padding: 0 var(--amc-space-3, 12px);
  font-size: var(--amc-text-md, 15px);
  border: 1px solid var(--amc-border, var(--vp-c-border));
  border-radius: var(--amc-radius, 6px);
  background: var(--amc-surface, var(--vp-c-bg));
  color: var(--amc-text, var(--vp-c-text-1));
  transition: border-color var(--amc-transition, 0.15s ease);
}

.repository-input::placeholder {
  color: var(--amc-text-subtle, var(--vp-c-text-3));
}

.repository-input:focus {
  outline: none;
  border-color: var(--amc-accent, var(--vp-c-brand-1));
  box-shadow: 0 0 0 3px var(--amc-accent-soft, var(--vp-c-brand-soft));
}

.repository-input.invalid {
  border-color: var(--amc-danger, var(--vp-c-danger-1));
}

.browse-button {
  min-width: var(--amc-control-h-lg, 44px);
  height: var(--amc-control-h, 40px);
  border: 1px solid var(--amc-border, var(--vp-c-border));
  border-radius: var(--amc-radius, 6px);
  background: var(--amc-surface, var(--vp-c-bg));
  color: var(--amc-text, var(--vp-c-text-1));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--amc-space-1, 4px);
  padding: 0 var(--amc-space-3, 12px);
  font-size: var(--amc-text-sm, 13px);
  font-weight: 500;
  transition: border-color var(--amc-transition, 0.15s ease), background-color var(--amc-transition, 0.15s ease);
}

.browse-button:hover:not(:disabled) {
  border-color: var(--amc-accent, var(--vp-c-brand-1));
  background: var(--amc-surface-muted, var(--vp-c-bg-soft));
}

.browse-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.path-warning {
  display: flex;
  align-items: center;
  gap: var(--amc-space-1, 4px);
  color: var(--amc-warning, var(--vp-c-warning-1));
  font-size: var(--amc-text-sm, 13px);
}

.warning-icon {
  flex-shrink: 0;
  color: var(--amc-warning, var(--vp-c-warning-1));
}

.pack-button-container {
  display: flex;
  justify-content: center;
  width: 100%;
}

@media (max-width: 640px) {
  .path-input-row {
    flex-direction: column;
  }

  .browse-button {
    width: 100%;
  }
}
</style>

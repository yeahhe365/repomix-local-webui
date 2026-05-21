<script setup lang="ts">
import { FolderArchive, FolderOpen, Link2, RotateCcw } from 'lucide-vue-next';
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
}>();

const uiText = useHomeUiText();

function setMode(mode: InputMode) {
  emit('update:mode', mode);
}
</script>

<template>
  <div class="input-row">
    <div class="tab-container">
      <button type="button" :class="{ active: mode === 'url' }" @click="setMode('url')">
        <Link2 size="20" class="icon" />
      </button>
      <button type="button" :class="{ active: mode === 'localPath' }" @click="setMode('localPath')">
        <FolderOpen size="20" class="icon" />
      </button>
      <button type="button" :class="{ active: mode === 'file' }" @click="setMode('file')">
        <FolderArchive size="20" class="icon" />
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

    <div class="pack-button-wrapper">
      <PackButton :loading="loading" :isValid="isSubmitValid" @cancel="emit('cancel')" />
      <div v-if="shouldShowReset" class="tooltip-container">
        <button class="reset-button" @click="emit('reset')" type="button">
          <RotateCcw :size="20" />
        </button>
        <div class="tooltip-content">
          {{ uiText.actions.resetOptions }}
          <div class="tooltip-arrow"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  margin-bottom: 24px;
  align-items: start;
}

.tab-container {
  display: flex;
  flex-direction: row;
  width: 240px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--vp-c-border);
}

.tab-container button {
  flex: 1;
  height: 48px;
  padding: 0 16px;
  background: var(--vp-c-bg);
  cursor: pointer;
  font-size: 16px;
  white-space: nowrap;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.tab-container button:not(:first-child)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 25%;
  height: 50%;
  width: 1px;
  background-color: var(--vp-c-border);
}

.tab-container button:first-child {
  border-radius: 8px 0 0 8px;
}

.tab-container button:last-child {
  border-radius: 0 8px 8px 0;
}

.tab-container button.active {
  background: var(--vp-c-brand-1);
  color: white;
}

.tab-container button.active::before,
.tab-container button.active + button::before {
  display: none;
}

.tab-container button .icon {
  color: var(--vp-c-text-1);
}

.tab-container button.active .icon {
  color: white;
}

.input-field {
  align-self: start;
  min-width: 0;
  flex: 1;
  overflow: hidden;
}

.pack-button-wrapper {
  display: flex;
  align-items: stretch;
  align-self: start;
  flex-shrink: 0;
  gap: 8px;
}

.reset-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background: white;
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.reset-button:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-soft);
}

.tooltip-container {
  position: relative;
  display: inline-block;
}

.tooltip-content {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  padding: 8px 12px;
  background: #333;
  color: white;
  font-size: 0.875rem;
  white-space: nowrap;
  border-radius: 4px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
  z-index: 10;
}

.tooltip-container:hover .tooltip-content {
  opacity: 1;
  visibility: visible;
}

.tooltip-arrow {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 8px;
  border-style: solid;
  border-color: #333 transparent transparent transparent;
}

@media (max-width: 768px) {
  .input-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .tab-container,
  .pack-button-wrapper {
    width: 100%;
  }
}
</style>

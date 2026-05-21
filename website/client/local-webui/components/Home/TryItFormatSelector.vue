<script setup lang="ts">
import type { PackFormat } from '../../types/pack';
import { useHomeUiText } from './useHomeUiText';

defineProps<{
  format: PackFormat;
}>();

const emit = defineEmits<{
  'update:format': [value: PackFormat];
}>();

const uiText = useHomeUiText();
</script>

<template>
  <div class="option-section">
    <p class="option-label">{{ uiText.options.outputFormat }}</p>
    <div class="format-buttons">
      <button class="format-button" :class="{ active: format === 'xml' }" @click="emit('update:format', 'xml')" type="button">
        {{ uiText.options.formatNames.xml }}
      </button>
      <button
        class="format-button"
        :class="{ active: format === 'markdown' }"
        @click="emit('update:format', 'markdown')"
        type="button"
      >
        {{ uiText.options.formatNames.markdown }}
      </button>
      <button
        class="format-button"
        :class="{ active: format === 'plain' }"
        @click="emit('update:format', 'plain')"
        type="button"
      >
        {{ uiText.options.formatNames.plain }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.option-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-label {
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  color: var(--vp-c-text-2);
  padding-bottom: 4px;
}

.format-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.format-button {
  padding: 8px 16px;
  font-size: 14px;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition: all 0.2s ease;
}

.format-button:hover {
  border-color: var(--vp-c-brand-1);
}

.format-button.active {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: white;
}
</style>

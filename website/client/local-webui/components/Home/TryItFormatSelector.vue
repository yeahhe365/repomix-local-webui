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
  gap: var(--amc-space-2, 8px);
}

.format-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--amc-space-2, 8px);
}

.format-button {
  height: var(--amc-control-h-sm, 32px);
  padding: 0 var(--amc-space-3, 12px);
  font-size: var(--amc-text-sm, 13px);
  font-weight: 500;
  border: 1px solid var(--amc-border, var(--vp-c-border));
  border-radius: var(--amc-radius-sm, 6px);
  background: var(--amc-surface, var(--vp-c-bg));
  color: var(--amc-text, var(--vp-c-text-1));
  cursor: pointer;
  transition: border-color var(--amc-transition, 0.15s ease), background-color var(--amc-transition, 0.15s ease),
    color var(--amc-transition, 0.15s ease);
}

.format-button:hover:not(.active) {
  border-color: var(--amc-text-subtle, var(--vp-c-text-3));
}

.format-button.active {
  background: var(--amc-accent, var(--vp-c-brand-1));
  border-color: var(--amc-accent, var(--vp-c-brand-1));
  color: var(--amc-accent-on, #fff);
}
</style>

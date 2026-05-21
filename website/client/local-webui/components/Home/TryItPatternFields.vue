<script setup lang="ts">
import { useHomeUiText } from './useHomeUiText';

defineProps<{
  includePatterns: string;
  ignorePatterns: string;
}>();

const emit = defineEmits<{
  'update:includePatterns': [value: string];
  'update:ignorePatterns': [value: string];
}>();

const uiText = useHomeUiText();

function emitInput(event: Event, eventName: 'update:includePatterns' | 'update:ignorePatterns') {
  emit(eventName, (event.target as HTMLInputElement).value);
}
</script>

<template>
  <div class="option-section">
    <p class="option-label">
      {{ uiText.options.includePatternsPrefix }}
      <a href="https://github.com/mrmlnc/fast-glob#pattern-syntax" target="_blank" rel="noopener noreferrer">
        {{ uiText.options.globPatterns }}
      </a>
      {{ uiText.options.includePatternsSuffix }}
    </p>
    <div class="input-group">
      <input
        :value="includePatterns"
        @input="emitInput($event, 'update:includePatterns')"
        type="text"
        class="pattern-input"
        :placeholder="uiText.options.includePatternsPlaceholder"
        :aria-label="uiText.options.includePatternsAria"
      />
    </div>
  </div>

  <div class="option-section">
    <p class="option-label">{{ uiText.options.ignorePatterns }}</p>
    <div class="input-group">
      <input
        :value="ignorePatterns"
        @input="emitInput($event, 'update:ignorePatterns')"
        type="text"
        class="pattern-input"
        :placeholder="uiText.options.ignorePatternsPlaceholder"
        :aria-label="uiText.options.ignorePatternsAria"
      />
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

.option-label a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.option-label a:hover {
  text-decoration: underline;
}

.input-group {
  display: flex;
  gap: 8px;
}

.pattern-input {
  width: 100%;
  padding: 8px 12px;
  font-size: 16px;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  transition: border-color 0.2s;
}

.pattern-input:hover {
  border-color: var(--vp-c-brand-1);
}

.pattern-input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}
</style>

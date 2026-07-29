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
  font-size: var(--amc-text-sm, 13px);
  font-weight: 500;
  margin: 0;
  color: var(--amc-text-muted, var(--vp-c-text-2));
  padding-bottom: var(--amc-space-1, 4px);
}

.option-label a {
  color: var(--amc-accent, var(--vp-c-brand-1));
  text-decoration: none;
}

.option-label a:hover {
  text-decoration: underline;
}

.input-group {
  display: flex;
  gap: var(--amc-space-2, 8px);
}

.pattern-input {
  width: 100%;
  height: var(--amc-control-h-sm, 32px);
  padding: 0 var(--amc-space-3, 12px);
  font-size: var(--amc-text-sm, 13px);
  border: 1px solid var(--amc-border, var(--vp-c-border));
  border-radius: var(--amc-radius, 6px);
  background: var(--amc-surface, var(--vp-c-bg));
  color: var(--amc-text, var(--vp-c-text-1));
  transition: border-color var(--amc-transition, 0.15s ease);
}

.pattern-input::placeholder {
  color: var(--amc-text-subtle, var(--vp-c-text-3));
}

.pattern-input:hover {
  border-color: var(--amc-text-subtle, var(--vp-c-text-3));
}

.pattern-input:focus {
  outline: none;
  border-color: var(--amc-accent, var(--vp-c-brand-1));
  box-shadow: 0 0 0 3px var(--amc-accent-soft, var(--vp-c-brand-soft));
}
</style>

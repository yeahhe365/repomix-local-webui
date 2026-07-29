<script setup lang="ts">
import { computed } from 'vue';
import { useHomeUiText } from './useHomeUiText';

const props = withDefaults(
  defineProps<{
    fileSummary: boolean;
    directoryStructure: boolean;
    removeComments: boolean;
    removeEmptyLines: boolean;
    showLineNumbers: boolean;
    outputParsable: boolean;
    compress: boolean;
    variant?: 'default' | 'output' | 'content';
  }>(),
  {
    variant: 'default',
  },
);

const emit = defineEmits<{
  'update:fileSummary': [value: boolean];
  'update:directoryStructure': [value: boolean];
  'update:removeComments': [value: boolean];
  'update:removeEmptyLines': [value: boolean];
  'update:showLineNumbers': [value: boolean];
  'update:outputParsable': [value: boolean];
  'update:compress': [value: boolean];
}>();

const uiText = useHomeUiText();

function checked(event: Event) {
  return (event.target as HTMLInputElement).checked;
}

interface ToggleDef {
  key: 'fileSummary' | 'directoryStructure' | 'showLineNumbers' | 'outputParsable' | 'compress' | 'removeComments' | 'removeEmptyLines';
  label: string;
  hint: string;
  emitName:
    | 'update:fileSummary'
    | 'update:directoryStructure'
    | 'update:showLineNumbers'
    | 'update:outputParsable'
    | 'update:compress'
    | 'update:removeComments'
    | 'update:removeEmptyLines';
}

// Group toggles per the spec: output options vs content processing.
const outputToggles = computed<ToggleDef[]>(() => [
  {
    key: 'fileSummary',
    label: uiText.value.options.includeFileSummary,
    hint: uiText.value.options.hints.fileSummary,
    emitName: 'update:fileSummary',
  },
  {
    key: 'directoryStructure',
    label: uiText.value.options.includeDirectoryStructure,
    hint: uiText.value.options.hints.directoryStructure,
    emitName: 'update:directoryStructure',
  },
  {
    key: 'showLineNumbers',
    label: uiText.value.options.showLineNumbers,
    hint: uiText.value.options.hints.showLineNumbers,
    emitName: 'update:showLineNumbers',
  },
  {
    key: 'outputParsable',
    label: uiText.value.options.outputParsableFormat,
    hint: uiText.value.options.hints.outputParsable,
    emitName: 'update:outputParsable',
  },
]);

const contentToggles = computed<ToggleDef[]>(() => [
  {
    key: 'compress',
    label: uiText.value.options.compressCode,
    hint: uiText.value.options.hints.compress,
    emitName: 'update:compress',
  },
  {
    key: 'removeComments',
    label: uiText.value.options.removeComments,
    hint: uiText.value.options.hints.removeComments,
    emitName: 'update:removeComments',
  },
  {
    key: 'removeEmptyLines',
    label: uiText.value.options.removeEmptyLines,
    hint: uiText.value.options.hints.removeEmptyLines,
    emitName: 'update:removeEmptyLines',
  },
]);

const visibleToggles = computed(() => {
  if (props.variant === 'output') return outputToggles.value;
  if (props.variant === 'content') return contentToggles.value;
  return [...outputToggles.value, ...contentToggles.value];
});
</script>

<template>
  <div class="checkbox-group">
    <label v-for="toggle in visibleToggles" :key="toggle.key" class="checkbox-item">
      <label class="checkbox-label">
        <input
          :checked="props[toggle.key]"
          @change="emit(toggle.emitName, checked($event))"
          type="checkbox"
          class="checkbox-input"
        />
        <span>{{ toggle.label }}</span>
      </label>
      <p class="checkbox-hint">{{ toggle.hint }}</p>
    </label>
  </div>
</template>

<style scoped>
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: var(--amc-space-2, 8px);
}

.checkbox-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--amc-space-2, 8px);
  cursor: pointer;
  font-size: var(--amc-text-sm, 13px);
  color: var(--amc-text, var(--vp-c-text-1));
}

.checkbox-input {
  width: 15px;
  height: 15px;
  accent-color: var(--amc-accent, var(--vp-c-brand-1));
  flex-shrink: 0;
}

.checkbox-hint {
  margin: 0 0 0 23px;
  font-size: var(--amc-text-xs, 12px);
  color: var(--amc-text-subtle, var(--vp-c-text-3));
  line-height: 1.4;
}
</style>

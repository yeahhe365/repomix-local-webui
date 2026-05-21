<script setup lang="ts">
import { HelpCircle } from 'lucide-vue-next';
import { useHomeUiText } from './useHomeUiText';

defineProps<{
  fileSummary: boolean;
  directoryStructure: boolean;
  removeComments: boolean;
  removeEmptyLines: boolean;
  showLineNumbers: boolean;
  outputParsable: boolean;
  compress: boolean;
}>();

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
</script>

<template>
  <div class="option-section">
    <p class="option-label">{{ uiText.options.outputFormatOptions }}</p>
    <div class="checkbox-group">
      <label class="checkbox-label">
        <input
          :checked="fileSummary"
          @change="emit('update:fileSummary', checked($event))"
          type="checkbox"
          class="checkbox-input"
        />
        <span>{{ uiText.options.includeFileSummary }}</span>
      </label>
      <label class="checkbox-label">
        <input
          :checked="directoryStructure"
          @change="emit('update:directoryStructure', checked($event))"
          type="checkbox"
          class="checkbox-input"
        />
        <span>{{ uiText.options.includeDirectoryStructure }}</span>
      </label>
      <label class="checkbox-label">
        <input
          :checked="showLineNumbers"
          @change="emit('update:showLineNumbers', checked($event))"
          type="checkbox"
          class="checkbox-input"
        />
        <span>{{ uiText.options.showLineNumbers }}</span>
      </label>
      <label class="checkbox-label">
        <input
          :checked="outputParsable"
          @change="emit('update:outputParsable', checked($event))"
          type="checkbox"
          class="checkbox-input"
        />
        <div class="parsable-option">
          <span>{{ uiText.options.outputParsableFormat }}</span>
          <div class="tooltip-container">
            <HelpCircle :size="16" class="help-icon" :aria-label="uiText.options.outputParsableInfoAria" />
            <div class="tooltip-content">
              {{ uiText.options.outputParsableHelp }}
              <div class="tooltip-arrow"></div>
            </div>
          </div>
        </div>
      </label>
    </div>
  </div>

  <div class="option-section">
    <p class="option-label">{{ uiText.options.fileProcessingOptions }}</p>
    <div class="checkbox-group">
      <label class="checkbox-label">
        <input :checked="compress" @change="emit('update:compress', checked($event))" type="checkbox" class="checkbox-input" />
        <div class="option-with-tooltip">
          <span>{{ uiText.options.compressCode }}</span>
          <div class="tooltip-container">
            <HelpCircle :size="16" class="help-icon" :aria-label="uiText.options.compressInfoAria" />
            <div class="tooltip-content">
              {{ uiText.options.compressHelp }}
              <div class="tooltip-arrow"></div>
            </div>
          </div>
        </div>
      </label>
      <label class="checkbox-label">
        <input
          :checked="removeComments"
          @change="emit('update:removeComments', checked($event))"
          type="checkbox"
          class="checkbox-input"
        />
        <span>{{ uiText.options.removeComments }}</span>
      </label>
      <label class="checkbox-label">
        <input
          :checked="removeEmptyLines"
          @change="emit('update:removeEmptyLines', checked($event))"
          type="checkbox"
          class="checkbox-input"
        />
        <span>{{ uiText.options.removeEmptyLines }}</span>
      </label>
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

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--vp-c-text-1);
}

.checkbox-input {
  width: 16px;
  height: 16px;
  accent-color: var(--vp-c-brand-1);
}

.option-with-tooltip,
.parsable-option {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tooltip-container {
  position: relative;
  display: inline-block;
}

.help-icon {
  color: #666;
  cursor: help;
  transition: color 0.2s;
}

.help-icon:hover {
  color: #333;
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
  width: 250px;
  border-radius: 4px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
  z-index: 10;
  text-align: left;
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
</style>

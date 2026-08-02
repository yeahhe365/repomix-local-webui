<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import type { PackFormat } from '../../types/pack';
import { DEFAULT_PACK_OPTIONS, type PackOptions } from '../../types/pack';
import { AnalyticsAction } from '../../utils/tryIt/analytics';
import { handleOptionChange } from '../../utils/tryIt/requestHandlers';
import TryItFormatSelector from './TryItFormatSelector.vue';
import TryItOptionToggles from './TryItOptionToggles.vue';
import TryItPatternFields from './TryItPatternFields.vue';
import { useHomeUiText } from './useHomeUiText';

const props = defineProps<{
  format: PackFormat;
  includePatterns: string;
  ignorePatterns: string;
  fileSummary: boolean;
  directoryStructure: boolean;
  removeComments: boolean;
  removeEmptyLines: boolean;
  showLineNumbers: boolean;
  outputParsable: boolean;
  compress: boolean;
}>();

const emit = defineEmits<{
  'update:format': [value: PackFormat];
  'update:includePatterns': [value: string];
  'update:ignorePatterns': [value: string];
  'update:fileSummary': [value: boolean];
  'update:directoryStructure': [value: boolean];
  'update:removeComments': [value: boolean];
  'update:removeEmptyLines': [value: boolean];
  'update:showLineNumbers': [value: boolean];
  'update:outputParsable': [value: boolean];
  'update:compress': [value: boolean];
}>();

const uiText = useHomeUiText();
const expanded = ref(false);

// Count how many pack options differ from their defaults — drives the header summary badge.
// `format` is shown separately via formatLabel, so it's excluded from the customization count.
const customCount = computed(() => {
  const options: PackOptions = {
    format: props.format,
    removeComments: props.removeComments,
    removeEmptyLines: props.removeEmptyLines,
    showLineNumbers: props.showLineNumbers,
    fileSummary: props.fileSummary,
    directoryStructure: props.directoryStructure,
    includePatterns: props.includePatterns,
    ignorePatterns: props.ignorePatterns,
    outputParsable: props.outputParsable,
    compress: props.compress,
  };

  return (Object.keys(DEFAULT_PACK_OPTIONS) as Array<keyof PackOptions>).reduce((count, key) => {
    if (key === 'format') return count;
    return options[key] === DEFAULT_PACK_OPTIONS[key] ? count : count + 1;
  }, 0);
});

const formatLabel = computed(() => uiText.value.options.formatNames[props.format] ?? props.format);

function updateFormat(value: PackFormat) {
  emit('update:format', value);
  handleOptionChange(value, AnalyticsAction.FORMAT_CHANGE);
}

function updateIncludePatterns(value: string) {
  emit('update:includePatterns', value);
  handleOptionChange(value, AnalyticsAction.UPDATE_INCLUDE_PATTERNS);
}

function updateIgnorePatterns(value: string) {
  emit('update:ignorePatterns', value);
  handleOptionChange(value, AnalyticsAction.UPDATE_IGNORE_PATTERNS);
}

function updateBooleanOption(
  eventName:
    | 'update:fileSummary'
    | 'update:directoryStructure'
    | 'update:removeComments'
    | 'update:removeEmptyLines'
    | 'update:showLineNumbers'
    | 'update:outputParsable'
    | 'update:compress',
  value: boolean,
  analyticsAction: (typeof AnalyticsAction)[keyof typeof AnalyticsAction],
) {
  emit(eventName, value);
  handleOptionChange(value, analyticsAction);
}
</script>

<template>
  <div class="options-accordion" :class="{ open: expanded }">
    <button
      type="button"
      class="options-accordion__header"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <ChevronDown :size="16" class="options-accordion__chevron" />
      <span class="options-accordion__title">{{ uiText.options.accordion.title }}</span>
      <span class="options-accordion__summary">
        {{ customCount > 0 ? uiText.options.accordion.summary(formatLabel, customCount) : formatLabel }}
      </span>
    </button>

    <div
      class="options-accordion__body"
      :aria-hidden="!expanded"
      :inert="!expanded"
    >
      <div class="options-accordion__inner">
        <section class="options-section">
          <h4 class="options-section__title">{{ uiText.options.outputFormat }}</h4>
          <TryItFormatSelector :format="format" @update:format="updateFormat" />
        </section>

        <section class="options-section">
          <h4 class="options-section__title">{{ uiText.options.sections.filter }}</h4>
          <TryItPatternFields
            :include-patterns="includePatterns"
            :ignore-patterns="ignorePatterns"
            @update:include-patterns="updateIncludePatterns"
            @update:ignore-patterns="updateIgnorePatterns"
          />
        </section>

        <section class="options-section">
          <h4 class="options-section__title">{{ uiText.options.sections.outputOptions }}</h4>
          <div class="toggle-subgroup">
            <TryItOptionToggles
              :file-summary="fileSummary"
              :directory-structure="directoryStructure"
              :remove-comments="removeComments"
              :remove-empty-lines="removeEmptyLines"
              :show-line-numbers="showLineNumbers"
              :output-parsable="outputParsable"
              :compress="compress"
              variant="output"
              @update:file-summary="updateBooleanOption('update:fileSummary', $event, AnalyticsAction.TOGGLE_FILE_SUMMARY)"
              @update:directory-structure="
                updateBooleanOption('update:directoryStructure', $event, AnalyticsAction.TOGGLE_DIRECTORY_STRUCTURE)
              "
              @update:show-line-numbers="updateBooleanOption('update:showLineNumbers', $event, AnalyticsAction.TOGGLE_LINE_NUMBERS)"
              @update:output-parsable="
                updateBooleanOption('update:outputParsable', $event, AnalyticsAction.TOGGLE_OUTPUT_PARSABLE)
              "
              @update:compress="updateBooleanOption('update:compress', $event, AnalyticsAction.TOGGLE_COMPRESS)"
              @update:remove-comments="updateBooleanOption('update:removeComments', $event, AnalyticsAction.TOGGLE_REMOVE_COMMENTS)"
              @update:remove-empty-lines="
                updateBooleanOption('update:removeEmptyLines', $event, AnalyticsAction.TOGGLE_REMOVE_EMPTY_LINES)
              "
            />
          </div>
        </section>

        <section class="options-section">
          <h4 class="options-section__title">{{ uiText.options.sections.contentProcessing }}</h4>
          <div class="toggle-subgroup">
            <TryItOptionToggles
              :file-summary="fileSummary"
              :directory-structure="directoryStructure"
              :remove-comments="removeComments"
              :remove-empty-lines="removeEmptyLines"
              :show-line-numbers="showLineNumbers"
              :output-parsable="outputParsable"
              :compress="compress"
              variant="content"
              @update:file-summary="updateBooleanOption('update:fileSummary', $event, AnalyticsAction.TOGGLE_FILE_SUMMARY)"
              @update:directory-structure="
                updateBooleanOption('update:directoryStructure', $event, AnalyticsAction.TOGGLE_DIRECTORY_STRUCTURE)
              "
              @update:show-line-numbers="updateBooleanOption('update:showLineNumbers', $event, AnalyticsAction.TOGGLE_LINE_NUMBERS)"
              @update:output-parsable="
                updateBooleanOption('update:outputParsable', $event, AnalyticsAction.TOGGLE_OUTPUT_PARSABLE)
              "
              @update:compress="updateBooleanOption('update:compress', $event, AnalyticsAction.TOGGLE_COMPRESS)"
              @update:remove-comments="updateBooleanOption('update:removeComments', $event, AnalyticsAction.TOGGLE_REMOVE_COMMENTS)"
              @update:remove-empty-lines="
                updateBooleanOption('update:removeEmptyLines', $event, AnalyticsAction.TOGGLE_REMOVE_EMPTY_LINES)
              "
            />
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.options-accordion {
  border: 1px solid var(--amc-border, var(--vp-c-border));
  border-radius: var(--amc-radius, 6px);
  background: var(--amc-surface-muted, var(--vp-c-bg-soft));
  margin-bottom: var(--amc-space-5, 20px);
  overflow: hidden;
}

.options-accordion__header {
  display: flex;
  align-items: center;
  gap: var(--amc-space-2, 8px);
  width: 100%;
  padding: var(--amc-space-3, 12px) var(--amc-space-4, 16px);
  border: none;
  background: transparent;
  color: var(--amc-text, var(--vp-c-text-1));
  font-size: var(--amc-text-sm, 13px);
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--amc-transition, 0.15s ease);
}

.options-accordion__header:hover {
  background: var(--amc-surface, var(--vp-c-bg));
}

.options-accordion__chevron {
  color: var(--amc-text-subtle, var(--vp-c-text-3));
  transition: transform var(--amc-transition-slow, 0.2s ease);
  flex-shrink: 0;
}

.options-accordion.open .options-accordion__chevron {
  transform: rotate(180deg);
}

.options-accordion__title {
  flex-shrink: 0;
}

.options-accordion__summary {
  margin-left: auto;
  font-size: var(--amc-text-xs, 12px);
  font-weight: 500;
  color: var(--amc-text-subtle, var(--vp-c-text-3));
}

/* Grid-row animation avoids measuring element height in JS. */
.options-accordion__body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--amc-transition-slow, 0.2s ease);
}

.options-accordion.open .options-accordion__body {
  grid-template-rows: 1fr;
}

.options-accordion__inner {
  overflow: hidden;
}

.options-section {
  display: flex;
  flex-direction: column;
  gap: var(--amc-space-2, 8px);
  padding: var(--amc-space-3, 12px) var(--amc-space-4, 16px) var(--amc-space-4, 16px);
  border-top: 1px solid var(--amc-border, var(--vp-c-border));
}

.options-section:first-child {
  border-top: none;
}

.options-section__title {
  margin: 0;
  font-size: var(--amc-text-xs, 12px);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--amc-text-subtle, var(--vp-c-text-3));
}

.toggle-subgroup {
  display: flex;
  flex-direction: column;
  gap: var(--amc-space-3, 12px);
}
</style>

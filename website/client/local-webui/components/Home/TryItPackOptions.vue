<script setup lang="ts">
import type { PackFormat } from '../../types/pack';
import { AnalyticsAction } from '../../utils/tryIt/analytics';
import { handleOptionChange } from '../../utils/tryIt/requestHandlers';
import TryItFormatSelector from './TryItFormatSelector.vue';
import TryItOptionToggles from './TryItOptionToggles.vue';
import TryItPatternFields from './TryItPatternFields.vue';

defineProps<{
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
  <div class="options-container">
    <div class="left-column">
      <TryItFormatSelector :format="format" @update:format="updateFormat" />
      <TryItPatternFields
        :include-patterns="includePatterns"
        :ignore-patterns="ignorePatterns"
        @update:include-patterns="updateIncludePatterns"
        @update:ignore-patterns="updateIgnorePatterns"
      />
    </div>

    <div class="right-column">
      <TryItOptionToggles
        :file-summary="fileSummary"
        :directory-structure="directoryStructure"
        :remove-comments="removeComments"
        :remove-empty-lines="removeEmptyLines"
        :show-line-numbers="showLineNumbers"
        :output-parsable="outputParsable"
        :compress="compress"
        @update:file-summary="updateBooleanOption('update:fileSummary', $event, AnalyticsAction.TOGGLE_FILE_SUMMARY)"
        @update:directory-structure="
          updateBooleanOption('update:directoryStructure', $event, AnalyticsAction.TOGGLE_DIRECTORY_STRUCTURE)
        "
        @update:remove-comments="updateBooleanOption('update:removeComments', $event, AnalyticsAction.TOGGLE_REMOVE_COMMENTS)"
        @update:remove-empty-lines="
          updateBooleanOption('update:removeEmptyLines', $event, AnalyticsAction.TOGGLE_REMOVE_EMPTY_LINES)
        "
        @update:show-line-numbers="updateBooleanOption('update:showLineNumbers', $event, AnalyticsAction.TOGGLE_LINE_NUMBERS)"
        @update:output-parsable="
          updateBooleanOption('update:outputParsable', $event, AnalyticsAction.TOGGLE_OUTPUT_PARSABLE)
        "
        @update:compress="updateBooleanOption('update:compress', $event, AnalyticsAction.TOGGLE_COMPRESS)"
      />
    </div>
  </div>
</template>

<style scoped>
.options-container {
  display: grid;
  grid-template-columns: 60% 40%;
  gap: 24px;
  margin-bottom: 24px;
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-column {
  gap: 18px;
}

@media (max-width: 640px) {
  .options-container {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .left-column,
  .right-column {
    gap: 24px;
  }
}
</style>

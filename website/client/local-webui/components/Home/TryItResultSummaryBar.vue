<script setup lang="ts">
import { computed, ref } from 'vue';
import type { PackResult } from '../../types/api';
import { formatTimestamp } from '../../utils/tryIt/resultViewer';
import TryItResultMetadata from './TryItResultMetadata.vue';
import { useHomeUiText } from './useHomeUiText';

const props = defineProps<{
  result: PackResult;
}>();

const uiText = useHomeUiText();
const expanded = ref(false);

const formatLabel = computed(
  () =>
    uiText.value.options.formatNames[props.result.format as keyof typeof uiText.value.options.formatNames] ||
    props.result.format,
);

const formattedTime = computed(() => formatTimestamp(props.result.metadata.timestamp));

// Long local paths are unreadable when tail-truncated; middle-truncate keeps both ends.
function truncateMiddle(text: string, maxLength = 48): string {
  if (text.length <= maxLength) return text;
  const half = Math.floor((maxLength - 1) / 2);
  return `${text.slice(0, half)}…${text.slice(-half)}`;
}

const repoLabel = computed(() => truncateMiddle(props.result.metadata.repository));
</script>

<template>
  <div class="summary-bar">
    <div class="summary-bar__info">
      <span class="repo" :title="result.metadata.repository">{{ repoLabel }}</span>
      <span class="sep">·</span>
      <span>{{ result.metadata.summary.totalFiles.toLocaleString() }} {{ uiText.result.filesUnit }}</span>
      <span class="sep">·</span>
      <span>{{ result.metadata.summary.totalTokens.toLocaleString() }} {{ uiText.result.tokensUnit }}</span>
      <span class="sep">·</span>
      <span>{{ formatLabel }}</span>
      <span class="sep">·</span>
      <span>{{ formattedTime }}</span>
    </div>
    <button type="button" class="summary-bar__toggle" @click="expanded = !expanded">
      {{ expanded ? uiText.result.summaryBar.collapse : uiText.result.summaryBar.details }}
    </button>
  </div>
  <div v-if="expanded" class="summary-bar__detail">
    <TryItResultMetadata :result="result" />
  </div>
</template>

<style scoped>
.summary-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--amc-space-2, 8px);
  padding: var(--amc-space-3, 12px) var(--amc-space-4, 16px);
  background: var(--amc-surface-muted, var(--vp-c-bg-soft));
  border-bottom: 1px solid var(--amc-border, var(--vp-c-border));
  font-size: var(--amc-text-xs, 12px);
  color: var(--amc-text-muted, var(--vp-c-text-2));
}

.summary-bar__info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--amc-space-2, 8px);
  min-width: 0;
  flex: 1;
}

.repo {
  font-weight: 600;
  color: var(--amc-text, var(--vp-c-text-1));
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sep {
  color: var(--amc-text-subtle, var(--vp-c-text-3));
}

.summary-bar__toggle {
  border: none;
  background: transparent;
  padding: 0;
  font-size: var(--amc-text-xs, 12px);
  font-weight: 500;
  color: var(--amc-accent, var(--vp-c-brand-1));
  cursor: pointer;
  flex-shrink: 0;
}

.summary-bar__toggle:hover {
  text-decoration: underline;
}

.summary-bar__detail {
  border-bottom: 1px solid var(--amc-border, var(--vp-c-border));
}
</style>

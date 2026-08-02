<script setup lang="ts">
import { computed } from 'vue';
import type { PackProgressStage } from '../../types/api';
import { useHomeUiText } from './useHomeUiText';

interface Props {
  stage?: PackProgressStage | null;
  message?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  stage: null,
  message: null,
});
const uiText = useHomeUiText();

const stageMessages: Record<PackProgressStage, string> = {
  'cache-check': uiText.value.loading.stages['cache-check'],
  cloning: uiText.value.loading.stages.cloning,
  'repository-fetch': uiText.value.loading.stages['repository-fetch'],
  extracting: uiText.value.loading.stages.extracting,
  processing: uiText.value.loading.stages.processing,
};

const STAGE_ORDER: PackProgressStage[] = ['cache-check', 'cloning', 'repository-fetch', 'extracting', 'processing'];

const MAX_DETAIL_LENGTH = 60;

const progressPercent = computed(() => {
  if (!props.stage) return 0;
  const index = STAGE_ORDER.indexOf(props.stage);
  if (index < 0) return 0;
  return ((index + 1) / STAGE_ORDER.length) * 100;
});

const detailMessage = computed(() => {
  const text = props.message || (props.stage && stageMessages[props.stage]) || '...';
  if (text.length <= MAX_DETAIL_LENGTH) return text;
  return `${text.slice(0, MAX_DETAIL_LENGTH)}...`;
});

// Match "Processing files... (12/340)" style messages to surface a progress line.
const fileProgress = computed<{ done: number; total: number } | null>(() => {
  const text = props.message || '';
  const match = text.match(/\((\d+)\s*\/\s*(\d+)\)/);
  if (!match) return null;
  const done = Number.parseInt(match[1], 10);
  const total = Number.parseInt(match[2], 10);
  if (Number.isNaN(done) || Number.isNaN(total)) return null;
  return { done, total };
});
</script>

<template>
  <div class="loading">
    <div class="progress-track">
      <div class="progress-fill" :style="{ width: progressPercent + '%' }" :class="{ pulsing: !!stage }"></div>
    </div>
    <div class="loading-header">
      <div class="spinner"></div>
      <p>{{ uiText.loading.title }}</p>
    </div>
    <p class="loading-detail">{{ detailMessage }}</p>
    <p v-if="fileProgress" class="loading-files">
      {{ uiText.loading.filesProgress(fileProgress.done, fileProgress.total) }}
    </p>
  </div>
</template>

<style scoped>
.loading {
  padding: var(--amc-space-6, 24px);
  text-align: center;
}

.progress-track {
  width: 100%;
  height: 3px;
  background: var(--amc-border-soft, var(--vp-c-divider));
  border-radius: var(--amc-radius-pill, 999px);
  overflow: hidden;
  margin-bottom: var(--amc-space-4, 16px);
}

.progress-fill {
  height: 100%;
  width: 0;
  background: var(--amc-accent, var(--vp-c-brand-1));
  border-radius: var(--amc-radius-pill, 999px);
  transition: width var(--amc-transition-slow, 0.2s ease);
}

.progress-fill.pulsing {
  animation: pulse 1.4s ease-in-out infinite;
}

.loading-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--amc-space-2, 8px);
}

.loading-header p {
  margin: 0;
  font-size: var(--amc-text-base, 14px);
  color: var(--amc-text, var(--vp-c-text-1));
}

.loading-detail {
  margin: var(--amc-space-1, 4px) 0 0;
  font-size: var(--amc-text-sm, 13px);
  color: var(--amc-text-subtle, var(--vp-c-text-3));
}

.loading-files {
  margin: var(--amc-space-1, 4px) 0 0;
  font-size: var(--amc-text-xs, 12px);
  color: var(--amc-text-muted, var(--vp-c-text-2));
}

.spinner {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border: 2px solid var(--amc-accent, var(--vp-c-brand-1));
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>

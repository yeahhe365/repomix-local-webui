<script setup lang="ts">
import { AlertTriangle, BarChart2, GitFork, PackageSearch } from 'lucide-vue-next';
import { computed } from 'vue';
import type { PackResult } from '../../types/api';
import { formatTimestamp } from '../../utils/tryIt/resultViewer';
import { useHomeUiText } from './useHomeUiText';

const props = defineProps<{
  result: PackResult;
}>();

const uiText = useHomeUiText();

const hasSuspiciousFiles = computed(() => {
  return props.result.metadata.suspiciousFiles && props.result.metadata.suspiciousFiles.length > 0;
});

const formattedTimestamp = computed(() => {
  return formatTimestamp(props.result.metadata.timestamp);
});

const formattedResultFormat = computed(() => {
  return (
    uiText.value.options.formatNames[props.result.format as keyof typeof uiText.value.options.formatNames] ||
    props.result.format
  );
});
</script>

<template>
  <div class="metadata-panel">
    <div class="metadata-section">
      <h3><GitFork :size="16" class="section-icon" /> {{ uiText.result.repositoryInfo }}</h3>
      <dl>
        <dt>{{ uiText.result.repository }}</dt>
        <dd>{{ result.metadata.repository }}</dd>
        <dt>{{ uiText.result.generatedAt }}</dt>
        <dd>{{ formattedTimestamp }}</dd>
        <dt>{{ uiText.result.format }}</dt>
        <dd>{{ formattedResultFormat }}</dd>
      </dl>
    </div>

    <div class="metadata-section">
      <h3><PackageSearch :size="16" class="section-icon" /> {{ uiText.result.packSummary }}</h3>
      <dl v-if="result.metadata.summary">
        <dt>{{ uiText.result.totalFiles }}</dt>
        <dd>
          {{ result.metadata.summary.totalFiles.toLocaleString() }}
          <span class="unit">{{ uiText.result.filesUnit }}</span>
        </dd>
        <dt>{{ uiText.result.totalTokens }}</dt>
        <dd>
          {{ result.metadata.summary.totalTokens.toLocaleString() }}
          <span class="unit">{{ uiText.result.tokensUnit }}</span>
        </dd>
        <dt>{{ uiText.result.totalSize }}</dt>
        <dd>
          {{ result.metadata.summary.totalCharacters.toLocaleString() }}
          <span class="unit">{{ uiText.result.charsUnit }}</span>
        </dd>
      </dl>
    </div>

    <div class="metadata-section" v-if="result.metadata.topFiles">
      <h3>
        <BarChart2 :size="16" class="section-icon" />
        {{ uiText.result.topFiles(result.metadata.topFiles.length) }}
      </h3>
      <ol class="top-files-list">
        <li v-for="file in result.metadata.topFiles" :key="file.path">
          <div class="file-path">{{ file.path }}</div>
          <div class="file-stats">
            {{ file.tokenCount.toLocaleString() }}
            <span class="unit">{{ uiText.result.tokensUnit }}</span>
            <span class="separator-unit">|</span>
            {{ file.charCount.toLocaleString() }}
            <span class="unit">{{ uiText.result.charsUnit }}</span>
            <span class="separator-unit">|</span>
            {{ ((file.tokenCount / result.metadata.summary.totalTokens) * 100).toFixed(1) }}<span class="unit">%</span>
          </div>
        </li>
      </ol>
    </div>

    <div class="metadata-section security-warning" v-if="hasSuspiciousFiles">
      <h3><AlertTriangle :size="16" class="section-icon warning-icon" /> {{ uiText.result.securityAlert }}</h3>
      <p class="warning-description">{{ uiText.result.securityWarningDescription }}</p>
      <ul class="suspicious-files-list">
        <li v-for="file in result.metadata.suspiciousFiles" :key="file.filePath">
          <div class="file-path">{{ file.filePath }}</div>
          <div class="suspicious-messages">
            <span v-for="(message, index) in file.messages" :key="`${message}-${index}`" class="suspicious-message">
              {{ message }}
            </span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.metadata-panel {
  padding: 16px;
  border-right: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-soft);
  overflow-y: auto;
}

.metadata-section {
  margin-bottom: 24px;
}

.metadata-section:last-child {
  margin-bottom: 0;
}

.metadata-section h3 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--vp-c-text-1);
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-icon {
  color: var(--vp-c-text-2);
}

dl {
  margin: 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  font-size: 13px;
}

dt {
  color: var(--vp-c-text-2);
  font-weight: 500;
}

dd {
  margin: 0;
  color: var(--vp-c-text-1);
  text-transform: lowercase;
}

.unit {
  color: var(--vp-c-text-2);
  margin-left: 0.3em;
}

.separator-unit {
  color: var(--vp-c-text-3);
  margin: 0 0.5em;
}

.top-files-list {
  margin: 0;
  padding: 0;
  font-size: 13px;
}

.top-files-list li {
  margin-bottom: 8px;
  border-left: 2px solid var(--vp-c-divider);
  padding-left: 8px;
}

.security-warning {
  background: var(--vp-c-warning-soft);
  border-radius: 6px;
  padding: 12px;
}

.warning-icon {
  color: var(--vp-c-warning-1);
}

.warning-description {
  font-size: 12px;
  color: var(--vp-c-text-2);
  margin: 0 0 8px;
}

.suspicious-files-list {
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 13px;
}

.suspicious-files-list li {
  margin-bottom: 6px;
  border-left: 2px solid var(--vp-c-warning-1);
  padding-left: 8px;
}

.suspicious-files-list li:last-child {
  margin-bottom: 0;
}

.suspicious-messages {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.suspicious-message {
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.file-path {
  color: var(--vp-c-text-1);
  margin-bottom: 2px;
  word-break: break-all;
}

.file-stats {
  font-size: 12px;
  color: var(--vp-c-text-1);
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .metadata-panel {
    border-right: none;
    border-bottom: 1px solid var(--vp-c-border);
    max-height: 400px;
  }
}
</style>

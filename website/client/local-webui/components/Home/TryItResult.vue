<script setup lang="ts">
import { computed, ref } from 'vue';
import type { FileInfo, PackProgressStage, PackResult } from '../../types/api';
import type { PackOptions } from '../../types/pack';
import type { TabType } from '../../types/ui';
import SupportMessage from './SupportMessage.vue';
import TryItFileSelection from './TryItFileSelection.vue';
import TryItLoading from './TryItLoading.vue';
import TryItResultContent from './TryItResultContent.vue';
import TryItResultErrorContent from './TryItResultErrorContent.vue';
import { useHomeUiText } from './useHomeUiText';

interface Props {
  result?: PackResult | null;
  loading?: boolean;
  error?: string | null;
  errorType?: 'error' | 'warning';
  repositoryUrl?: string;
  packOptions?: PackOptions;
  progressStage?: PackProgressStage | null;
  progressMessage?: string | null;
}

interface Emits {
  (e: 'repack', selectedFiles: FileInfo[]): void;
  (e: 'repack-completed'): void;
  (e: 'apply-ignore-hint'): void;
  (e: 'retry'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const uiText = useHomeUiText();

// Tab management
const activeTab = ref<TabType>('result');

const hasFileSelection = computed(() => props.result?.metadata?.allFiles && props.result.metadata.allFiles.length > 0);

const handleTabClick = (tab: TabType) => {
  activeTab.value = tab;
};

const handleRepack = (selectedFiles: FileInfo[]) => {
  // Only proceed if we have selected files
  if (!selectedFiles || selectedFiles.length === 0) {
    return;
  }

  // Switch to result tab immediately when re-pack starts
  activeTab.value = 'result';

  emit('repack', selectedFiles);
};
</script>

<template>
  <div class="result-viewer">
    <template v-if="loading && !result">
      <TryItLoading :stage="progressStage" :message="progressMessage" />
      <SupportMessage />
    </template>
    <TryItResultErrorContent
      v-else-if="error"
      :message="error"
      :error-type="errorType"
      :repository-url="repositoryUrl"
      :pack-options="packOptions"
      @apply-ignore-hint="emit('apply-ignore-hint')"
      @retry="emit('retry')"
    />
    <div v-else-if="result" class="result-content">
      <!-- Tab Navigation -->
      <div v-if="hasFileSelection" class="tab-navigation">
        <button 
          type="button"
          class="tab-button"
          :class="{ active: activeTab === 'result' }"
          @click="handleTabClick('result')"
        >
          {{ uiText.result.tabs.result }}
        </button>
        <button 
          type="button"
          class="tab-button"
          :class="{ active: activeTab === 'files' }"
          @click="handleTabClick('files')"
        >
          {{ uiText.result.tabs.files }}
        </button>
      </div>

      <!-- Tab Content -->
      <div v-show="activeTab === 'result' || !hasFileSelection">
        <TryItResultContent :result="result" :pack-options="packOptions" />
      </div>
      <div v-show="activeTab === 'files' && hasFileSelection">
        <TryItFileSelection
          v-if="hasFileSelection"
          :all-files="result.metadata!.allFiles!"
          :loading="loading"
          @repack="handleRepack"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.result-viewer {
  margin-top: var(--amc-space-5, 20px);
  border: 1px solid var(--amc-border, var(--vp-c-border));
  border-radius: var(--amc-radius-card, 8px);
  box-shadow: var(--amc-shadow-sm, 0 1px 2px rgb(0 0 0 / 0.04));
  overflow: hidden;
}

.result-content {
  display: flex;
  flex-direction: column;
}

/* Underline-style tab navigation — Linear/Vercel minimal. */
.tab-navigation {
  display: flex;
  gap: var(--amc-space-1, 4px);
  padding: 0 var(--amc-space-4, 16px);
  border-bottom: 1px solid var(--amc-border, var(--vp-c-border));
  background: var(--amc-surface, var(--vp-c-bg));
}

.tab-button {
  position: relative;
  padding: var(--amc-space-3, 12px) var(--amc-space-3, 12px);
  border: none;
  background: transparent;
  color: var(--amc-text-muted, var(--vp-c-text-2));
  font-size: var(--amc-text-sm, 13px);
  font-weight: 500;
  cursor: pointer;
  transition: color var(--amc-transition, 0.15s ease);
}

.tab-button::after {
  content: '';
  position: absolute;
  left: var(--amc-space-3, 12px);
  right: var(--amc-space-3, 12px);
  bottom: -1px;
  height: 2px;
  background: transparent;
  transition: background-color var(--amc-transition, 0.15s ease);
}

.tab-button:hover {
  color: var(--amc-text, var(--vp-c-text-1));
}

.tab-button.active {
  color: var(--amc-text, var(--vp-c-text-1));
}

.tab-button.active::after {
  background: var(--amc-accent, var(--vp-c-brand-1));
}
</style>

<template>
  <div class="warning-message">
    <div class="warning-icon">⚠️</div>
    <div class="warning-text">
      <slot>
        {{ uiText.upload.fileSelectionWarning(threshold) }}
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHomeUiText } from './useHomeUiText';

interface Props {
  threshold: number;
}

defineProps<Props>();
const uiText = useHomeUiText();
</script>

<style scoped>
.warning-message {
  display: flex;
  align-items: flex-start;
  gap: var(--amc-space-2, 8px);
  padding: var(--amc-space-3, 12px) var(--amc-space-4, 16px);
  background: var(--amc-warning-soft, var(--vp-c-warning-soft));
  border: 1px solid var(--amc-warning, var(--vp-c-warning));
  border-radius: var(--amc-radius-sm, 6px);
  margin-bottom: var(--amc-space-2, 8px);
}

.warning-icon {
  font-size: var(--amc-text-base, 14px);
  line-height: 1;
  flex-shrink: 0;
}

.warning-text {
  font-size: var(--amc-text-sm, 13px);
  color: var(--amc-text, var(--vp-c-text-1));
  line-height: 1.4;
}
</style>

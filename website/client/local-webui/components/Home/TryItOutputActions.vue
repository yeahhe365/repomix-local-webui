<script setup lang="ts">
import { Copy, Download, Share } from 'lucide-vue-next';
import { onMounted, onUnmounted, ref } from 'vue';
import type { PackResult } from '../../types/api';
import { canShareFiles, copyToClipboard, downloadResult, shareResult } from '../../utils/tryIt/resultViewer';
import { useHomeUiText } from './useHomeUiText';

const props = defineProps<{
  result: PackResult;
}>();

const uiText = useHomeUiText();
const copied = ref(false);
const shared = ref(false);
const canShare = ref(canShareFiles());
const isMobile = ref(false);
const tooltipContainer = ref<HTMLElement | null>(null);
const tooltipContent = ref<HTMLElement | null>(null);

const handleCopy = async (event: Event) => {
  event.preventDefault();
  event.stopPropagation();

  const success = await copyToClipboard(props.result.content, props.result.format);
  if (success) {
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
};

const handleDownload = (event: Event) => {
  event.preventDefault();
  event.stopPropagation();
  downloadResult(props.result.content, props.result.format, props.result);
};

const handleShare = async (event: Event) => {
  event.preventDefault();
  event.stopPropagation();

  if (!isMobile.value || !canShare.value) {
    console.log(uiText.value.result.shareUnavailable);
    return;
  }

  const success = await shareResult(props.result.content, props.result.format, props.result);
  if (success) {
    shared.value = true;
    setTimeout(() => {
      shared.value = false;
    }, 2000);
  } else {
    console.log(uiText.value.result.shareFailed);
  }
};

const updateTooltipPosition = () => {
  if (!tooltipContainer.value || !tooltipContent.value || isMobile.value) return;

  const containerRect = tooltipContainer.value.getBoundingClientRect();
  const tooltipEl = tooltipContent.value;

  tooltipEl.style.top = `${containerRect.top - 46}px`;
  tooltipEl.style.left = `${containerRect.left + containerRect.width / 2}px`;
  tooltipEl.style.opacity = '1';
  tooltipEl.style.visibility = 'visible';
};

const hideTooltip = () => {
  if (tooltipContent.value) {
    tooltipContent.value.style.opacity = '0';
    tooltipContent.value.style.visibility = 'hidden';
  }
};

const handleResize = () => {
  isMobile.value = window.innerWidth <= 768;
};

const handleScroll = () => {
  hideTooltip();
};

onMounted(() => {
  isMobile.value = window.innerWidth <= 768;
  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <div class="output-actions">
    <button class="action-button" @click="handleCopy" :class="{ copied }">
      <Copy :size="16" />
      {{ copied ? uiText.actions.copied : uiText.actions.copy }}
    </button>
    <button class="action-button" @click="handleDownload">
      <Download :size="16" />
      {{ uiText.actions.download }}
    </button>
    <div v-if="canShare" class="mobile-only"></div>
    <div
      v-if="canShare"
      class="tooltip-container"
      ref="tooltipContainer"
      @mouseenter="updateTooltipPosition"
      @mouseleave="hideTooltip"
    >
      <button
        class="action-button"
        @click="handleShare"
        :class="{ shared }"
        :disabled="!isMobile"
        :aria-label="uiText.actions.shareAria"
      >
        <Share :size="16" />
        {{ shared ? uiText.actions.shared : uiText.actions.openWithApp }}
      </button>
      <div class="tooltip-content desktop-only" ref="tooltipContent">
        {{ uiText.actions.onlyMobile }}
        <div class="tooltip-arrow"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.output-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background: var(--vp-c-bg);
  border-bottom: 1px solid var(--vp-c-border);
  flex-shrink: 0;
}

.action-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  border-color: var(--vp-c-brand-1);
}

.action-button.copied,
.action-button.shared {
  background: var(--vp-c-brand-1);
  color: white;
  border-color: var(--vp-c-brand-1);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button:disabled:hover {
  opacity: 0.5;
}

.mobile-only {
  display: none;
  flex-basis: 100%;
}

.tooltip-container {
  position: relative;
  display: inline-block;
}

.tooltip-content {
  position: fixed;
  transform: translateX(-50%);
  margin-bottom: 8px;
  padding: 8px 12px;
  background: #333;
  color: white;
  font-size: 0.875rem;
  white-space: nowrap;
  border-radius: 4px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
  z-index: 9999;
  pointer-events: none;
  text-align: left;
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

.tooltip-container:hover .tooltip-content {
  opacity: 1;
  visibility: visible;
}

.desktop-only {
  display: block;
}

html.dark .tooltip-content {
  background: #333;
  color: #ffffff;
}

html.dark .tooltip-arrow {
  border-color: #333 transparent transparent transparent;
}

@media (max-width: 768px) {
  .mobile-only {
    display: inline-flex;
  }

  .desktop-only {
    display: none;
  }
}
</style>

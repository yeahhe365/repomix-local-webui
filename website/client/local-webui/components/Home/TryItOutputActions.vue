<script setup lang="ts">
import { Check, Copy, Download, Share, Terminal } from 'lucide-vue-next';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { PackResult } from '../../types/api';
import type { PackOptions } from '../../types/pack';
import { canShareFiles, copyToClipboard, downloadResult, shareResult } from '../../utils/tryIt/resultViewer';
import { generateCliCommand } from '../../utils/tryIt/cliCommand';
import { useToast } from '../../composables/useToast';
import { useHomeUiText } from './useHomeUiText';

const props = withDefaults(
  defineProps<{
    result: PackResult;
    variant?: 'default' | 'floating';
    packOptions?: PackOptions;
  }>(),
  {
    variant: 'default',
    packOptions: undefined,
  },
);

const uiText = useHomeUiText();
const { showToast } = useToast();
const copied = ref(false);
const commandCopied = ref(false);
const shared = ref(false);
const canShare = ref(canShareFiles());
const isMobile = ref(false);
const tooltipContainer = ref<HTMLElement | null>(null);
const tooltipContent = ref<HTMLElement | null>(null);

const isFloating = computed(() => props.variant === 'floating');

const cliCommand = computed(() => generateCliCommand(props.result.metadata.repository, props.packOptions));

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
  showToast(uiText.value.actions.downloadStarted, { type: 'success' });
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

const handleCopyCommand = async (event: Event) => {
  event.preventDefault();
  event.stopPropagation();
  try {
    await navigator.clipboard.writeText(cliCommand.value);
    commandCopied.value = true;
    setTimeout(() => {
      commandCopied.value = false;
    }, 2000);
  } catch (err) {
    console.error(uiText.value.result.copyCommandError, err);
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
  <div class="output-actions" :class="{ 'output-actions--floating': isFloating }">
    <button
      class="action-button"
      :class="{ copied, 'action-button--icon': isFloating }"
      @click="handleCopy"
      :aria-label="uiText.actions.copy"
      :title="isFloating ? (copied ? uiText.actions.copied : uiText.actions.copy) : undefined"
    >
      <Check v-if="copied" :size="16" />
      <Copy v-else :size="16" />
      <span v-if="!isFloating">{{ copied ? uiText.actions.copied : uiText.actions.copy }}</span>
    </button>
    <button
      v-if="isFloating"
      class="action-button action-button--icon"
      :class="{ commandCopied }"
      @click="handleCopyCommand"
      :aria-label="uiText.actions.copyCliCommand"
      :title="uiText.actions.copyCliCommand"
    >
      <Check v-if="commandCopied" :size="16" />
      <Terminal v-else :size="16" />
    </button>
    <button
      class="action-button"
      :class="{ 'action-button--icon': isFloating }"
      @click="handleDownload"
      :aria-label="uiText.actions.download"
      :title="isFloating ? uiText.actions.download : undefined"
    >
      <Download :size="16" />
      <span v-if="!isFloating">{{ uiText.actions.download }}</span>
    </button>
    <template v-if="canShare">
      <div v-if="!isFloating" class="mobile-only"></div>
      <div
        class="tooltip-container"
        ref="tooltipContainer"
        @mouseenter="updateTooltipPosition"
        @mouseleave="hideTooltip"
      >
        <button
          class="action-button"
          :class="{ shared, 'action-button--icon': isFloating }"
          @click="handleShare"
          :disabled="!isMobile"
          :aria-label="uiText.actions.shareAria"
          :title="isFloating ? uiText.actions.share : undefined"
        >
          <Check v-if="shared" :size="16" />
          <Share v-else :size="16" />
          <span v-if="!isFloating">{{ shared ? uiText.actions.shared : uiText.actions.openWithApp }}</span>
        </button>
        <div v-if="!isFloating" class="tooltip-content desktop-only" ref="tooltipContent">
          {{ uiText.actions.onlyMobile }}
          <div class="tooltip-arrow"></div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.output-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--amc-space-2, 8px);
  padding: var(--amc-space-3, 12px);
  background: var(--amc-surface, var(--vp-c-bg));
  border-bottom: 1px solid var(--amc-border, var(--vp-c-border));
  flex-shrink: 0;
}

.output-actions--floating {
  position: absolute;
  top: var(--amc-space-2, 8px);
  right: var(--amc-space-2, 8px);
  z-index: 5;
  padding: 4px;
  border: 1px solid var(--amc-border-soft, var(--vp-c-divider));
  border-radius: var(--amc-radius, 6px);
  background: color-mix(in srgb, var(--amc-surface, var(--vp-c-bg)) 85%, transparent);
  backdrop-filter: blur(6px);
  flex-wrap: nowrap;
}

.action-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: var(--amc-control-h-sm, 32px);
  padding: 0 var(--amc-space-3, 12px);
  border: 1px solid var(--amc-border, var(--vp-c-border));
  border-radius: var(--amc-radius, 6px);
  background: var(--amc-surface, var(--vp-c-bg));
  color: var(--amc-text, var(--vp-c-text-1));
  font-size: var(--amc-text-sm, 13px);
  font-weight: 500;
  cursor: pointer;
  transition: border-color var(--amc-transition, 0.15s ease), background-color var(--amc-transition, 0.15s ease),
    color var(--amc-transition, 0.15s ease);
}

.action-button--icon {
  width: var(--amc-control-h-sm, 32px);
  padding: 0;
  justify-content: center;
  border: none;
  background: transparent;
}

.action-button:hover:not(:disabled) {
  background: var(--amc-surface-muted, var(--vp-c-bg-soft));
  border-color: var(--amc-text-subtle, var(--vp-c-text-3));
}

.action-button--icon:hover:not(:disabled) {
  border: none;
  background: var(--amc-surface-muted, var(--vp-c-bg-soft));
}

.action-button.copied,
.action-button.shared,
.action-button.commandCopied {
  background: var(--amc-accent, var(--vp-c-brand-1));
  color: var(--amc-accent-on, #fff);
  border-color: var(--amc-accent, var(--vp-c-brand-1));
}

.action-button--icon.copied,
.action-button--icon.shared,
.action-button--icon.commandCopied {
  border: none;
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
  margin-bottom: var(--amc-space-2, 8px);
  padding: var(--amc-space-2, 8px) var(--amc-space-3, 12px);
  background: var(--vp-c-bg-alt, #333);
  color: var(--vp-c-text-1, #fff);
  font-size: var(--amc-text-xs, 12px);
  white-space: nowrap;
  border-radius: var(--amc-radius-sm, 6px);
  border: 1px solid var(--amc-border, var(--vp-c-border));
  opacity: 0;
  visibility: hidden;
  transition: opacity var(--amc-transition, 0.15s ease), visibility var(--amc-transition, 0.15s ease);
  z-index: 9999;
  pointer-events: none;
  text-align: left;
}

.tooltip-arrow {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 6px;
  border-style: solid;
  border-color: var(--amc-border, var(--vp-c-border)) transparent transparent transparent;
}

.tooltip-container:hover .tooltip-content {
  opacity: 1;
  visibility: visible;
}

.desktop-only {
  display: block;
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

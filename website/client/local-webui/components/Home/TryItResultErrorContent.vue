<script setup lang="ts">
import { AlertCircle, AlertTriangle, Copy, RotateCcw, Wrench } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import type { PackOptions } from '../../types/pack';
import { generateCliCommand } from '../../utils/tryIt/cliCommand';
import { useHomeUiText } from './useHomeUiText';

const props = defineProps<{
  message: string;
  repositoryUrl?: string;
  errorType?: 'error' | 'warning';
  packOptions?: PackOptions;
}>();

const emit = defineEmits<{
  'apply-ignore-hint': [];
  retry: [];
}>();

const copied = ref(false);
const uiText = useHomeUiText();
const commandWithRepo = computed(() => {
  if (!props.repositoryUrl) {
    return 'npx repomix --remote <repository-url>';
  }
  return generateCliCommand(props.repositoryUrl, props.packOptions);
});

// Classify the error so we can show the right title color and quick actions.
const kind = computed<'input' | 'network' | 'server'>(() => {
  const text = props.message.toLowerCase();
  // Local-path allowlist / mount issues are configuration problems the user
  // can fix, so they are treated as input (warning) rather than server failures.
  if (/outside the allowed director|does not exist on the server|allowed roots|格式|路径/.test(text))
    return 'input';
  if (/invalid|valid|absolute|required/.test(text)) return 'input';
  if (/timed out|timeout|abort|network|failed to fetch|超时/.test(text)) return 'network';
  return 'server';
});

const titleText = computed(() => {
  switch (kind.value) {
    case 'input':
      return uiText.value.errors.kindInput;
    case 'network':
      return uiText.value.errors.kindNetwork;
    default:
      return uiText.value.errors.kindServer;
  }
});

// input/network errors are warnings (amber); server errors are hard failures (red).
const resolvedType = computed<'error' | 'warning'>(() => {
  if (kind.value === 'server') return 'error';
  return 'warning';
});

const copyCommand = async (event: Event) => {
  event.preventDefault();
  event.stopPropagation();
  await navigator.clipboard.writeText(commandWithRepo.value);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
};
</script>

<template>
  <div :class="resolvedType === 'warning' ? 'warning' : 'error'">
    <div class="content">
      <AlertCircle v-if="resolvedType === 'warning'" :size="32" class="warning-icon" />
      <AlertTriangle v-else :size="32" class="error-icon" />
      <p class="kind-title" :class="`kind-title--${kind}`">{{ titleText }}</p>
      <p :class="resolvedType === 'warning' ? 'warning-message' : 'error-message'">{{ message }}</p>

      <div v-if="kind === 'network' || kind === 'server'" class="quick-actions">
        <button v-if="kind === 'network'" type="button" class="quick-action" @click="emit('apply-ignore-hint')">
          <Wrench :size="14" />
          {{ uiText.errors.applyIgnoreHint }}
        </button>
        <button type="button" class="quick-action quick-action--primary" @click="emit('retry')">
          <RotateCcw :size="14" />
          {{ uiText.errors.retry }}
        </button>
      </div>

      <details class="cli-fallback">
        <summary>{{ uiText.errors.otherWays }}</summary>
        <div class="suggestion">
          <p>{{ uiText.errors.tryCliInstead }}</p>
          <div class="command-block">
            <code>{{ commandWithRepo }}</code>
            <button class="copy-button" @click="copyCommand" :class="{ copied }">
              <Copy :size="14" />
              {{ copied ? uiText.actions.copied : uiText.actions.copy }}
            </button>
          </div>
          <p class="guide-link">
            {{ uiText.errors.cliGuidePrefix }}
            <a href="#using-the-cli-tool">{{ uiText.errors.cliToolLabel }}</a>
            {{ uiText.errors.cliGuideSuffix }}
          </p>
        </div>
      </details>
    </div>
  </div>
</template>

<style scoped>
.error,
.warning {
  padding: var(--amc-space-6, 24px);
  display: flex;
  justify-content: center;
  align-items: center;
}

.content {
  max-width: 700px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.error-icon {
  color: var(--amc-danger, var(--vp-c-danger-1));
  margin-bottom: var(--amc-space-4, 16px);
}

.warning-icon {
  color: var(--amc-warning, var(--vp-c-warning-1));
  margin-bottom: var(--amc-space-4, 16px);
}

.kind-title {
  margin: 0 0 var(--amc-space-2, 8px);
  font-size: var(--amc-text-lg, 16px);
  font-weight: 600;
}

.kind-title--input,
.kind-title--network {
  color: var(--amc-warning, var(--vp-c-warning-1));
}

.kind-title--server {
  color: var(--amc-danger, var(--vp-c-danger-1));
}

.error-message {
  color: var(--amc-danger, var(--vp-c-danger-1));
  font-size: var(--amc-text-base, 14px);
  margin: 0 0 var(--amc-space-4, 16px);
  white-space: pre-wrap;
}

.warning-message {
  color: var(--amc-warning, var(--vp-c-warning-1));
  font-size: var(--amc-text-base, 14px);
  margin: 0 0 var(--amc-space-4, 16px);
  white-space: pre-wrap;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--amc-space-2, 8px);
  margin-bottom: var(--amc-space-4, 16px);
}

.quick-action {
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
  cursor: pointer;
  transition: border-color var(--amc-transition, 0.15s ease), background-color var(--amc-transition, 0.15s ease),
    color var(--amc-transition, 0.15s ease);
}

.quick-action:hover:not(:disabled) {
  border-color: var(--amc-accent, var(--vp-c-brand-1));
  color: var(--amc-accent, var(--vp-c-brand-1));
}

.quick-action--primary {
  background: var(--amc-accent, var(--vp-c-brand-1));
  border-color: var(--amc-accent, var(--vp-c-brand-1));
  color: var(--amc-accent-on, #fff);
}

.quick-action--primary:hover:not(:disabled) {
  background: var(--amc-accent-hover, var(--vp-c-brand-2));
  border-color: var(--amc-accent-hover, var(--vp-c-brand-2));
  color: var(--amc-accent-on, #fff);
}

.cli-fallback {
  width: 100%;
  text-align: left;
}

.cli-fallback > summary {
  cursor: pointer;
  font-size: var(--amc-text-sm, 13px);
  color: var(--amc-text-muted, var(--vp-c-text-2));
  padding: var(--amc-space-2, 8px) 0;
}

.cli-fallback[open] > summary {
  padding-bottom: var(--amc-space-3, 12px);
}

.suggestion {
  background: var(--amc-surface-muted, var(--vp-c-bg-soft));
  padding: var(--amc-space-4, 16px);
  border-radius: var(--amc-radius, 6px);
  border: 1px solid var(--amc-border, var(--vp-c-border));
  width: 100%;
}

.suggestion p {
  margin: 0 0 var(--amc-space-3, 12px);
  color: var(--amc-text-muted, var(--vp-c-text-2));
  font-size: var(--amc-text-sm, 13px);
}

.command-block {
  background: var(--amc-surface, var(--vp-c-bg-alt));
  border: 1px solid var(--amc-border, var(--vp-c-border));
  border-radius: var(--amc-radius, 6px);
  padding: var(--amc-space-3, 12px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--amc-space-3, 12px);
  font-family: var(--amc-font-mono, var(--vp-font-family-mono));
}

code {
  color: var(--amc-text, var(--vp-c-text-1));
  font-size: var(--amc-text-sm, 13px);
}

.copy-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: var(--amc-control-h-sm, 32px);
  padding: 0 var(--amc-space-2, 8px);
  border: 1px solid var(--amc-border, var(--vp-c-border));
  border-radius: var(--amc-radius, 6px);
  background: var(--amc-surface, var(--vp-c-bg-soft));
  color: var(--amc-text-muted, var(--vp-c-text-2));
  font-size: var(--amc-text-xs, 12px);
  cursor: pointer;
  transition: border-color var(--amc-transition, 0.15s ease), color var(--amc-transition, 0.15s ease),
    background-color var(--amc-transition, 0.15s ease);
}

.copy-button:hover {
  border-color: var(--amc-accent, var(--vp-c-brand-1));
  color: var(--amc-accent, var(--vp-c-brand-1));
}

.copy-button.copied {
  background: var(--amc-accent, var(--vp-c-brand-1));
  color: var(--amc-accent-on, #fff);
  border-color: var(--amc-accent, var(--vp-c-brand-1));
}

.guide-link {
  font-size: var(--amc-text-sm, 13px);
}

.guide-link a {
  color: var(--amc-accent, var(--vp-c-brand-1));
  text-decoration: none;
  font-weight: 500;
}

.guide-link a:hover {
  text-decoration: underline;
}
</style>

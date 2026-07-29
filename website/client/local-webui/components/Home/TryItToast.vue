<script setup lang="ts">
import { Check, X } from 'lucide-vue-next';
import { useToast } from '../../composables/useToast';
import { useHomeUiText } from './useHomeUiText';

const { toasts, dismissToast, triggerToastAction } = useToast();
const uiText = useHomeUiText();
</script>

<template>
  <div class="toast-stack" role="status" aria-live="polite">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="toast"
      :class="`toast--${toast.type}`"
    >
      <span class="toast__bar"></span>
      <span class="toast__message">{{ toast.message }}</span>
      <button
        v-if="toast.actionLabel"
        type="button"
        class="toast__action"
        @click="triggerToastAction(toast.id)"
      >
        <Check :size="12" />
        {{ toast.actionLabel }}
      </button>
      <button
        type="button"
        class="toast__close"
        :aria-label="uiText.actions.clear"
        @click="dismissToast(toast.id)"
      >
        <X :size="14" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.toast-stack {
  position: fixed;
  bottom: var(--amc-space-4, 16px);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column-reverse;
  gap: var(--amc-space-2, 8px);
  z-index: 100;
  pointer-events: none;
  width: min(440px, calc(100vw - 32px));
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--amc-space-2, 8px);
  padding: var(--amc-space-2, 8px) var(--amc-space-3, 12px);
  border: 1px solid var(--amc-border, var(--vp-c-border));
  border-radius: var(--amc-radius, 6px);
  background: var(--amc-surface, var(--vp-c-bg));
  box-shadow: var(--amc-shadow, 0 4px 12px rgb(0 0 0 / 0.12));
  font-size: var(--amc-text-sm, 13px);
  color: var(--amc-text, var(--vp-c-text-1));
  pointer-events: auto;
  animation: toast-in var(--amc-transition-slow, 0.2s ease);
}

.toast__bar {
  width: 3px;
  align-self: stretch;
  border-radius: var(--amc-radius-pill, 999px);
  background: var(--amc-text-subtle, var(--vp-c-text-3));
  flex-shrink: 0;
}

.toast--success .toast__bar {
  background: var(--amc-accent, var(--vp-c-brand-1));
}

.toast--warning .toast__bar {
  background: var(--amc-warning, var(--vp-c-warning-1));
}

.toast__message {
  flex: 1;
  min-width: 0;
}

.toast__action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--amc-border, var(--vp-c-border));
  border-radius: var(--amc-radius-pill, 999px);
  background: var(--amc-surface, var(--vp-c-bg));
  color: var(--amc-accent, var(--vp-c-brand-1));
  font-size: var(--amc-text-xs, 12px);
  padding: 3px 8px;
  cursor: pointer;
  transition: background-color var(--amc-transition, 0.15s ease);
  flex-shrink: 0;
}

.toast__action:hover {
  background: color-mix(in srgb, var(--amc-accent, var(--vp-c-brand-1)) 8%, var(--amc-surface, var(--vp-c-bg)));
}

.toast__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--amc-text-subtle, var(--vp-c-text-3));
  cursor: pointer;
  flex-shrink: 0;
  transition: color var(--amc-transition, 0.15s ease), background-color var(--amc-transition, 0.15s ease);
}

.toast__close:hover {
  color: var(--amc-text, var(--vp-c-text-1));
  background: var(--amc-surface-muted, var(--vp-c-bg-soft));
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

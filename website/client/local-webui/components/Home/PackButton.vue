<template>
  <button
    class="pack-button"
    :class="{ 'pack-button--loading': loading }"
    :disabled="!isValid && !loading"
    :aria-label="loading ? uiText.actions.cancelAria : uiText.actions.packAria"
    type="submit"
    @click="handleClick"
  >
    <span class="pack-button__text pack-button__text--normal">
      {{ loading ? uiText.actions.processing : uiText.actions.pack }}
    </span>
    <span class="pack-button__text pack-button__text--hover">
      {{ loading ? uiText.actions.cancel : uiText.actions.pack }}
    </span>
    <PackIcon v-if="!loading" :size="18" />
  </button>
</template>

<script setup lang="ts">
import PackIcon from './PackIcon.vue';
import { useHomeUiText } from './useHomeUiText';

const props = defineProps<{
  loading?: boolean;
  isValid?: boolean;
}>();

const emit = defineEmits<(e: 'cancel') => void>();
const uiText = useHomeUiText();

function handleClick(event: MouseEvent) {
  // Only handle cancel on actual mouse clicks, not on form submission (Enter key)
  if (props.loading && event.detail > 0) {
    event.preventDefault();
    event.stopPropagation();
    emit('cancel');
  }
}
</script>

<style scoped>
.pack-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--amc-space-2, 8px);
  height: var(--amc-control-h, 40px);
  min-width: 104px;
  padding: 0 var(--amc-space-4, 16px);
  font-size: var(--amc-text-md, 15px);
  font-weight: 600;
  background: var(--amc-accent, var(--vp-c-brand-1));
  color: var(--amc-accent-on, #fff);
  border: 1px solid var(--amc-accent, var(--vp-c-brand-1));
  border-radius: var(--amc-radius, 6px);
  cursor: pointer;
  transition: background-color var(--amc-transition-slow, 0.2s ease), border-color var(--amc-transition-slow, 0.2s ease);
  position: relative;
}

.pack-button:hover:not(:disabled) {
  background: var(--amc-accent-hover, var(--vp-c-brand-2));
  border-color: var(--amc-accent-hover, var(--vp-c-brand-2));
}

.pack-button--loading:hover {
  background: var(--amc-danger, var(--vp-c-danger-1));
  border-color: var(--amc-danger, var(--vp-c-danger-1));
}

.pack-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pack-button:active:not(:disabled) {
  transform: scale(0.98);
}

.pack-button__text {
  transition: opacity var(--amc-transition-slow, 0.2s ease);
}

.pack-button__text--hover {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.pack-button--loading:hover .pack-button__text--normal {
  opacity: 0;
}

.pack-button--loading:hover .pack-button__text--hover {
  opacity: 1;
}

@media (max-width: 768px) {
  .pack-button {
    flex: 1;
  }
}
</style>

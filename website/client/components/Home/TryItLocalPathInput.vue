<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next';
import { computed } from 'vue';
import PackButton from './PackButton.vue';
import { isValidAbsolutePath } from './localPathInput';
import { useHomeUiText } from './useHomeUiText';

const props = defineProps<{
  path: string;
  loading: boolean;
  showButton?: boolean;
}>();

const uiText = useHomeUiText();

const emit = defineEmits<{
  'update:path': [value: string];
  submit: [];
  keydown: [event: KeyboardEvent];
  cancel: [];
}>();

const isValidPath = computed(() => {
  if (!props.path) return false;
  return isValidAbsolutePath(props.path);
});

function handlePathInput(event: Event) {
  const input = event.target as HTMLInputElement;
  emit('update:path', input.value);
}

function handleSubmit() {
  emit('submit');
}

function handleKeydown(event: KeyboardEvent) {
  emit('keydown', event);
}
</script>

<template>
  <div class="input-group">
    <div class="path-input-container">
      <input
        :value="path"
        @input="handlePathInput"
        @keydown="handleKeydown"
        type="text"
        :placeholder="uiText.upload.localPathPlaceholder"
        class="repository-input"
        :class="{ invalid: path && !isValidPath }"
        :aria-label="uiText.upload.localPathInputAria"
        autocomplete="off"
      />
    </div>

    <div v-if="path && !isValidPath" class="path-warning">
      <AlertTriangle class="warning-icon" :size="16" />
      <span>{{ uiText.upload.invalidLocalPath }}</span>
    </div>
    <div v-if="showButton" class="pack-button-container">
      <PackButton :isValid="isValidPath" :loading="loading" @click="handleSubmit" @cancel="$emit('cancel')" />
    </div>
  </div>
</template>

<style scoped>
.input-group {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.path-input-container {
  flex: 1;
  position: relative;
  height: 100%;
}

.repository-input {
  width: 100%;
  height: 50px;
  padding: 12px 16px;
  font-size: 16px;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  transition: border-color 0.2s;
}

.repository-input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}

.repository-input.invalid {
  border-color: var(--vp-c-danger-1);
}

.path-warning {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--vp-c-warning-1);
  font-size: 14px;
}

.warning-icon {
  flex-shrink: 0;
  color: var(--vp-c-warning-1);
}

.pack-button-container {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  width: 100%;
}
</style>

<script setup lang="ts">
import { BookmarkPlus, X } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import type { InputMode } from '../../types/tryIt';
import { isValidAbsolutePath } from '../../utils/tryIt/localPathInput';
import {
  deleteTryItPreset,
  derivePresetNameFromPath,
  loadTryItPresets,
  type TryItPreset,
  upsertTryItPreset,
} from '../../utils/tryItPresets';
import { useHomeUiText } from './useHomeUiText';

const props = defineProps<{
  mode: InputMode;
  localPath: string;
  includePatterns: string;
  ignorePatterns: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  apply: [preset: TryItPreset];
}>();

const uiText = useHomeUiText();
const presets = ref<TryItPreset[]>(loadTryItPresets());
const isSaving = ref(false);
const draftName = ref('');

const canSave = computed(() => {
  return props.mode === 'localPath' && isValidAbsolutePath(props.localPath) && !props.loading;
});

const showSection = computed(() => {
  return presets.value.length > 0 || canSave.value || isSaving.value;
});

watch(
  () => props.localPath,
  (path) => {
    if (!isSaving.value) {
      return;
    }
    if (!draftName.value.trim()) {
      draftName.value = derivePresetNameFromPath(path);
    }
  },
);

function refreshPresets() {
  presets.value = loadTryItPresets();
}

function startSave() {
  if (!canSave.value) {
    return;
  }
  isSaving.value = true;
  draftName.value = derivePresetNameFromPath(props.localPath);
}

function cancelSave() {
  isSaving.value = false;
  draftName.value = '';
}

function confirmSave() {
  if (!canSave.value) {
    return;
  }

  presets.value = upsertTryItPreset({
    name: draftName.value,
    localPath: props.localPath,
    includePatterns: props.includePatterns,
    ignorePatterns: props.ignorePatterns,
  });
  isSaving.value = false;
  draftName.value = '';
}

function applyPreset(preset: TryItPreset) {
  if (props.loading) {
    return;
  }
  emit('apply', preset);
}

function removePreset(event: Event, id: string) {
  event.stopPropagation();
  if (props.loading) {
    return;
  }
  presets.value = deleteTryItPreset(id);
}

function presetTooltip(preset: TryItPreset): string {
  const lines = [preset.localPath];
  if (preset.ignorePatterns.trim()) {
    lines.push(`${uiText.value.presets.ignoreLabel}: ${preset.ignorePatterns.trim()}`);
  }
  if (preset.includePatterns.trim()) {
    lines.push(`${uiText.value.presets.includeLabel}: ${preset.includePatterns.trim()}`);
  }
  return lines.join('\n');
}

defineExpose({ refreshPresets });
</script>

<template>
  <section v-if="showSection" class="presets-section" :aria-label="uiText.presets.sectionAria">
    <div class="presets-row">
      <span class="presets-title">{{ uiText.presets.title }}</span>

      <ul v-if="presets.length" class="preset-grid">
        <li v-for="preset in presets" :key="preset.id" class="preset-item">
          <button
            type="button"
            class="preset-card"
            :disabled="loading"
            :title="presetTooltip(preset)"
            :aria-label="uiText.presets.applyAria(preset.name)"
            @click="applyPreset(preset)"
          >
            <span class="preset-name">{{ preset.name }}</span>
          </button>
          <button
            type="button"
            class="delete-button"
            :disabled="loading"
            :aria-label="uiText.presets.deleteAria(preset.name)"
            :title="uiText.presets.deleteAria(preset.name)"
            @click="removePreset($event, preset.id)"
          >
            <X :size="12" />
          </button>
        </li>
      </ul>

      <button
        v-if="canSave && !isSaving"
        type="button"
        class="save-button"
        :disabled="loading"
        :aria-label="uiText.presets.saveAria"
        @click="startSave"
      >
        <BookmarkPlus :size="13" />
        <span>{{ uiText.presets.save }}</span>
      </button>
    </div>

    <div v-if="isSaving" class="save-form">
      <input
        v-model="draftName"
        type="text"
        class="name-input"
        :placeholder="uiText.presets.namePlaceholder"
        :aria-label="uiText.presets.nameAria"
        :disabled="loading"
        @keydown.enter.prevent="confirmSave"
        @keydown.esc.prevent="cancelSave"
      />
      <button type="button" class="primary-button" :disabled="loading" @click="confirmSave">
        {{ uiText.presets.confirmSave }}
      </button>
      <button
        type="button"
        class="ghost-button"
        :disabled="loading"
        :aria-label="uiText.presets.cancelSaveAria"
        @click="cancelSave"
      >
        <X :size="14" />
      </button>
    </div>
  </section>
</template>

<style scoped>
.presets-section {
  margin: 0 0 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.presets-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
}

.presets-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-3);
  flex-shrink: 0;
  margin-right: 2px;
}

.preset-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.preset-item {
  position: relative;
  display: inline-flex;
  max-width: 100%;
}

.preset-card {
  max-width: 160px;
  min-height: 28px;
  padding: 4px 22px 4px 10px;
  border: 1px solid var(--vp-c-border);
  border-radius: 999px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 12px;
  line-height: 1.2;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
}

.preset-card:hover:not(:disabled) {
  border-color: var(--vp-c-brand-1);
  background: color-mix(in srgb, var(--vp-c-brand-1) 8%, var(--vp-c-bg));
  color: var(--vp-c-brand-1);
}

.preset-name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-button {
  position: absolute;
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--vp-c-text-3);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.55;
  transition: opacity 0.15s ease, color 0.15s ease, background-color 0.15s ease;
}

.preset-item:hover .delete-button,
.preset-item:focus-within .delete-button {
  opacity: 1;
}

.delete-button:hover:not(:disabled) {
  color: var(--vp-c-danger-1, #e11d48);
  background: color-mix(in srgb, var(--vp-c-danger-1, #e11d48) 12%, transparent);
}

.save-button,
.primary-button,
.ghost-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 1px solid var(--vp-c-border);
  border-radius: 999px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
}

.save-button {
  min-height: 28px;
  padding: 0 10px;
  font-size: 12px;
  color: var(--vp-c-brand-1);
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 35%, var(--vp-c-border));
}

.save-button:hover:not(:disabled) {
  border-color: var(--vp-c-brand-1);
  background: color-mix(in srgb, var(--vp-c-brand-1) 8%, var(--vp-c-bg));
}

.save-form {
  display: flex;
  gap: 6px;
  align-items: center;
}

.name-input {
  flex: 1;
  min-width: 0;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 13px;
}

.name-input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}

.primary-button {
  min-height: 30px;
  padding: 0 12px;
  font-size: 12px;
  border-radius: 8px;
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: white;
}

.ghost-button {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  flex-shrink: 0;
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .preset-card {
    max-width: 140px;
  }

  .save-form {
    flex-wrap: wrap;
  }

  .name-input {
    width: 100%;
  }
}
</style>

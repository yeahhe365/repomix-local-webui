<script setup lang="ts">
import { BookmarkPlus, Check, List, Pencil, X } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import type { InputMode } from '../../types/tryIt';
import type { PackFormat } from '../../types/pack';
import { isValidAbsolutePath } from '../../utils/tryIt/localPathInput';
import {
  deleteTryItPreset,
  derivePresetNameFromSource,
  loadTryItPresets,
  type TryItPreset,
  upsertTryItPreset,
} from '../../utils/tryItPresets';
import { useHomeUiText } from './useHomeUiText';
import TryItPresetManager from './TryItPresetManager.vue';

const props = withDefaults(
  defineProps<{
    mode: InputMode;
    source: string;
    format: PackFormat;
    includePatterns: string;
    ignorePatterns: string;
    loading?: boolean;
    inline?: boolean;
  }>(),
  {
    loading: false,
    inline: false,
  },
);

const emit = defineEmits<{
  apply: [preset: TryItPreset];
  manage: [];
}>();

const uiText = useHomeUiText();
const presets = ref<TryItPreset[]>(loadTryItPresets());
const isSaving = ref(false);
const draftName = ref('');

/** Currently editing preset id (for inline rename), or empty string when not renaming. */
const renamingId = ref('');
const renameDraft = ref('');

const showManager = ref(false);

const canSave = computed(() => {
  return props.mode === 'localPath' && isValidAbsolutePath(props.source) && !props.loading;
});

const showSection = computed(() => {
  return presets.value.length > 0 || canSave.value || isSaving.value;
});

// When saving, auto-fill name from source
watch(
  () => props.source,
  (source) => {
    if (!isSaving.value) return;
    if (!draftName.value.trim()) {
      draftName.value = derivePresetNameFromSource(source, props.mode);
    }
  },
);

function refreshPresets() {
  presets.value = loadTryItPresets();
}

function startSave() {
  if (!canSave.value) return;
  isSaving.value = true;
  draftName.value = derivePresetNameFromSource(props.source, props.mode);
}

function cancelSave() {
  isSaving.value = false;
  draftName.value = '';
}

function confirmSave() {
  if (!canSave.value) return;

  presets.value = upsertTryItPreset({
    name: draftName.value,
    mode: 'localPath',
    source: props.source,
    format: props.format,
    includePatterns: props.includePatterns,
    ignorePatterns: props.ignorePatterns,
  });
  isSaving.value = false;
  draftName.value = '';
}

function applyPreset(preset: TryItPreset) {
  if (props.loading) return;
  emit('apply', preset);
}

function removePreset(event: Event, id: string) {
  event.stopPropagation();
  if (props.loading) return;
  presets.value = deleteTryItPreset(id);
}

// ── Inline rename ──
function startRename(event: Event, preset: TryItPreset) {
  event.stopPropagation();
  if (props.loading) return;
  renamingId.value = preset.id;
  renameDraft.value = preset.name;
}

function cancelRename() {
  renamingId.value = '';
  renameDraft.value = '';
}

function confirmRename(preset: TryItPreset) {
  const name = renameDraft.value.trim() || preset.name;
  presets.value = upsertTryItPreset({
    id: preset.id,
    name,
    mode: preset.mode,
    source: preset.source,
    format: preset.format,
    includePatterns: preset.includePatterns,
    ignorePatterns: preset.ignorePatterns,
  });
  renamingId.value = '';
  renameDraft.value = '';
}

/** Overwrite the existing preset with the current page options (mode, source, format, patterns). */
function overwritePreset(event: Event, preset: TryItPreset) {
  event.stopPropagation();
  if (props.loading) return;
  presets.value = upsertTryItPreset({
    id: preset.id,
    name: preset.name,
    mode: props.mode,
    source: props.source,
    format: props.format,
    includePatterns: props.includePatterns,
    ignorePatterns: props.ignorePatterns,
  });
}

function presetTooltip(preset: TryItPreset): string {
  const lines = [`${preset.mode}: ${preset.source}`];
  if (preset.format) {
    lines.push(`Format: ${preset.format}`);
  }
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
  <section
    v-if="showSection"
    class="presets-section"
    :class="{ 'presets-section--inline': inline }"
    :aria-label="uiText.presets.sectionAria"
  >
    <div class="presets-header-row">
      <div class="presets-row">
        <span class="presets-title">{{ uiText.presets.title }}</span>

        <ul v-if="presets.length" class="preset-grid">
          <li v-for="preset in presets" :key="preset.id" class="preset-item">
            <!-- Inline rename mode -->
            <div v-if="renamingId === preset.id" class="rename-form">
              <input
                v-model="renameDraft"
                type="text"
                class="rename-input"
                :placeholder="uiText.presets.namePlaceholder"
                :aria-label="uiText.presets.nameAria"
                :disabled="loading"
                @keydown.enter.prevent="confirmRename(preset)"
                @keydown.esc.prevent="cancelRename"
                @click.stop
              />
              <button
                type="button"
                class="rename-confirm icon-button"
                :disabled="loading"
                :aria-label="uiText.presets.confirmSave"
                @click="confirmRename(preset)"
              >
                <Check :size="12" />
              </button>
            </div>
            <!-- Normal chip -->
            <template v-else>
              <button
                type="button"
                class="preset-card"
                :disabled="loading"
                :title="presetTooltip(preset)"
                :aria-label="uiText.presets.applyAria(preset.name)"
                @click="applyPreset(preset)"
              >
                <span class="preset-name">{{ preset.name }}</span>
                <span class="preset-format">{{ preset.format }}</span>
              </button>
              <button
                type="button"
                class="icon-btn edit-btn"
                :disabled="loading"
                :aria-label="uiText.presets.editAria(preset.name)"
                :title="uiText.presets.editAria(preset.name)"
                @click="startRename($event, preset)"
              >
                <Pencil :size="11" />
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
            </template>
          </li>
        </ul>

        <button
          v-if="presets.length > 0"
          type="button"
          class="manage-button"
          :disabled="loading"
          :aria-label="uiText.presets.manageAria"
          :title="uiText.presets.manageAria"
          @click="showManager = true"
        >
          <List :size="13" />
        </button>

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

  <TryItPresetManager
    :open="showManager"
    @update:open="showManager = $event"
    @applied="refreshPresets"
  />
</template>

<style scoped>
.presets-section {
  margin: 0 0 var(--amc-space-3, 12px);
  display: flex;
  flex-direction: column;
  gap: var(--amc-space-2, 8px);
}

.presets-section--inline {
  margin: 0;
}

.presets-section--inline .presets-header-row {
  display: inline-flex;
}

.presets-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px var(--amc-space-2, 8px);
}

.presets-title {
  font-size: var(--amc-text-xs, 12px);
  font-weight: 600;
  color: var(--amc-text-subtle, var(--vp-c-text-3));
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
  align-items: center;
}

.preset-card {
  max-width: 160px;
  min-height: 28px;
  padding: 4px 10px;
  border: 1px solid var(--amc-border, var(--vp-c-border));
  border-radius: var(--amc-radius-pill, 999px);
  background: var(--amc-surface, var(--vp-c-bg));
  color: var(--amc-text, var(--vp-c-text-1));
  font-size: var(--amc-text-xs, 12px);
  line-height: 1.2;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: border-color var(--amc-transition, 0.15s ease), background-color var(--amc-transition, 0.15s ease),
    color var(--amc-transition, 0.15s ease);
}

.preset-card:hover:not(:disabled) {
  border-color: var(--amc-accent, var(--vp-c-brand-1));
  background: color-mix(in srgb, var(--amc-accent, var(--vp-c-brand-1)) 8%, var(--amc-surface, var(--vp-c-bg)));
  color: var(--amc-accent, var(--vp-c-brand-1));
}

.preset-name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preset-format {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--amc-text-subtle, var(--vp-c-text-3));
  border: 1px solid var(--amc-border, var(--vp-c-border));
  border-radius: var(--amc-radius-pill, 999px);
  padding: 1px 5px;
  flex-shrink: 0;
}

.delete-button,
.edit-btn {
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--amc-text-subtle, var(--vp-c-text-3));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.4;
  transition: opacity var(--amc-transition, 0.15s ease), color var(--amc-transition, 0.15s ease),
    background-color var(--amc-transition, 0.15s ease);
}

.preset-item:hover .delete-button,
.preset-item:hover .edit-btn,
.preset-item:focus-within .delete-button,
.preset-item:focus-within .edit-btn {
  opacity: 0.7;
}

.edit-btn {
  margin-right: -2px;
}

.edit-btn:hover:not(:disabled) {
  opacity: 1;
  color: var(--amc-accent, var(--vp-c-brand-1));
  background: color-mix(in srgb, var(--amc-accent, var(--vp-c-brand-1)) 10%, transparent);
}

.delete-button:hover:not(:disabled) {
  opacity: 1;
  color: var(--amc-danger, #e11d48);
  background: color-mix(in srgb, var(--amc-danger, #e11d48) 12%, transparent);
}

.save-button,
.primary-button,
.ghost-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 1px solid var(--amc-border, var(--vp-c-border));
  border-radius: var(--amc-radius-pill, 999px);
  background: var(--amc-surface, var(--vp-c-bg));
  color: var(--amc-text-muted, var(--vp-c-text-2));
  cursor: pointer;
  transition: border-color var(--amc-transition, 0.15s ease), background-color var(--amc-transition, 0.15s ease),
    color var(--amc-transition, 0.15s ease);
}

.save-button {
  min-height: 28px;
  padding: 0 10px;
  font-size: var(--amc-text-xs, 12px);
  color: var(--amc-accent, var(--vp-c-brand-1));
  border-color: color-mix(in srgb, var(--amc-accent, var(--vp-c-brand-1)) 35%, var(--amc-border, var(--vp-c-border)));
}

.save-button:hover:not(:disabled) {
  border-color: var(--amc-accent, var(--vp-c-brand-1));
  background: color-mix(in srgb, var(--amc-accent, var(--vp-c-brand-1)) 8%, var(--amc-surface, var(--vp-c-bg)));
}

.manage-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--amc-border, var(--vp-c-border));
  border-radius: var(--amc-radius, 6px);
  background: var(--amc-surface, var(--vp-c-bg));
  color: var(--amc-text-subtle, var(--vp-c-text-3));
  cursor: pointer;
  transition: border-color var(--amc-transition, 0.15s ease), background-color var(--amc-transition, 0.15s ease),
    color var(--amc-transition, 0.15s ease);
}

.manage-button:hover:not(:disabled) {
  border-color: var(--amc-accent, var(--vp-c-brand-1));
  color: var(--amc-accent, var(--vp-c-brand-1));
  background: color-mix(in srgb, var(--amc-accent, var(--vp-c-brand-1)) 8%, var(--amc-surface, var(--vp-c-bg)));
}

.save-form {
  display: flex;
  gap: 6px;
  align-items: center;
}

.name-input {
  flex: 1;
  min-width: 0;
  height: var(--amc-control-h-sm, 32px);
  padding: 0 var(--amc-space-3, 12px);
  border: 1px solid var(--amc-border, var(--vp-c-border));
  border-radius: var(--amc-radius, 6px);
  background: var(--amc-surface, var(--vp-c-bg));
  color: var(--amc-text, var(--vp-c-text-1));
  font-size: var(--amc-text-sm, 13px);
}

.name-input:focus {
  outline: none;
  border-color: var(--amc-accent, var(--vp-c-brand-1));
}

/* Inline rename */
.rename-form {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.rename-input {
  width: 120px;
  height: 28px;
  padding: 0 8px;
  border: 1px solid var(--amc-accent, var(--vp-c-brand-1));
  border-radius: var(--amc-radius, 6px);
  background: var(--amc-surface, var(--vp-c-bg));
  color: var(--amc-text, var(--vp-c-text-1));
  font-size: var(--amc-text-xs, 12px);
}

.rename-input:focus {
  outline: none;
}

.rename-confirm {
  width: 20px;
  height: 20px;
}

.primary-button {
  min-height: var(--amc-control-h-sm, 32px);
  padding: 0 12px;
  font-size: var(--amc-text-xs, 12px);
  border-radius: var(--amc-radius, 6px);
  background: var(--amc-accent, var(--vp-c-brand-1));
  border-color: var(--amc-accent, var(--vp-c-brand-1));
  color: var(--amc-accent-on, #fff);
}

.ghost-button {
  width: var(--amc-control-h-sm, 32px);
  height: var(--amc-control-h-sm, 32px);
  border-radius: var(--amc-radius, 6px);
  flex-shrink: 0;
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: var(--amc-radius, 6px);
  background: transparent;
  color: var(--amc-text-muted, var(--vp-c-text-2));
  cursor: pointer;
  transition: color var(--amc-transition, 0.15s ease), background-color var(--amc-transition, 0.15s ease);
}

.icon-button:hover:not(:disabled) {
  color: var(--amc-accent, var(--vp-c-brand-1));
  background: color-mix(in srgb, var(--amc-accent, var(--vp-c-brand-1)) 8%, var(--amc-surface, var(--vp-c-bg)));
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

  .rename-input {
    width: 100px;
  }
}
</style>

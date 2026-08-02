<script setup lang="ts">
import { Check, ChevronDown, ChevronUp, GripVertical, Pencil, Search, X } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import {
  deleteTryItPreset,
  loadTryItPresets,
  reorderTryItPresets,
  type TryItPreset,
  upsertTryItPreset,
} from '../../utils/tryItPresets';
import { useHomeUiText } from './useHomeUiText';

const props = withDefaults(
  defineProps<{
    open: boolean;
  }>(),
  { open: false },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
  applied: [];
}>();

const uiText = useHomeUiText();
const presets = ref<TryItPreset[]>(loadTryItPresets());
const searchQuery = ref('');

/** Id of the preset currently being renamed inline. Empty when not renaming. */
const editingId = ref('');
const editDraft = ref('');

const filteredPresets = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return presets.value;
  return presets.value.filter((p) => p.name.toLowerCase().includes(query) || p.source.toLowerCase().includes(query));
});

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      presets.value = loadTryItPresets();
      searchQuery.value = '';
      editingId.value = '';
    }
  },
);

function close() {
  emit('update:open', false);
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && !editingId.value) {
    close();
  }
}

// ── Inline rename ──
function startEdit(preset: TryItPreset) {
  editingId.value = preset.id;
  editDraft.value = preset.name;
}

function cancelEdit() {
  editingId.value = '';
  editDraft.value = '';
}

function confirmEdit(preset: TryItPreset) {
  const name = editDraft.value.trim() || preset.name;
  presets.value = upsertTryItPreset({
    id: preset.id,
    name,
    mode: preset.mode,
    source: preset.source,
    format: preset.format,
    includePatterns: preset.includePatterns,
    ignorePatterns: preset.ignorePatterns,
  });
  editingId.value = '';
  editDraft.value = '';
}

function removePreset(id: string) {
  presets.value = deleteTryItPreset(id);
}

// ── Drag and drop reorder ──
let dragIndex: number | null = null;

function isSearchActive(): boolean {
  return searchQuery.value.trim().length > 0;
}

function onDragStart(event: DragEvent, index: number) {
  if (isSearchActive()) {
    event.preventDefault();
    return;
  }
  dragIndex = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
  }
}

function onDragOver(event: DragEvent, index: number) {
  event.preventDefault();
  if (isSearchActive() || dragIndex === null || dragIndex === index) return;

  // Reorder the real presets array so the change is visible immediately
  const items = [...presets.value];
  const [moved] = items.splice(dragIndex, 1);
  items.splice(index, 0, moved);
  presets.value = items;
  dragIndex = index;
}

function onDragEnd() {
  if (dragIndex === null) return;
  dragIndex = null;
  // Persist the full list order
  presets.value = reorderTryItPresets(presets.value.map((p) => p.id));
}

// ── Arrow-button reorder (always on full list) ──
function moveUp(id: string) {
  if (isSearchActive()) return;
  const idx = presets.value.findIndex((p) => p.id === id);
  if (idx <= 0) return;
  const ids = presets.value.map((p) => p.id);
  [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
  presets.value = reorderTryItPresets(ids);
}

function moveDown(id: string) {
  if (isSearchActive()) return;
  const idx = presets.value.findIndex((p) => p.id === id);
  if (idx < 0 || idx >= presets.value.length - 1) return;
  const ids = presets.value.map((p) => p.id);
  [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
  presets.value = reorderTryItPresets(ids);
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="manager-overlay" @click.self="close">
      <div
        class="manager-dialog"
        role="dialog"
        aria-modal="true"
        tabindex="0"
        :aria-label="uiText.presets.managerTitle"
        @keydown="handleKeydown"
      >
        <div class="manager-header">
          <h3>{{ uiText.presets.managerTitle }}</h3>
          <button
            type="button"
            class="mg-close icon-btn"
            :aria-label="uiText.upload.localPathBrowserClose"
            @click="close"
          >
            <X :size="18" />
          </button>
        </div>

        <div class="manager-search">
          <Search :size="16" class="mg-search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            class="mg-search-input"
            :placeholder="uiText.presets.managerSearchPlaceholder"
            :aria-label="uiText.presets.managerSearchPlaceholder"
          />
        </div>

        <div v-if="filteredPresets.length === 0" class="manager-empty">
          {{ uiText.presets.managerEmpty }}
        </div>

        <ul v-else class="manager-list">
          <li
            v-for="(preset, index) in filteredPresets"
            :key="preset.id"
            class="manager-item"
            :draggable="!isSearchActive()"
            :class="{ 'manager-item--editing': editingId === preset.id }"
            @dragstart="onDragStart($event, index)"
            @dragover="onDragOver($event, index)"
            @dragend="onDragEnd"
          >
            <!-- Drag handle -->
            <span class="mg-drag-handle" :title="uiText.presets.managerDragHint">
              <GripVertical :size="14" />
            </span>

            <!-- Inline edit -->
            <template v-if="editingId === preset.id">
              <input
                v-model="editDraft"
                type="text"
                class="mg-edit-input"
                :placeholder="uiText.presets.namePlaceholder"
                :aria-label="uiText.presets.nameAria"
                @keydown.enter.prevent="confirmEdit(preset)"
                @keydown.esc.prevent="cancelEdit"
                @keydown.up.stop
                @keydown.down.stop
              />
              <button
                type="button"
                class="mg-edit-confirm icon-btn"
                :aria-label="uiText.presets.confirmSave"
                @click="confirmEdit(preset)"
              >
                <Check :size="14" />
              </button>
              <button
                type="button"
                class="mg-edit-cancel icon-btn"
                :aria-label="uiText.presets.cancelSaveAria"
                @click="cancelEdit"
              >
                <X :size="14" />
              </button>
            </template>

            <!-- Display row -->
            <template v-else>
              <div class="mg-info">
                <span class="mg-name">{{ preset.name }}</span>
                <span class="mg-meta">{{ preset.mode }} · {{ preset.format }}</span>
              </div>
              <div class="mg-actions">
                <button
                  type="button"
                  class="mg-action-btn"
                  :disabled="isSearchActive()"
                  :aria-label="`Move ${preset.name} up`"
                  :title="`Move ${preset.name} up`"
                  @click="moveUp(preset.id)"
                >
                  <ChevronUp :size="14" />
                </button>
                <button
                  type="button"
                  class="mg-action-btn"
                  :disabled="isSearchActive()"
                  :aria-label="`Move ${preset.name} down`"
                  :title="`Move ${preset.name} down`"
                  @click="moveDown(preset.id)"
                >
                  <ChevronDown :size="14" />
                </button>
                <button
                  type="button"
                  class="mg-action-btn"
                  :aria-label="uiText.presets.editAria(preset.name)"
                  :title="uiText.presets.editAria(preset.name)"
                  @click="startEdit(preset)"
                >
                  <Pencil :size="14" />
                </button>
                <button
                  type="button"
                  class="mg-action-btn mg-delete-btn"
                  :aria-label="uiText.presets.deleteAria(preset.name)"
                  :title="uiText.presets.deleteAria(preset.name)"
                  @click="removePreset(preset.id)"
                >
                  <X :size="14" />
                </button>
              </div>
            </template>
          </li>
        </ul>

        <div class="manager-footer">
          <p v-if="!searchQuery.trim()" class="mg-drag-hint">
            {{ uiText.presets.managerDragHint }}
          </p>
          <button type="button" class="primary-button mg-done-btn" @click="close">
            {{ uiText.presets.managerDone }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.manager-overlay {
  position: fixed;
  inset: 0;
  background: rgb(15 23 42 / 45%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
}

.manager-dialog {
  width: min(520px, 100%);
  max-height: min(70vh, 600px);
  display: flex;
  flex-direction: column;
  gap: var(--amc-space-3, 12px);
  background: var(--amc-surface, var(--vp-c-bg));
  border: 1px solid var(--amc-border, var(--vp-c-border));
  border-radius: var(--amc-radius-card, 8px);
  box-shadow: var(--amc-shadow-lg, 0 12px 32px rgb(0 0 0 / 0.08));
  padding: var(--amc-space-4, 16px);
  outline: none;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.manager-header h3 {
  margin: 0;
  font-size: var(--amc-text-lg, 16px);
  font-weight: 600;
  color: var(--amc-text, var(--vp-c-text-1));
}

.manager-search {
  position: relative;
  display: flex;
  align-items: center;
}

.mg-search-icon {
  position: absolute;
  left: 10px;
  color: var(--amc-text-subtle, var(--vp-c-text-3));
  pointer-events: none;
}

.mg-search-input {
  width: 100%;
  height: var(--amc-control-h-sm, 36px);
  border: 1px solid var(--amc-border, var(--vp-c-border));
  border-radius: var(--amc-radius, 6px);
  background: var(--amc-surface, var(--vp-c-bg));
  color: var(--amc-text, var(--vp-c-text-1));
  padding: 0 var(--amc-space-3, 12px) 0 34px;
  font-size: var(--amc-text-sm, 13px);
}

.mg-search-input::placeholder {
  color: var(--amc-text-subtle, var(--vp-c-text-3));
}

.mg-search-input:focus {
  outline: none;
  border-color: var(--amc-accent, var(--vp-c-brand-1));
  box-shadow: 0 0 0 3px var(--amc-accent-soft, var(--vp-c-brand-soft));
}

.manager-empty {
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--amc-text-muted, var(--vp-c-text-2));
  font-size: var(--amc-text-sm, 13px);
}

.manager-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
  flex: 1;
}

.manager-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: var(--amc-radius, 6px);
  background: var(--amc-surface, var(--vp-c-bg));
  cursor: grab;
  transition: background-color var(--amc-transition, 0.15s ease),
    border-color var(--amc-transition, 0.15s ease);
}

.manager-item:hover {
  background: var(--amc-surface-muted, var(--vp-c-bg-soft));
  border-color: var(--amc-border, var(--vp-c-border));
}

.manager-item--editing {
  cursor: default;
  border-color: var(--amc-accent, var(--vp-c-brand-1));
  background: color-mix(in srgb, var(--amc-accent, var(--vp-c-brand-1)) 4%, var(--amc-surface, var(--vp-c-bg)));
}

.mg-drag-handle {
  display: flex;
  align-items: center;
  color: var(--amc-text-subtle, var(--vp-c-text-3));
  flex-shrink: 0;
  cursor: grab;
}

.mg-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mg-name {
  font-size: var(--amc-text-sm, 13px);
  color: var(--amc-text, var(--vp-c-text-1));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mg-meta {
  font-size: 11px;
  color: var(--amc-text-subtle, var(--vp-c-text-3));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mg-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.mg-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--amc-radius, 6px);
  background: transparent;
  color: var(--amc-text-subtle, var(--vp-c-text-3));
  cursor: pointer;
  transition: color var(--amc-transition, 0.15s ease),
    background-color var(--amc-transition, 0.15s ease);
  opacity: 0;
}

.manager-item:hover .mg-action-btn,
.manager-item:focus-within .mg-action-btn {
  opacity: 1;
}

.mg-action-btn:hover {
  color: var(--amc-accent, var(--vp-c-brand-1));
  background: color-mix(in srgb, var(--amc-accent, var(--vp-c-brand-1)) 8%, transparent);
}

.mg-delete-btn:hover {
  color: var(--amc-danger, #e11d48);
  background: color-mix(in srgb, var(--amc-danger, #e11d48) 12%, transparent);
}

/* Inline editing within manager */
.mg-edit-input {
  flex: 1;
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--amc-accent, var(--vp-c-brand-1));
  border-radius: var(--amc-radius, 6px);
  background: var(--amc-surface, var(--vp-c-bg));
  color: var(--amc-text, var(--vp-c-text-1));
  font-size: var(--amc-text-sm, 13px);
}

.mg-edit-input:focus {
  outline: none;
}

.mg-edit-confirm,
.mg-edit-cancel {
  width: 28px;
  height: 28px;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--amc-radius, 6px);
  background: transparent;
  color: var(--amc-text-muted, var(--vp-c-text-2));
  cursor: pointer;
  transition: color var(--amc-transition, 0.15s ease),
    background-color var(--amc-transition, 0.15s ease);
}

.icon-btn:hover {
  color: var(--amc-accent, var(--vp-c-brand-1));
  background: color-mix(in srgb, var(--amc-accent, var(--vp-c-brand-1)) 8%, var(--amc-surface, var(--vp-c-bg)));
}

.mg-close {
  width: var(--amc-control-h-sm, 32px);
  height: var(--amc-control-h-sm, 32px);
}

.manager-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--amc-space-4, 16px);
  border-top: 1px solid var(--amc-border, var(--vp-c-border));
  padding-top: var(--amc-space-3, 12px);
}

.mg-drag-hint {
  margin: 0;
  font-size: var(--amc-text-xs, 12px);
  color: var(--amc-text-subtle, var(--vp-c-text-3));
}

.mg-done-btn {
  flex-shrink: 0;
}

.primary-button {
  display: inline-flex;
  align-items: center;
  gap: var(--amc-space-2, 8px);
  min-height: var(--amc-control-h-sm, 36px);
  padding: 0 var(--amc-space-3, 12px);
  font-size: var(--amc-text-sm, 13px);
  font-weight: 500;
  background: var(--amc-accent, var(--vp-c-brand-1));
  border: 1px solid var(--amc-accent, var(--vp-c-brand-1));
  color: var(--amc-accent-on, #fff);
  border-radius: var(--amc-radius, 6px);
  cursor: pointer;
}

.primary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .manager-overlay {
    padding: 12px;
  }

  .manager-dialog {
    padding: var(--amc-space-4, 16px);
  }

  .manager-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .mg-done-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>

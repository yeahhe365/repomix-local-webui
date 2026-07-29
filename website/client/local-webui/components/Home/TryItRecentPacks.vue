<script setup lang="ts">
import { X } from 'lucide-vue-next';
import { ref } from 'vue';
import type { RecentPack } from '../../utils/tryItRecentPacks';
import { clearRecentPacks, loadRecentPacks } from '../../utils/tryItRecentPacks';
import { useHomeUiText } from './useHomeUiText';

const emit = defineEmits<{
  apply: [pack: RecentPack];
}>();

const props = withDefaults(
  defineProps<{
    inline?: boolean;
  }>(),
  {
    inline: false,
  },
);

const uiText = useHomeUiText();
const recentPacks = ref<RecentPack[]>(loadRecentPacks());

function applyPack(pack: RecentPack) {
  emit('apply', pack);
}

function clearAll() {
  clearRecentPacks();
  recentPacks.value = [];
}

function refresh() {
  recentPacks.value = loadRecentPacks();
}

defineExpose({ refresh });
</script>

<template>
  <section v-if="recentPacks.length" class="recent-section" :class="{ 'recent-section--inline': inline }">
    <div class="recent-row">
      <span class="recent-title">{{ uiText.recentPacks.title }}</span>
      <ul class="recent-grid">
        <li v-for="pack in recentPacks" :key="pack.id" class="recent-item">
          <button
            type="button"
            class="preset-card recent-card"
            :aria-label="uiText.recentPacks.applyAria(pack.label)"
            :title="pack.source"
            @click="applyPack(pack)"
          >
            <span class="preset-name">{{ pack.label }}</span>
            <span class="recent-format">{{ pack.format }}</span>
          </button>
        </li>
      </ul>
      <button type="button" class="clear-link" @click="clearAll">
        <X :size="12" />
        {{ uiText.recentPacks.clearAll }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.recent-section {
  margin: 0 0 var(--amc-space-3, 12px);
}

.recent-section--inline {
  margin: 0;
}

.recent-section--inline .recent-row {
  display: inline-flex;
}

.recent-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px var(--amc-space-2, 8px);
}

.recent-title {
  font-size: var(--amc-text-xs, 12px);
  font-weight: 600;
  color: var(--amc-text-subtle, var(--vp-c-text-3));
  flex-shrink: 0;
  margin-right: 2px;
}

.recent-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.recent-item {
  position: relative;
  display: inline-flex;
  max-width: 100%;
}

/* Reuses .preset-card / .preset-name styling vocabulary so chips match presets. */
.recent-card {
  max-width: 180px;
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

.recent-card:hover {
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

.recent-format {
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

.clear-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: transparent;
  padding: 0;
  font-size: var(--amc-text-xs, 12px);
  color: var(--amc-text-subtle, var(--vp-c-text-3));
  cursor: pointer;
  transition: color var(--amc-transition, 0.15s ease);
  flex-shrink: 0;
}

.clear-link:hover {
  color: var(--amc-accent, var(--vp-c-brand-1));
}
</style>

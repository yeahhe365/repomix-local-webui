<script setup lang="ts">
import { Copy, Terminal } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import type { PackResult } from '../../types/api';
import type { PackOptions } from '../../types/pack';
import { generateCliCommand } from '../../utils/tryIt/cliCommand';
import { useHomeUiText } from './useHomeUiText';

const props = defineProps<{
  result: PackResult;
  packOptions?: PackOptions;
}>();

const uiText = useHomeUiText();
const commandCopied = ref(false);

const cliCommand = computed(() => {
  return generateCliCommand(props.result.metadata.repository, props.packOptions);
});

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
</script>

<template>
  <div class="cli-banner">
    <div class="cli-banner-content">
      <Terminal :size="16" class="cli-banner-icon" />
      <span class="cli-banner-label">{{ uiText.actions.runLocally }}</span>
      <code class="cli-banner-command">{{ cliCommand }}</code>
    </div>
    <button class="cli-banner-copy" @click="handleCopyCommand" :class="{ copied: commandCopied }">
      <Copy :size="14" />
      <span>{{ commandCopied ? uiText.actions.copied : uiText.actions.copy }}</span>
    </button>
  </div>
</template>

<style scoped>
.cli-banner {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px;
  background: var(--vp-c-bg-soft);
  border-top: 1px solid var(--vp-c-border);
}

.cli-banner-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.cli-banner-icon {
  color: var(--vp-c-brand-1);
  flex-shrink: 0;
}

.cli-banner-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  flex-shrink: 0;
}

.cli-banner-command {
  font-size: 13px;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  padding: 4px 8px;
}

.cli-banner-copy {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-brand-1);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cli-banner-copy:hover,
.cli-banner-copy.copied {
  background: var(--vp-c-brand-1);
  color: white;
}

@media (max-width: 768px) {
  .cli-banner {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .cli-banner-content {
    flex-wrap: wrap;
  }

  .cli-banner-command {
    white-space: normal;
    word-break: break-all;
  }

  .cli-banner-copy {
    justify-content: center;
  }
}
</style>

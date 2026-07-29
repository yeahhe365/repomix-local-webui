<script setup lang="ts">
import ace, { type Ace } from 'ace-builds';
import themeTomorrowUrl from 'ace-builds/src-noconflict/theme-tomorrow?url';
import themeTomorrowNightUrl from 'ace-builds/src-noconflict/theme-tomorrow_night?url';
import { useData } from 'vitepress';
import { computed, ref, watch } from 'vue';
import { VAceEditor } from 'vue3-ace-editor';
import type { PackResult } from '../../types/api';
import type { PackOptions } from '../../types/pack';
import { getEditorOptions } from '../../utils/tryIt/resultViewer';
import SupportMessage from './SupportMessage.vue';
import TryItOutputActions from './TryItOutputActions.vue';
import TryItResultSummaryBar from './TryItResultSummaryBar.vue';

ace.config.setModuleUrl('ace/theme/tomorrow', themeTomorrowUrl);
ace.config.setModuleUrl('ace/theme/tomorrow_night', themeTomorrowNightUrl);

const lightTheme = 'tomorrow';
const darkTheme = 'tomorrow_night';

defineProps<{
  result: PackResult;
  packOptions?: PackOptions;
}>();

const { isDark } = useData();
const editorInstance = ref<Ace.Editor | null>(null);

const editorOptions = computed(() => ({
  ...getEditorOptions(),
  theme: isDark.value ? `ace/theme/${darkTheme}` : `ace/theme/${lightTheme}`,
}));

watch(isDark, (newIsDark) => {
  if (editorInstance.value) {
    editorInstance.value.setTheme(newIsDark ? `ace/theme/${darkTheme}` : `ace/theme/${lightTheme}`);
  }
});

const handleEditorMount = (editor: Ace.Editor) => {
  editorInstance.value = editor;
};
</script>

<template>
  <div class="content-wrapper">
    <TryItResultSummaryBar :result="result" />

    <div class="output-panel">
      <TryItOutputActions :result="result" :pack-options="packOptions" variant="floating" />
      <div class="editor-container">
        <VAceEditor
          v-model:value="result.content"
          :lang="'text'"
          :style="{ height: '100%', width: '100%' }"
          :options="editorOptions"
          @mount="handleEditorMount"
        />
      </div>
    </div>

    <div class="support-wrapper">
      <SupportMessage />
    </div>
  </div>
</template>

<style scoped>
.content-wrapper {
  display: flex;
  flex-direction: column;
}

.output-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 500px;
  background: var(--amc-surface, var(--vp-c-bg));
  overflow: hidden;
}

.editor-container {
  height: 100%;
  width: 100%;
  font-family: var(--amc-font-mono, var(--vp-font-family-mono));
}

.support-wrapper {
  margin-top: var(--amc-space-4, 16px);
}

@media (max-width: 768px) {
  .output-panel {
    height: 500px;
  }
}
</style>

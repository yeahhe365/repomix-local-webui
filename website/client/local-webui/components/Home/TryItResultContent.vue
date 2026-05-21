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
import TryItCliCommandBanner from './TryItCliCommandBanner.vue';
import TryItOutputActions from './TryItOutputActions.vue';
import TryItResultMetadata from './TryItResultMetadata.vue';

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
    <TryItResultMetadata :result="result" />

    <div class="output-panel">
      <TryItOutputActions :result="result" />
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

    <TryItCliCommandBanner :result="result" :pack-options="packOptions" />

    <div class="support-wrapper">
      <SupportMessage />
    </div>
  </div>
</template>

<style scoped>
.content-wrapper {
  display: grid;
  grid-template-columns: 300px 1fr;
  grid-template-rows: 445px auto;
}

.output-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 500px;
  background: var(--vp-c-bg);
  overflow: hidden;
}

.editor-container {
  height: 100%;
  width: 100%;
  font-family: var(--vp-font-family-mono);
}

.support-wrapper {
  grid-column: 1 / -1;
}

@media (max-width: 768px) {
  .content-wrapper {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(500px, auto) auto;
    height: auto;
  }

  .output-panel {
    height: 500px;
  }
}
</style>

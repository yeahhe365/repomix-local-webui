<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { FORK_REPOSITORY_URL } from '../shared/projectLinks';

const isDesktop = ref(false);
let mediaQuery: MediaQueryList | null = null;

const updateMatch = (e: MediaQueryListEvent | MediaQueryList) => {
  isDesktop.value = e.matches;
};

onMounted(() => {
  mediaQuery = window.matchMedia('(min-width: 960px)');
  updateMatch(mediaQuery);
  mediaQuery.addEventListener('change', updateMatch);
});

onUnmounted(() => {
  mediaQuery?.removeEventListener('change', updateMatch);
});
</script>

<template>
  <div v-if="isDesktop" class="nav-github-star">
    <iframe
      title="Star yeahhe365/repomix-local-webui on GitHub"
      :src="`https://unpkg.com/github-buttons@2.29.1/dist/buttons.html#href=${encodeURIComponent(FORK_REPOSITORY_URL)}&data-text=Star&data-size=large&data-show-count=true&data-color-scheme=no-preference%3A+light%3B+light%3A+light%3B+dark%3A+dark%3B`"
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      scrolling="no"
      class="github-star-button"
    />
  </div>
</template>

<style scoped>
.nav-github-star {
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--vp-nav-height);
  padding: 0 12px;
}

.github-star-button {
  width: 130px;
  height: 28px;
  border: none;
  color-scheme: light dark;
}
</style>

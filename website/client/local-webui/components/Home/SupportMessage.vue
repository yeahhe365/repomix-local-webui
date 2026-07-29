<script setup lang="ts">
import { Star } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { FORK_REPOSITORY_URL } from '../../../shared/projectLinks';
import { useHomeUiText } from './useHomeUiText';

const uiText = useHomeUiText();

const messages = [
  // {
  //   type: 'sponsor',
  //   link: 'https://github.com/sponsors/yamadashy',
  //   icon: HeartHandshake,
  //   linkText: 'Become a sponsor',
  //   suffix: ' to support Repomix development',
  //   color: '#b04386',
  // },
  {
    type: 'star',
    link: FORK_REPOSITORY_URL,
    icon: Star,
    linkText: uiText.value.support.starLinkText,
    suffix: uiText.value.support.starSuffix,
    color: '#f1c40f',
  },
];

const currentMessageIndex = ref(Math.floor(Math.random() * messages.length));
const supportMessage = computed(() => messages[currentMessageIndex.value]);
</script>

<template>
  <div class="support-banner">
    <a :href="supportMessage.link" target="_blank" rel="noopener noreferrer" class="support-link">
      <component :is="supportMessage.icon" :size="14" class="support-icon" />
      <span class="link-text">{{ supportMessage.linkText }}</span>{{ supportMessage.suffix }}
    </a>
  </div>
</template>

<style scoped>
.support-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--amc-space-2, 8px) var(--amc-space-4, 16px);
  background: var(--amc-surface-muted, var(--vp-c-bg-soft));
  border-top: 1px solid var(--amc-border, var(--vp-c-border));
}

.support-link {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--amc-text-xs, 12px);
  color: var(--amc-text-muted, var(--vp-c-text-2));
  text-decoration: none;
  transition: color var(--amc-transition, 0.15s ease);
}

.support-link:hover {
  color: var(--amc-text, var(--vp-c-text-1));
}

.support-icon {
  flex-shrink: 0;
  color: v-bind('supportMessage.color');
}

.link-text {
  text-decoration: underline;
  text-decoration-color: var(--amc-text-subtle, var(--vp-c-text-3));
  transition: text-decoration-color var(--amc-transition, 0.15s ease);
}

.support-link:hover .link-text {
  text-decoration-color: var(--amc-text, var(--vp-c-text-1));
}
</style>

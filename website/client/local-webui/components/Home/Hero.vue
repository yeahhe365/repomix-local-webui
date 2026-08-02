<script setup>
import { useData } from 'vitepress';
import { useHomeUiText } from './useHomeUiText';

const { site } = useData();
const uiText = useHomeUiText();
</script>

<template>
  <section class="hero">
    <h1 class="hero-title">{{ site.title }}</h1>
    <p class="hero-description">
      {{ uiText.hero.prefix }}
      <span class="hero-description__accent">{{ uiText.hero.accent }}</span>
      {{ uiText.hero.suffix }}
    </p>
  </section>
</template>

<style scoped>
.hero {
  text-align: center;
  padding: var(--amc-space-6, 24px) var(--amc-space-5, 20px) var(--amc-space-5, 20px);
  max-width: 960px;
  margin: 0 auto;
}

.hero-title {
  font-size: 44px;
  font-weight: 750;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin: 0 0 var(--amc-space-3, 12px);
  color: var(--vp-c-text-1);
}

.hero-description {
  max-width: 560px;
  margin: 0 auto;
  font-size: var(--amc-text-lg, 16px);
  font-weight: 500;
  line-height: 1.55;
  color: var(--vp-c-text-2);
}

.hero-description__accent {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 34px;
  }
}
</style>

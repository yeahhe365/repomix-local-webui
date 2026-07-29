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
  padding: var(--amc-space-3, 12px) var(--amc-space-5, 20px) var(--amc-space-2, 8px);
  max-width: 960px;
  margin: 0 auto;
}

.hero-title {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin: 0 0 var(--amc-space-2, 8px);
  color: var(--vp-c-text-1);
}

.hero-description {
  font-size: var(--amc-text-lg, 16px);
  font-weight: 500;
  line-height: 1.5;
  margin: 0;
  color: var(--vp-c-text-2);
}

.hero-description__accent {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 28px;
  }

  .hero-description {
    font-size: 15px;
  }
}
</style>

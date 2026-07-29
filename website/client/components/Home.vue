<script setup>
import Hero from '../local-webui/components/Home/Hero.vue';
import TryIt from '../local-webui/components/Home/TryIt.vue';
import '../local-webui/styles/design-tokens.css';
</script>

<template>
  <div class="home">
    <Hero />
    <TryIt />
  </div>
</template>

<style scoped>
.home {
  padding-bottom: var(--amc-space-5, 40px);
}
</style>

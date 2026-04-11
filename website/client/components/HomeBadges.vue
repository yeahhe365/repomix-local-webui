<template>
  <div class="home-badges">
    <a :href="NPM_PACKAGE_URL" target="_blank" rel="noopener noreferrer">
      <img
        src="https://img.shields.io/npm/v/repomix.svg?maxAge=1000"
        alt="npm version"
      />
    </a>
    <a :href="NPM_PACKAGE_URL" target="_blank" rel="noopener noreferrer">
      <img
        src="https://img.shields.io/npm/d18m/repomix"
        alt="npm downloads"
      />
    </a>

    <a href="https://discord.gg/wNYzTwZFku" target="_blank" rel="noopener noreferrer">
      <img
        src="https://badgen.net/discord/online-members/wNYzTwZFku?icon=discord&label=discord"
        alt="Discord"
      />
    </a>
    <a :href="UPSTREAM_SPONSORS_URL" target="_blank" rel="noopener noreferrer">
      <img
        src="https://img.shields.io/github/sponsors/yamadashy?logo=github"
        alt="Sponsors"
      />
    </a>
    <a :href="FORK_REPOSITORY_URL" target="_blank" rel="noopener noreferrer">
      <img
        src="https://img.shields.io/github/stars/yeahhe365/repomix-local-webui?style=flat&logo=github"
        alt="GitHub stars"
      />
    </a>
  </div>
</template>

<script setup lang="ts">
import { FORK_REPOSITORY_URL, NPM_PACKAGE_URL, UPSTREAM_SPONSORS_URL } from '../shared/projectLinks';
</script>

<style scoped>
.home-badges {
  margin-top: 48px;
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
}

.home-badges img {
  display: inline-block;
}

.home-badges a {
  display: inline-block;
  transition: opacity 0.2s ease;
}

.home-badges a:hover {
  opacity: 0.8;
}

@media (max-width: 768px) {
  .home-badges {
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 32px;
  }
}
</style>

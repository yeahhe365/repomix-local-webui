import { describe, expect, it, vi } from 'vitest';

vi.mock('vitepress', () => ({
  defineConfig: (config: unknown) => config,
}));

describe('siteLocaleConfig', () => {
  it('uses Simplified Chinese as the root locale and keeps English under /en/', async () => {
    const { createSiteLocales, createSiteRewrites } = await import(
      '../../website/client/.vitepress/config/siteLocaleConfig.js'
    );
    const locales = createSiteLocales();
    const rewrites = createSiteRewrites();

    expect(locales.root.label).toBe('简体中文');
    expect(locales.root.lang).toBe('zh-CN');
    expect(locales.en.label).toBe('English');
    expect(locales.en.themeConfig?.nav?.[0]?.link).toBe('/en/guide/');
    expect(rewrites).toEqual({
      'zh-cn/:rest*': ':rest*',
    });
  });
});

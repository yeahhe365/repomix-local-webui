import { describe, expect, it } from 'vitest';
import { getHomeUiText } from '../../website/client/local-webui/components/Home/homeUiText.js';

describe('homeUiText', () => {
  it('returns Chinese UI copy for zh-CN', () => {
    const text = getHomeUiText('zh-CN');

    expect(text.hero.prefix).toBe('将代码库打包为');
    expect(text.actions.pack).toBe('开始打包');
    expect(text.options.outputFormat).toBe('输出格式');
    expect(text.result.tabs.files).toBe('文件选择');
    expect(text.upload.browseLocalPath).toBe('浏览');
    expect(text.upload.localPathBrowserSelectCurrent).toBe('选择当前文件夹');
    expect(text.upload.localPathBrowserKeyboardHint).toBe('方向键选择，回车进入，退格返回，Esc 关闭');
    expect(text.upload.localPathBrowserSearchPlaceholder).toBe('搜索当前目录中的文件夹');
    expect(text.upload.localPathBrowserRecentTitle).toBe('最近访问');
  });

  it('returns English UI copy for en-US', () => {
    const text = getHomeUiText('en-US');

    expect(text.hero.prefix).toBe('Pack your codebase into');
    expect(text.actions.pack).toBe('Pack');
    expect(text.options.outputFormat).toBe('Output Format');
    expect(text.result.tabs.files).toBe('File Selection');
    expect(text.upload.browseLocalPath).toBe('Browse');
    expect(text.upload.localPathBrowserSelectCurrent).toBe('Select current folder');
    expect(text.upload.localPathBrowserKeyboardHint).toBe(
      'Use arrow keys to move, Enter to open, Backspace to go up, Esc to close',
    );
    expect(text.upload.localPathBrowserSearchPlaceholder).toBe('Search folders in the current directory');
    expect(text.upload.localPathBrowserRecentTitle).toBe('Recent');
  });
});

describe('local-webui homeUiText presets', () => {
  it('exposes Chinese and English preset labels', () => {
    expect(getHomeUiText('zh-CN').presets.title).toBe('已保存路径');
    expect(getHomeUiText('zh-CN').presets.save).toBe('保存当前');
    expect(getHomeUiText('en-US').presets.title).toBe('Saved paths');
    expect(getHomeUiText('en-US').presets.save).toBe('Save current');
  });
});

describe('local-webui homeUiText new UI keys', () => {
  it.each([
    ['zh-CN', '高级选项', '更多操作', '清空', '打包完成', '最近打包', '输入有误，请检查后重试', '重试'],
    [
      'en-US',
      'Advanced options',
      'More actions',
      'Clear',
      'Pack finished',
      'Recent packs',
      'Invalid input, please check and retry',
      'Retry',
    ],
  ])(
    'exposes the new action/accordion/error/toast/recentPacks keys for %s',
    (
      lang,
      accordionTitle,
      moreActions,
      clear,
      packSuccess,
      recentTitle,
      kindInput,
      retry,
    ) => {
      const text = getHomeUiText(lang);

      expect(text.actions.moreActions).toBe(moreActions);
      expect(text.actions.clear).toBe(clear);
      expect(text.options.accordion.title).toBe(accordionTitle);
      expect(text.errors.kindInput).toBe(kindInput);
      expect(text.errors.retry).toBe(retry);
      expect(text.toast.packSuccessTitle).toBe(packSuccess);
      expect(text.recentPacks.title).toBe(recentTitle);
    },
  );

  it('exposes the new mode hint and summary bar keys in both locales', () => {
    expect(getHomeUiText('zh-CN').upload.modeHints.localPath).toBe('浏览并选择本机文件夹');
    expect(getHomeUiText('en-US').upload.modeHints.localPath).toBe('Browse and pick a local folder');
    expect(getHomeUiText('zh-CN').result.summaryBar.details).toBe('详情');
    expect(getHomeUiText('en-US').result.summaryBar.details).toBe('Details');
  });

  it('exposes the accordion summary and loading filesProgress as functions', () => {
    const en = getHomeUiText('en-US');
    expect(en.options.accordion.summary('XML', 2)).toBe('XML · 2 customized');
    expect(en.loading.filesProgress(3, 10)).toBe('Processed 3/10 files');

    const zh = getHomeUiText('zh-CN');
    expect(zh.options.accordion.summary('XML', 2)).toBe('XML · 2 项自定义');
    expect(zh.loading.filesProgress(3, 10)).toBe('已处理 3/10 个文件');
  });
});


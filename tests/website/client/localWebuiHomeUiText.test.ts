import { describe, expect, it } from 'vitest';
import { getHomeUiText } from '../../../website/client/local-webui/components/Home/homeUiText';

describe('homeUiText pack & download actions', () => {
  it('exposes packDownload text in zh-CN', () => {
    expect(getHomeUiText('zh-CN').actions.packDownload).toBe('打包并下载');
  });

  it('exposes packDownload text in en-US', () => {
    expect(getHomeUiText('en-US').actions.packDownload).toBe('Pack & Download');
  });

  it('exposes aria and tooltip text for both locales', () => {
    const en = getHomeUiText('en-US').actions;
    expect(en.packDownloadAria).toBeTruthy();
    expect(en.packDownloadTooltip).toBeTruthy();

    const zh = getHomeUiText('zh-CN').actions;
    expect(zh.packDownloadAria).toBeTruthy();
    expect(zh.packDownloadTooltip).toBeTruthy();
  });
});

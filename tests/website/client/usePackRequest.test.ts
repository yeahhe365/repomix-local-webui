import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockHandlePackRequest = vi.fn();
const mockDownloadResult = vi.fn();
const mockSaveTryItPageState = vi.fn();
const mockUpsertRecentPack = vi.fn();

vi.mock('vue', () => ({
  computed: (getter: () => unknown) => ({
    get value() {
      return getter();
    },
  }),
  onMounted: (callback: () => void) => callback(),
  reactive: <T extends object>(value: T) => value,
  ref: <T>(value: T) => ({ value }),
  watch: () => {},
}));

vi.mock('../../../website/client/local-webui/utils/tryIt/requestHandlers', () => ({
  handlePackRequest: mockHandlePackRequest,
}));

vi.mock('../../../website/client/local-webui/utils/tryIt/resultViewer', () => ({
  downloadResult: mockDownloadResult,
}));

vi.mock('../../../website/client/local-webui/utils/tryItRecentPacks', () => ({
  deriveRecentPackLabel: (mode: string, source: string) => `${mode}:${source}`,
  upsertRecentPack: mockUpsertRecentPack,
}));

vi.mock('../../../website/client/local-webui/components/Home/useHomeUiText', () => {
  return {
    useHomeUiText: () => ({
      value: {
        errors: {
          requestTimedOut: 'Request timed out.',
          requestCancelled: 'Request was cancelled.',
          requestCancelledUnknown: 'Request was cancelled with an unknown reason.',
          unexpectedError: 'An unexpected error occurred',
        },
      },
    }),
  };
});

vi.mock('../../../website/client/local-webui/utils/tryIt/remoteValidation', () => ({
  isValidRemoteValue: (value: string) => value.trim().length > 0,
}));

vi.mock('../../../website/client/local-webui/utils/tryIt/localPathInput', () => ({
  isValidAbsolutePath: (value: string) => value.startsWith('/'),
}));

vi.mock('../../../website/client/local-webui/utils/urlParams', () => ({
  parseUrlParameters: () => ({}),
}));

vi.mock('../../../website/client/local-webui/utils/tryItPersistence', () => ({
  loadTryItPageState: () => null,
  resolveInitialTryItPageState: ({ defaultOptions }: { defaultOptions: Record<string, unknown> }) => ({
    mode: 'localPath',
    remoteUrl: '',
    localPath: '',
    packOptions: { ...defaultOptions },
  }),
  saveTryItPageState: mockSaveTryItPageState,
}));

describe('usePackRequest', () => {
  const fakePackResult = {
    content: 'packed content',
    format: 'plain',
    metadata: {
      repository: 'owner/repo',
      timestamp: '2026-01-01T00:00:00Z',
      summary: { totalFiles: 1, totalCharacters: 100, totalTokens: 20 },
      topFiles: [],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockHandlePackRequest.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not schedule an automatic timeout when submitting a pack request', async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const { usePackRequest } = await import('../../../website/client/local-webui/composables/usePackRequest.js');

    const request = usePackRequest();
    request.mode.value = 'url';
    request.inputUrl.value = 'yamadashy/repomix';

    await request.submitRequest();

    expect(mockHandlePackRequest).toHaveBeenCalledOnce();
    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  it('triggers a download after a successful pack via submitAndDownloadRequest', async () => {
    mockHandlePackRequest.mockImplementation(
      async (_url: string, _format: string, _options: unknown, opts: { onSuccess?: (r: unknown) => void }) => {
        opts.onSuccess?.(fakePackResult);
      },
    );

    const { usePackRequest } = await import('../../../website/client/local-webui/composables/usePackRequest.js');
    const request = usePackRequest();
    request.mode.value = 'url';
    request.inputUrl.value = 'yamadashy/repomix';

    await request.submitAndDownloadRequest();

    expect(mockHandlePackRequest).toHaveBeenCalledOnce();
    expect(mockDownloadResult).toHaveBeenCalledOnce();
    expect(mockDownloadResult).toHaveBeenCalledWith('packed content', 'plain', fakePackResult);
  });

  it('does not trigger a download when the pack fails', async () => {
    mockHandlePackRequest.mockImplementation(
      async (_url: string, _format: string, _options: unknown, opts: { onError?: (m: string) => void }) => {
        opts.onError?.('boom');
      },
    );

    const { usePackRequest } = await import('../../../website/client/local-webui/composables/usePackRequest.js');
    const request = usePackRequest();
    request.mode.value = 'url';
    request.inputUrl.value = 'yamadashy/repomix';

    await request.submitAndDownloadRequest();

    expect(mockHandlePackRequest).toHaveBeenCalledOnce();
    expect(mockDownloadResult).not.toHaveBeenCalled();
  });

  it('does not execute when the input is invalid', async () => {
    const { usePackRequest } = await import('../../../website/client/local-webui/composables/usePackRequest.js');
    const request = usePackRequest();

    await request.submitAndDownloadRequest();

    expect(mockHandlePackRequest).not.toHaveBeenCalled();
    expect(mockDownloadResult).not.toHaveBeenCalled();
  });

  it('records a recent pack with the correct mode/source/format on success', async () => {
    mockHandlePackRequest.mockImplementation(
      async (_url: string, _format: string, _options: unknown, opts: { onSuccess?: (r: unknown) => void }) => {
        opts.onSuccess?.(fakePackResult);
      },
    );

    const { usePackRequest } = await import('../../../website/client/local-webui/composables/usePackRequest.js');
    const request = usePackRequest();
    request.mode.value = 'localPath';
    request.inputLocalPath.value = '/Users/jones/Code/MyApp';

    await request.submitRequest();

    expect(mockUpsertRecentPack).toHaveBeenCalledOnce();
    const call = mockUpsertRecentPack.mock.calls[0][0];
    expect(call).toMatchObject({
      mode: 'localPath',
      source: '/Users/jones/Code/MyApp',
      format: 'plain',
    });
  });

  it('does not record a recent pack when the pack fails', async () => {
    mockHandlePackRequest.mockImplementation(
      async (_url: string, _format: string, _options: unknown, opts: { onError?: (m: string) => void }) => {
        opts.onError?.('boom');
      },
    );

    const { usePackRequest } = await import('../../../website/client/local-webui/composables/usePackRequest.js');
    const request = usePackRequest();
    request.mode.value = 'url';
    request.inputUrl.value = 'yamadashy/repomix';

    await request.submitRequest();

    expect(mockUpsertRecentPack).not.toHaveBeenCalled();
  });
});

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { processLocalPath, validateAndResolveLocalPath } from '../../../website/server/src/domains/pack/localPath.js';

describe('localPath mode', () => {
  const originalEnable = process.env.ENABLE_LOCAL_PATH_MODE;
  const originalAllowlist = process.env.LOCAL_PATH_ALLOWLIST;

  beforeEach(() => {
    delete process.env.LOCAL_PATH_ALLOWLIST;
  });

  afterEach(() => {
    if (originalEnable === undefined) {
      delete process.env.ENABLE_LOCAL_PATH_MODE;
    } else {
      process.env.ENABLE_LOCAL_PATH_MODE = originalEnable;
    }

    if (originalAllowlist === undefined) {
      delete process.env.LOCAL_PATH_ALLOWLIST;
    } else {
      process.env.LOCAL_PATH_ALLOWLIST = originalAllowlist;
    }
  });

  it('allows an existing absolute path when local path mode is enabled', async () => {
    process.env.ENABLE_LOCAL_PATH_MODE = 'true';

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'repomix-local-path-'));

    await expect(validateAndResolveLocalPath(tempDir)).resolves.toBe(tempDir);

    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('packs a local directory when local path mode is enabled', async () => {
    process.env.ENABLE_LOCAL_PATH_MODE = 'true';

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'repomix-local-pack-'));
    await fs.writeFile(path.join(tempDir, 'hello.ts'), 'export const hello = "world";\n');

    const result = await processLocalPath(tempDir, 'plain', {});

    expect(result.metadata.repository).toBe(tempDir);
    expect(result.metadata.summary?.totalFiles).toBe(1);
    expect(result.content).toContain('hello = "world"');

    await fs.rm(tempDir, { recursive: true, force: true });
  });
});

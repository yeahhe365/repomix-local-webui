import module from 'node:module';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { compress } from 'hono/compress';
import { localPathBrowseAction } from './actions/localPathBrowseAction.js';
import { packAction } from './actions/packAction.js';
import { cloudLoggerMiddleware } from './middlewares/cloudLogger.js';
import { corsMiddleware } from './middlewares/cors.js';
import { logInfo, logMemoryUsage } from './utils/logger.js';
import { getProcessConcurrency } from './utils/processConcurrency.js';

// Check if running in warmup mode (for compile cache generation)
const isWarmupMode = (): boolean => {
  return process.env.WARMUP_MODE === 'true';
};

// Skip server initialization in warmup mode
if (!isWarmupMode()) {
  // Log server metrics on startup
  logInfo('Server starting', {
    metrics: {
      processConcurrency: getProcessConcurrency(),
      compileCacheDir: module.getCompileCacheDir(),
    },
  });

  // Log initial memory usage
  logMemoryUsage('Server startup', {
    processConcurrency: getProcessConcurrency(),
  });

  const app = new Hono();

  // Configure CORS
  app.use('/*', corsMiddleware);

  // Enable compression
  app.use(compress());

  // Setup custom logger
  app.use('*', cloudLoggerMiddleware());

  // Health check endpoint
  app.get('/health', (c) => c.text('OK'));

  // Main packing endpoint
  app.get('/api/local-path/directories', localPathBrowseAction);
  app.post('/api/pack', packAction);

  // Start server
  const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000;
  logInfo(`Server starting on port ${port}`);

  serve({
    fetch: app.fetch,
    port,
  });
}

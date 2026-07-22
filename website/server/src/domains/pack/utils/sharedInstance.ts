import type { PackResult } from '../../../types.js';
import { RequestCache } from './cache.js';

// Create shared instances
export const cache = new RequestCache<PackResult>(600); // 10 minutes cache

/**
 * Modern caching system for codebehind templates and modules.
 * Uses Map-based caching with automatic size management to prevent memory leaks.
 * Provides significant performance improvements by avoiding redundant parsing and loading.
 */

// Modern caching with Map
export const templateCache = new Map();
export const codebehindCache = new Map();

// Cache management
const MAX_CACHE_SIZE = 100; // Prevent memory leaks

/**
 * Manages cache size to prevent memory leaks.
 * Removes the oldest entry when cache exceeds maximum size.
 * 
 * @function manageCache
 * @param {Map} cache - The cache to manage
 * 
 * @example
 * manageCache(templateCache);
 * manageCache(codebehindCache);
 * 
 * @since 1.0.0
 */
export function manageCache(cache) {
  if (cache.size > MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

/**
 * Gets cache statistics for debugging and monitoring.
 * 
 * @function getCacheStats
 * @returns {Object} Cache statistics including sizes and keys
 * @returns {number} returns.templateCacheSize - Number of cached templates
 * @returns {number} returns.codebehindCacheSize - Number of cached codebehind files
 * @returns {string[]} returns.templateCacheKeys - Array of cached template names
 * @returns {string[]} returns.codebehindCacheKeys - Array of cached codebehind names
 * @returns {string} returns.cacheHitRate - Cache activity status
 * 
 * @example
 * const stats = getCacheStats();
 * console.log('Template cache size:', stats.templateCacheSize);
 * console.log('Codebehind cache size:', stats.codebehindCacheSize);
 * 
 * @since 1.0.0
 */
export function getCacheStats() {
  return {
    templateCacheSize: templateCache.size,
    codebehindCacheSize: codebehindCache.size,
    templateCacheKeys: Array.from(templateCache.keys()),
    codebehindCacheKeys: Array.from(codebehindCache.keys()),
    cacheHitRate: templateCache.size > 0 ? "Active" : "None",
  };
}

/**
 * Clears all caches.
 * Useful for development or when cache invalidation is needed.
 * 
 * @function clearCache
 * 
 * @example
 * clearCache(); // Clears both template and codebehind caches
 * 
 * @since 1.0.0
 */
export function clearCache() {
  templateCache.clear();
  codebehindCache.clear();
}

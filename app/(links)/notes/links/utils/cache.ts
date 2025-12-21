import { logger } from './logger';

/**
 * 网站信息数据接口
 */
export interface WebsiteData {
  title?: string;
  description?: string;
  ico?: string; // 图标 URL
}

/**
 * 缓存数据接口
 */
interface CachedWebsiteData extends WebsiteData {
  timestamp: number; // 缓存时间戳
  expiresIn: number; // 过期时间（毫秒），默认 7 天
}

/**
 * 缓存键前缀
 */
const CACHE_PREFIX = 'website_data_';

/**
 * 默认缓存过期时间：7 天
 */
const DEFAULT_CACHE_EXPIRES = 7 * 24 * 60 * 60 * 1000; // 7 天

/**
 * 获取缓存的 key
 */
function getCacheKey(url: string): string {
  return `${CACHE_PREFIX}${url}`;
}

/**
 * 验证网站数据是否有效
 * 排除明显错误的数据（如 Vercel Security Checkpoint、空数据等）
 */
export function isValidWebsiteData(data: WebsiteData, url: string): boolean {
  // 如果完全没有数据，无效
  if (!data.title && !data.description) {
    return false;
  }
  
  // 检查是否是明显的错误页面标题
  const invalidTitles = [
    'Vercel Security Checkpoint',
    'Security Checkpoint',
    'Just a moment...',
    'Checking your browser',
    'Access Denied',
    '403 Forbidden',
    '404 Not Found',
    'Error',
  ];
  
  if (data.title) {
    const titleLower = data.title.toLowerCase();
    // 如果标题是无效标题，且没有有效的 description，则认为是无效数据
    if (invalidTitles.some(invalid => titleLower.includes(invalid.toLowerCase()))) {
      // 如果有有效的 description，仍然可以使用
      if (data.description && data.description.trim().length > 10) {
        return true;
      }
      console.warn(`[Cache] 检测到无效标题 "${data.title}"，但保留因为有有效描述`);
      return false;
    }
  }
  
  // 如果只有 title 没有 description，仍然有效
  // 如果只有 description 没有 title，也有效
  // 如果两者都有，更有效
  return true;
}

/**
 * 从缓存中读取网站数据
 */
export function getCachedWebsiteData(url: string): WebsiteData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cacheKey = getCacheKey(url);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const data: CachedWebsiteData = JSON.parse(cached);
    const now = Date.now();
    
    // 检查是否过期
    if (now - data.timestamp > data.expiresIn) {
      // 过期，删除缓存
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    // 提取数据
    const websiteData: WebsiteData = {
      title: data.title,
      description: data.description,
      ico: data.ico,
    };
    
    // 验证数据有效性
    if (!isValidWebsiteData(websiteData, url)) {
      console.warn(`[Cache] ${url} 缓存数据无效，清除缓存:`, websiteData);
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    // 返回有效数据
    return websiteData;
  } catch (error) {
    logger.error(`[Cache] 读取缓存失败 (${url}):`, error);
    return null;
  }
}

/**
 * 将网站数据写入缓存
 */
export function setCachedWebsiteData(url: string, data: WebsiteData, expiresIn: number = DEFAULT_CACHE_EXPIRES): void {
  if (typeof window === 'undefined') return;
  
  // 验证数据有效性，无效数据不缓存
  if (!isValidWebsiteData(data, url)) {
    console.warn(`[Cache] ${url} 数据无效，不写入缓存:`, data);
    return;
  }
  
  try {
    const cacheKey = getCacheKey(url);
    const cached: CachedWebsiteData = {
      ...data,
      timestamp: Date.now(),
      expiresIn,
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cached));
    console.log(`[Cache] ${url} 数据已缓存:`, { title: data.title, hasDescription: !!data.description });
  } catch (error) {
    logger.error(`[Cache] 写入缓存失败 (${url}):`, error);
    // localStorage 可能已满，尝试清理旧缓存
    try {
      clearExpiredCache();
    } catch (e) {
      // 清理失败，忽略
    }
  }
}

/**
 * 清理过期的缓存
 * 限制每次最多处理 100 个键，避免内存问题
 */
function clearExpiredCache(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const now = Date.now();
    const keysToRemove: string[] = [];
    const MAX_KEYS_TO_CHECK = 100; // 限制最多检查 100 个键
    let checkedCount = 0;
    
    // 遍历所有 localStorage 键
    for (let i = 0; i < localStorage.length && checkedCount < MAX_KEYS_TO_CHECK; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        checkedCount++;
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const data: CachedWebsiteData = JSON.parse(cached);
            if (now - data.timestamp > data.expiresIn) {
              keysToRemove.push(key);
            }
          }
        } catch {
          // 解析失败，可能是无效数据，删除
          keysToRemove.push(key);
        }
      }
    }
    
    // 删除过期或无效的缓存（限制批量删除数量）
    const keysToDelete = keysToRemove.slice(0, 50); // 每次最多删除 50 个
    keysToDelete.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        logger.error(`[Cache] 删除缓存键失败 (${key}):`, error);
      }
    });
    
    // 如果还有更多需要删除的，延迟处理
    if (keysToRemove.length > keysToDelete.length) {
      logger.warn(`[Cache] 还有 ${keysToRemove.length - keysToDelete.length} 个过期缓存待清理`);
    }
  } catch (error) {
    logger.error('[Cache] 清理过期缓存失败:', error);
  }
}

/**
 * 是否已清理过缓存（避免重复清理）
 */
let hasClearedCache = false;

/**
 * 确保清理过期缓存（只执行一次）
 * 使用 requestIdleCallback 延迟执行，避免阻塞主线程
 */
export function ensureCacheCleared(): void {
  if (!hasClearedCache && typeof window !== 'undefined') {
    // 使用 requestIdleCallback 延迟执行，避免在构建时执行
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        clearExpiredCache();
        hasClearedCache = true;
      }, { timeout: 2000 });
    } else {
      // 降级方案：使用 setTimeout
      setTimeout(() => {
        clearExpiredCache();
        hasClearedCache = true;
      }, 100);
    }
  }
}

/**
 * 获取缓存键（用于调试工具）
 */
export function getCacheKeyForDebug(url: string): string {
  return getCacheKey(url);
}


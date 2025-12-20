'use client';

import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { SiteIcon } from './site-icon';
import type { Site } from './site-links';
import { extractDomain } from './site-utils';

interface SiteCardProps {
  site: Site;
}

/**
 * 日志工具：只在开发环境输出日志
 * 可以通过 NEXT_PUBLIC_ENABLE_LOGS=true 在生产环境启用日志
 */
const isDev = process.env.NODE_ENV === 'development';
const enableLogs = isDev || process.env.NEXT_PUBLIC_ENABLE_LOGS === 'true';

const logger = {
  log: (...args: any[]) => {
    if (enableLogs) console.log(...args);
  },
  warn: (...args: any[]) => {
    if (enableLogs) console.warn(...args);
  },
  error: (...args: any[]) => {
    // 错误日志始终输出，方便排查问题
    console.error(...args);
  },
};

/**
 * 网站信息数据接口
 */
interface WebsiteData {
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
 * API 请求超时时间：8 秒
 */
const API_TIMEOUT = 8000; // 8秒，增加超时时间以提高生产环境的成功率

// 检测是否为国内网站域名
function isChineseWebsite(url: string): boolean {
  try {
    const domain = new URL(url).hostname;
    // 国内顶级域名和二级域名
    const chineseDomains = [
      '.cn', '.com.cn', '.net.cn', '.org.cn', '.gov.cn', '.edu.cn',
      '.hk', '.mo', '.tw', // 港澳台
      // 国内常见网站域名
      'bilibili.com', 'zhihu.com', 'weibo.com', 'baidu.com', 'taobao.com',
      'jd.com', 'douyin.com', 'toutiao.com', 'kuaishou.com'
    ];
    
    return chineseDomains.some(domainPart => domain.endsWith(domainPart));
  } catch (error) {
    logger.error(`[isChineseWebsite] 解析 URL ${url} 失败:`, error);
    return false;
  }
}

/**
 * Microlink 熔断时间：10 分钟
 * 当 Microlink 多次返回 429 或被拦截时，短时间内跳过，直接使用备选方案
 */
const MICROLINK_COOLDOWN = 10 * 60 * 1000; // 10 分钟
const MICROLINK_BLOCKED_KEY = 'microlink_blocked_until';

/**
 * 从 localStorage 读取熔断状态
 */
function getMicrolinkBlockedUntil(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const blockedUntil = localStorage.getItem(MICROLINK_BLOCKED_KEY);
    if (blockedUntil) {
      const timestamp = parseInt(blockedUntil, 10);
      // 如果已经过期，清除
      if (Date.now() >= timestamp) {
        localStorage.removeItem(MICROLINK_BLOCKED_KEY);
        return 0;
      }
      return timestamp;
    }
  } catch (error) {
    logger.error('[Microlink] 读取熔断状态失败:', error);
  }
  return 0;
}

/**
 * 保存熔断状态到 localStorage
 */
function setMicrolinkBlockedUntil(timestamp: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MICROLINK_BLOCKED_KEY, timestamp.toString());
  } catch (error) {
    logger.error('[Microlink] 保存熔断状态失败:', error);
  }
}

/**
 * 获取缓存的 key
 */
function getCacheKey(url: string): string {
  return `${CACHE_PREFIX}${url}`;
}

/**
 * 从缓存中读取网站数据
 */
function getCachedWebsiteData(url: string): WebsiteData | null {
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
    
    // 返回有效数据（排除 timestamp 和 expiresIn）
    return {
      title: data.title,
      description: data.description,
      ico: data.ico,
    };
  } catch (error) {
    logger.error(`[Cache] 读取缓存失败 (${url}):`, error);
    return null;
  }
}

/**
 * 将网站数据写入缓存
 */
function setCachedWebsiteData(url: string, data: WebsiteData, expiresIn: number = DEFAULT_CACHE_EXPIRES): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheKey = getCacheKey(url);
    const cached: CachedWebsiteData = {
      ...data,
      timestamp: Date.now(),
      expiresIn,
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cached));
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
function ensureCacheCleared(): void {
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
 * 请求队列：避免同时发起太多请求导致限流
 * 使用简单的延迟机制，避免同时发起太多请求
 */
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 400; // 最小请求间隔 400ms，减轻 429 风险

// Microlink 请求队列：确保同一时间只有一个请求
let microlinkRequestQueue: Array<() => Promise<void>> = [];
let isProcessingMicrolinkQueue = false;

function isMicrolinkAvailable(): boolean {
  const blockedUntil = getMicrolinkBlockedUntil();
  return Date.now() >= blockedUntil;
}

function blockMicrolink(reason: string) {
  const blockedUntil = Date.now() + MICROLINK_COOLDOWN;
  setMicrolinkBlockedUntil(blockedUntil);
  logger.warn(`[Microlink] 触发熔断，${MICROLINK_COOLDOWN / 60000} 分钟内跳过。原因: ${reason}`);
}

/**
 * 将 Microlink 请求加入队列，确保同一时间只有一个请求
 */
async function queueMicrolinkRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  // 构建时直接返回空对象，避免执行
  if (typeof window === 'undefined') {
    return {} as T;
  }
  
  return new Promise((resolve, reject) => {
    // 限制队列大小，避免内存问题
    if (microlinkRequestQueue.length > 100) {
      logger.warn('[Microlink] 请求队列过长，跳过请求');
      resolve({} as T);
      return;
    }
    
    microlinkRequestQueue.push(async () => {
      try {
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
    
    processMicrolinkQueue();
  });
}

/**
 * 处理 Microlink 请求队列
 */
async function processMicrolinkQueue() {
  // 构建时不执行
  if (typeof window === 'undefined') {
    return;
  }
  
  if (isProcessingMicrolinkQueue || microlinkRequestQueue.length === 0) {
    return;
  }
  
  // 如果 Microlink 被熔断，直接跳过所有请求
  if (!isMicrolinkAvailable()) {
    logger.warn(`[Microlink] 处于熔断期，跳过 ${microlinkRequestQueue.length} 个排队请求`);
    // 清空队列，所有请求都会返回空对象
    microlinkRequestQueue.forEach(request => request());
    microlinkRequestQueue = [];
    return;
  }
  
  isProcessingMicrolinkQueue = true;
  
  // 处理队列中的第一个请求
  const request = microlinkRequestQueue.shift();
  if (request) {
    try {
      await request();
    } catch (error) {
      logger.error('[Microlink] 队列请求处理失败:', error);
    }
    
    // 请求完成后，检查是否被熔断
    if (!isMicrolinkAvailable()) {
      // 如果被熔断，清空剩余队列
      logger.warn(`[Microlink] 检测到熔断状态，清空 ${microlinkRequestQueue.length} 个排队请求`);
      microlinkRequestQueue.forEach(req => req());
      microlinkRequestQueue = [];
      isProcessingMicrolinkQueue = false;
      return;
    }
    
    // 请求完成后，等待一段时间再处理下一个
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL));
  }
  
  isProcessingMicrolinkQueue = false;
  
  // 继续处理队列（如果 Microlink 没有被熔断）
  if (microlinkRequestQueue.length > 0 && isMicrolinkAvailable()) {
    setTimeout(() => processMicrolinkQueue(), MIN_REQUEST_INTERVAL);
  }
}

async function throttleRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    // 如果距离上次请求时间太短，等待一段时间
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  return requestFn();
}

/**
 * 方案一：使用 microlink.io API 获取网站的 title 和 description
 * API 文档: https://microlink.io/docs/api/getting-started/overview
 */
async function fetchDataFromMicrolink(url: string): Promise<WebsiteData> {
  try {
    const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&data=title,description`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    const response = await fetch(apiUrl, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // 检查 HTTP 状态码，如果是错误状态码（如 429），直接返回空对象
    if (!response.ok) {
      // 429 是速率限制错误，应该立即尝试备选方案
      if (response.status === 429) {
        logger.warn(`[Microlink] ${url} 返回 429 速率限制错误，将尝试备选方案`);
        blockMicrolink('429 速率限制');
      } else {
        logger.warn(`[Microlink] ${url} 返回错误状态码: ${response.status}`);
      }
      return {};
    }
    
    // 检查响应内容类型
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      logger.warn(`[Microlink] ${url} 返回非 JSON 响应: ${contentType}`);
      return {};
    }
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      logger.error(`[Microlink] ${url} JSON 解析失败:`, jsonError);
      return {};
    }
    
    // 检查是否是速率限制错误（即使 HTTP 状态码是 200，响应体也可能包含错误）
    if (data.status === 'fail' && (data.code === 'ERATE' || data.code === 'ERATELIMIT')) {
      logger.warn(`[Microlink] ${url} 返回速率限制错误 (${data.code}): ${data.message || '速率限制已到达'}`);
      blockMicrolink(`速率限制错误 (${data.code})`);
      return {};
    }
    
    if (data.status === 'success' && data.data) {
      return {
        title: data.data.title,
        description: data.data.description,
      };
    }
    
    // 其他错误情况
    if (data.status === 'fail') {
      logger.warn(`[Microlink] ${url} 返回错误: ${data.code || 'unknown'} - ${data.message || '未知错误'}`);
    }
    
    return {};
  } catch (error: any) {
    // 检查是否是网络错误或被拦截
    const errorMessage = error?.message || String(error);
    if (errorMessage.includes('ERR_BLOCKED_BY_CLIENT') || 
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('network') ||
        error.name === 'AbortError') {
      logger.warn(`[Microlink] ${url} 请求被拦截或网络错误，将尝试备选方案:`, errorMessage);
      blockMicrolink('被拦截或网络错误');
    } else {
      logger.error(`[Microlink] 获取 ${url} 的数据失败:`, error);
    }
    return {};
  }
}

/**
 * 方案二：使用 api.ahfi.cn API 获取网站的 title 和 description
 * API 文档: https://api.ahfi.cn/api/websiteinfo?url={url}
 */
async function fetchDataFromAhfi(url: string): Promise<WebsiteData> {
  try {
    const apiUrl = `https://api.ahfi.cn/api/websiteinfo?url=${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    const response = await fetch(apiUrl, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // 检查 HTTP 状态码
    if (!response.ok) {
      if (response.status === 429) {
        logger.warn(`[Ahfi] ${url} 返回 429 速率限制错误`);
      } else {
        logger.warn(`[Ahfi] ${url} 返回错误状态码: ${response.status}`);
      }
      return {};
    }
    
    // 检查响应内容类型
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      logger.warn(`[Ahfi] ${url} 返回非 JSON 响应: ${contentType}`);
      return {};
    }
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      logger.error(`[Ahfi] ${url} JSON 解析失败:`, jsonError);
      return {};
    }
    
    if (data.code === 200 && data.data) {
      return {
        title: data.data.title,
        description: data.data.description,
        ico: data.data.ico_url, // Ahfi API 提供 ico_url
      };
    }
    
    return {};
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    if (errorMessage.includes('ERR_BLOCKED_BY_CLIENT') || 
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('network') ||
        error.name === 'AbortError') {
      logger.warn(`[Ahfi] ${url} 请求被拦截或网络错误:`, errorMessage);
    } else {
      logger.error(`[Ahfi] 获取 ${url} 的数据失败:`, error);
    }
    return {};
  }
}

/**
 * 方案三：使用 v2.xxapi.cn API 获取网站的 title 和 description
 * API 文档: https://v2.xxapi.cn/api/tdk?url={url}
 */
async function fetchDataFromXxapi(url: string): Promise<WebsiteData> {
  try {
    const apiUrl = `https://v2.xxapi.cn/api/tdk?url=${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    const response = await fetch(apiUrl, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // 检查 HTTP 状态码
    if (!response.ok) {
      if (response.status === 429) {
        logger.warn(`[Xxapi] ${url} 返回 429 速率限制错误`);
      } else {
        logger.warn(`[Xxapi] ${url} 返回错误状态码: ${response.status}`);
      }
      return {};
    }
    
    // 检查响应内容类型
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      logger.warn(`[Xxapi] ${url} 返回非 JSON 响应: ${contentType}`);
      return {};
    }
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      logger.error(`[Xxapi] ${url} JSON 解析失败:`, jsonError);
      return {};
    }
    
    if (data.code === 200 && data.data) {
      return {
        title: data.data.title,
        description: data.data.description,
      };
    }
    
    return {};
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    if (errorMessage.includes('ERR_BLOCKED_BY_CLIENT') || 
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('network') ||
        error.name === 'AbortError') {
      logger.warn(`[Xxapi] ${url} 请求被拦截或网络错误:`, errorMessage);
    } else {
      logger.error(`[Xxapi] 获取 ${url} 的数据失败:`, error);
    }
    return {};
  }
}

/**
 * 方案四：使用 apis.jxcxin.cn API 获取网站的 title 和 description
 * API 文档: https://apis.jxcxin.cn/api/title?url={url}
 */
async function fetchDataFromJxcxin(url: string): Promise<WebsiteData> {
  try {
    const apiUrl = `https://apis.jxcxin.cn/api/title?url=${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    const response = await fetch(apiUrl, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // 检查 HTTP 状态码
    if (!response.ok) {
      if (response.status === 429) {
        logger.warn(`[Jxcxin] ${url} 返回 429 速率限制错误`);
      } else {
        logger.warn(`[Jxcxin] ${url} 返回错误状态码: ${response.status}`);
      }
      return {};
    }
    
    // 检查响应内容类型
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      logger.warn(`[Jxcxin] ${url} 返回非 JSON 响应: ${contentType}`);
      return {};
    }
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      logger.error(`[Jxcxin] ${url} JSON 解析失败:`, jsonError);
      return {};
    }
    
    if (data.code === 200 && data.data) {
      return {
        title: data.data.title,
        description: data.data.description,
      };
    }
    
    return {};
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    if (errorMessage.includes('ERR_BLOCKED_BY_CLIENT') || 
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('network') ||
        error.name === 'AbortError') {
      logger.warn(`[Jxcxin] ${url} 请求被拦截或网络错误:`, errorMessage);
    } else {
      logger.error(`[Jxcxin] 获取 ${url} 的数据失败:`, error);
    }
    return {};
  }
}

/**
 * 方案五：使用 uapis.cn API 获取网站的 title 和 description
 * API 地址: https://uapis.cn/api/v1/webparse/metadata
 */
async function fetchDataFromUapis(url: string): Promise<WebsiteData> {
  try {
    const apiUrl = `https://uapis.cn/api/v1/webparse/metadata?url=${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    const response = await fetch(apiUrl, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // 检查 HTTP 状态码
    if (!response.ok) {
      if (response.status === 429) {
        logger.warn(`[Uapis] ${url} 返回 429 速率限制错误`);
      } else {
        logger.warn(`[Uapis] ${url} 返回错误状态码: ${response.status}`);
      }
      return {};
    }
    
    // 检查响应内容类型
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      logger.warn(`[Uapis] ${url} 返回非 JSON 响应: ${contentType}`);
      return {};
    }
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      logger.error(`[Uapis] ${url} JSON 解析失败:`, jsonError);
      return {};
    }
    
    // Uapis API 可能返回不同的响应结构，尝试多种格式
    // 格式1: 直接返回 {title, description}
    // 格式2: 包装结构 {code: 200, data: {title, description}}
    // 格式3: 包装结构 {success: true, data: {title, description}}
    if (data.title || data.description) {
      return {
        title: data.title,
        description: data.description,
      };
    }
    
    if (data.code === 200 && data.data) {
      return {
        title: data.data.title,
        description: data.data.description,
      };
    }
    
    if (data.success && data.data) {
      return {
        title: data.data.title,
        description: data.data.description,
      };
    }
    
    return {};
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    if (errorMessage.includes('ERR_BLOCKED_BY_CLIENT') || 
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('network') ||
        error.name === 'AbortError') {
      logger.warn(`[Uapis] ${url} 请求被拦截或网络错误:`, errorMessage);
    } else {
      logger.error(`[Uapis] 获取 ${url} 的数据失败:`, error);
    }
    return {};
  }
}

/**
 * 获取网站信息（优先使用缓存）
 * 国内网站：依次尝试 api.ahfi.cn → microlink.io → v2.xxapi.cn → apis.jxcxin.cn → uapis.cn
 * 国外网站：依次尝试 microlink.io → v2.xxapi.cn → apis.jxcxin.cn → uapis.cn
 */
async function fetchWebsiteData(url: string): Promise<WebsiteData> {
  // 构建时直接返回空对象
  if (typeof window === 'undefined') {
    return {};
  }
  
  // 确保清理过期缓存（只执行一次）
  ensureCacheCleared();
  
  // 先检查缓存
  const cached = getCachedWebsiteData(url);
  if (cached && (cached.title || cached.description)) {
    logger.log(`[fetchWebsiteData] ${url} 使用缓存数据`);
    return cached;
  }
  
  // 缓存未命中或已过期，从 API 获取
  logger.log(`[fetchWebsiteData] ${url} 缓存未命中，从 API 获取`);
  
  const isChinese = isChineseWebsite(url);
  
  // 根据域名类型选择不同的 API 调用顺序
  if (isChinese) {
    logger.log(`[fetchWebsiteData] ${url} 是国内网站，优先使用 Ahfi API`);
    
    // 方案一：国内网站优先使用 Ahfi API
    const ahfiData = await fetchDataFromAhfi(url);
    
    // 如果 ahfi 有数据，使用 ahfi 的数据
    if (ahfiData.title || ahfiData.description) {
      logger.log(`[fetchWebsiteData] ${url} 使用 Ahfi 数据`);
      // 写入缓存
      setCachedWebsiteData(url, ahfiData);
      return ahfiData;
    }
    
    logger.log(`[fetchWebsiteData] ${url} Ahfi 失败，尝试 Microlink`);
    
    // 方案二：Ahfi 失败后尝试 Microlink
    if (isMicrolinkAvailable()) {
      const microlinkData = await queueMicrolinkRequest(() => fetchDataFromMicrolink(url));
      
      // 如果 microlink 返回了 title 或 description，直接使用
      if (microlinkData.title || microlinkData.description) {
        logger.log(`[fetchWebsiteData] ${url} 使用 Microlink 数据`);
        // 写入缓存
        setCachedWebsiteData(url, microlinkData);
        return microlinkData;
      }
      
      logger.log(`[fetchWebsiteData] ${url} Microlink 失败，尝试方案三 (Xxapi)`);
    } else {
      logger.warn(`[fetchWebsiteData] ${url} Microlink 处于熔断冷却期，跳过直接尝试 Xxapi`);
    }
  } else {
    logger.log(`[fetchWebsiteData] ${url} 是国外网站，优先使用 Microlink API`);
    
    // 方案一：国外网站优先使用 microlink.io（使用队列确保同一时间只有一个请求）
    if (isMicrolinkAvailable()) {
      const microlinkData = await queueMicrolinkRequest(() => fetchDataFromMicrolink(url));
      
      // 如果 microlink 返回了 title 或 description，直接使用
      if (microlinkData.title || microlinkData.description) {
        logger.log(`[fetchWebsiteData] ${url} 使用 Microlink 数据`);
        // 写入缓存
        setCachedWebsiteData(url, microlinkData);
        return microlinkData;
      }
      
      logger.log(`[fetchWebsiteData] ${url} Microlink 失败，尝试方案二 (Xxapi)`);
    } else {
      logger.warn(`[fetchWebsiteData] ${url} Microlink 处于熔断冷却期，跳过直接尝试 Xxapi`);
    }
    
    // 国外网站跳过 Ahfi API（可能不支持国外网站）
    logger.log(`[fetchWebsiteData] ${url} 是国外网站，跳过 Ahfi API`);
  }
  
  logger.log(`[fetchWebsiteData] ${url} 尝试方案三 (Xxapi)`);
  
  // 方案三：前两个 API 都失败，尝试 xxapi API
  // 使用 v2.xxapi.cn/api/tdk 格式
  const xxapiData = await fetchDataFromXxapi(url);
  
  // 如果 xxapi 有数据，使用 xxapi 的数据
  if (xxapiData.title || xxapiData.description) {
    logger.log(`[fetchWebsiteData] ${url} 使用 Xxapi 数据`);
    // 写入缓存
    setCachedWebsiteData(url, xxapiData);
    return xxapiData;
  }
  
  logger.log(`[fetchWebsiteData] ${url} Xxapi 失败，尝试方案四 (Jxcxin)`);
  
  // 方案四：前三个 API 都失败，尝试 jxcxin API
  const jxcxinData = await fetchDataFromJxcxin(url);
  
  // 如果 jxcxin 有数据，使用 jxcxin 的数据
  if (jxcxinData.title || jxcxinData.description) {
    logger.log(`[fetchWebsiteData] ${url} 使用 Jxcxin 数据`);
    // 写入缓存
    setCachedWebsiteData(url, jxcxinData);
    return jxcxinData;
  }
  

  
  logger.log(`[fetchWebsiteData] ${url} Jxcxin 失败，尝试方案五 (Uapis)`);
  
  // 方案五：所有其他 API 都失败后，尝试 Uapis API（作为最后的备选方案）
  const uapisData = await fetchDataFromUapis(url);
  
  // 如果 Uapis 有数据，使用 Uapis 的数据
  if (uapisData.title || uapisData.description) {
    logger.log(`[fetchWebsiteData] ${url} 使用 Uapis 数据`);
    // 写入缓存
    setCachedWebsiteData(url, uapisData);
    return uapisData;
  }
  
  logger.log(`[fetchWebsiteData] ${url} Uapis 失败，生成默认描述`);
  
  // 四个 API 都失败，生成默认描述
  const defaultDescription = `访问 ${extractDomain(url)} 网站`;
  const defaultData = { description: defaultDescription };
  
  // 写入缓存，避免下次重复请求
  setCachedWebsiteData(url, defaultData);
  
  return defaultData;
}

// 检查 name 是否需要自动获取（undefined 或空字符串）
function needsAutoFetchName(value: string | undefined): boolean {
  return value === undefined || (value !== undefined && value.trim() === '');
}

// 检查 description 是否需要自动获取
// undefined: 需要自动获取
// 空字符串: 不需要获取，也不显示
// 有值: 直接使用
function needsAutoFetchDescription(value: string | undefined): boolean {
  return value === undefined;
}

export function SiteCard({ site }: SiteCardProps) {
  const [name, setName] = useState<string | undefined>(site.name);
  const [description, setDescription] = useState<string | undefined>(site.description);
  
  // description 是空字符串表示"没有描述"，不需要获取
  const needsName = needsAutoFetchName(site.name);
  const needsDescription = needsAutoFetchDescription(site.description);
  const [isLoading, setIsLoading] = useState(needsName || needsDescription);

  useEffect(() => {
    // 计算是否需要获取
    const shouldFetchName = needsAutoFetchName(site.name);
    const shouldFetchDescription = needsAutoFetchDescription(site.description);
    
    // 如果 name 和 description 都不需要获取，直接返回
    if (!shouldFetchName && !shouldFetchDescription) {
      setIsLoading(false);
      return;
    }

    // 使用 API 自动获取 title 和 description（优先 microlink.io，失败时回退到 api.ahfi.cn）
    fetchWebsiteData(site.url)
      .then((data) => {
        if (data.title && shouldFetchName) {
          setName(data.title);
        }
        // 只有 description 是 undefined 时才自动获取，空字符串不获取
        if (data.description && shouldFetchDescription) {
          setDescription(data.description);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [site.url, site.name, site.description]);

  return (
    <a
      href={site.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block p-5 rounded-xl border-2 border-fd-border bg-fd-card hover:border-fd-primary hover:bg-fd-primary/5 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 no-underline flex flex-col h-full"
    >
      <div className="flex items-start gap-3 mb-3 flex-1">
        <SiteIcon icon={site.icon} name={name || site.url} />
        <div className="flex-1 min-w-0 flex flex-col">
          <h3 className="text-lg font-semibold text-fd-foreground group-hover:text-fd-primary transition-colors line-clamp-1 mb-1 flex items-center gap-2">
            {isLoading && !name ? (
              <span className="italic">正在加载...</span>
            ) : (
              name || site.name || site.url
            )}
            <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </h3>
          <div className="flex-1 min-h-[40px]">
            {(() => {
              // description 是空字符串，不显示任何内容
              if (site.description === '') {
                return null;
              }
              // 正在加载且需要获取 description
              if (isLoading && needsAutoFetchDescription(site.description)) {
                return (
                  <p className="text-sm text-fd-muted-foreground line-clamp-2 italic">
                    正在加载描述...
                  </p>
                );
              }
              // 有 description 则显示
              if (description) {
                return (
                  <p className="text-sm text-fd-muted-foreground line-clamp-2">
                    {description}
                  </p>
                );
              }
              // 最后的保险：如果没有描述，显示一个友好的默认占位符
              return (
                <p className="text-sm text-fd-muted-foreground line-clamp-2">
                  访问 {extractDomain(site.url)} 网站
                </p>
              );
            })()}
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-fd-border">
        <p className="text-xs text-fd-muted-foreground truncate font-mono">
          {site.url}
        </p>
      </div>
    </a>
  );
}


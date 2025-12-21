import { WebsiteData, getCachedWebsiteData, setCachedWebsiteData, ensureCacheCleared, getCacheKeyForDebug, isValidWebsiteData } from './cache';
import { logger } from './logger';
import { isMicrolinkAvailable, queueMicrolinkRequest } from './microlink-queue';
import {
  fetchDataFromMicrolink,
  fetchDataFromAhfi,
  fetchDataFromXxapi,
  fetchDataFromJxcxin,
  fetchDataFromUapis,
} from './api-providers';
import { extractDomain } from '../site-utils';

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

// 全局调试对象，可以在控制台查看 API 调用历史
const debugApiCalls: Map<string, Array<{api: string; success: boolean; hasData: boolean; error?: string; timestamp: number}>> = new Map();

// 暴露到全局，方便在控制台调试
if (typeof window !== 'undefined') {
  (window as any).__debugSiteCardApiCalls = debugApiCalls;
  (window as any).__getSiteCardDebugInfo = (url: string) => {
    return debugApiCalls.get(url) || [];
  };
  // 添加清除缓存的工具函数
  (window as any).__clearSiteCardCache = (url?: string) => {
    if (url) {
      const cacheKey = getCacheKeyForDebug(url);
      localStorage.removeItem(cacheKey);
      console.log(`已清除 ${url} 的缓存`);
    } else {
      // 清除所有缓存
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('website_data_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`已清除 ${keysToRemove.length} 个缓存项`);
    }
  };
}


/**
 * 获取网站信息（优先使用缓存）
 * 国内网站：依次尝试 api.ahfi.cn → microlink.io → v2.xxapi.cn → apis.jxcxin.cn → uapis.cn
 * 国外网站：依次尝试 microlink.io → v2.xxapi.cn → apis.jxcxin.cn → uapis.cn
 */
export async function fetchWebsiteData(url: string): Promise<WebsiteData> {
  // 构建时直接返回空对象
  if (typeof window === 'undefined') {
    console.warn(`[fetchWebsiteData] ${url} 在服务端执行，跳过 API 调用`);
    return {};
  }
  
  // 立即输出调试信息
  console.log(`[fetchWebsiteData] 开始获取: ${url}`, {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent.substring(0, 50),
  });
  
  // 确保清理过期缓存（只执行一次）
  ensureCacheCleared();
  
  // 先检查缓存
  const cached = getCachedWebsiteData(url);
  if (cached) {
    // 检查是否是默认的 description（"访问 xxx 网站"格式），如果是则认为缓存无效
    const defaultDescriptionPattern = /^访问\s+.+\s+网站$/;
    const isDefaultDescription = cached.description && defaultDescriptionPattern.test(cached.description.trim());
    
    if (isDefaultDescription) {
      // 默认 description 说明之前 API 调用失败，清除缓存并重新获取
      console.warn(`[fetchWebsiteData] ${url} 缓存中的 description 是默认值，清除缓存并重新获取`);
      const cacheKey = getCacheKeyForDebug(url);
      try {
        localStorage.removeItem(cacheKey);
      } catch (e) {
        // 忽略清除错误
      }
    } else {
      // 验证缓存数据是否真正有效（有 title 或有效的 description）
      const hasValidTitle = cached.title && cached.title.trim().length > 0;
      const hasValidDescription = cached.description && cached.description.trim().length > 0;
      
      if (hasValidTitle || hasValidDescription) {
        console.log(`[fetchWebsiteData] ${url} 使用有效缓存数据`, cached);
        logger.log(`[fetchWebsiteData] ${url} 使用缓存数据`);
        return cached;
      } else {
        // 缓存数据无效，清除并继续获取
        console.warn(`[fetchWebsiteData] ${url} 缓存数据无效，清除缓存并重新获取`);
        const cacheKey = getCacheKeyForDebug(url);
        try {
          localStorage.removeItem(cacheKey);
        } catch (e) {
          // 忽略清除错误
        }
      }
    }
  }
  
  // 缓存未命中或已过期，从 API 获取
  console.log(`[fetchWebsiteData] ${url} 缓存未命中，开始调用 API`);
  logger.log(`[fetchWebsiteData] ${url} 缓存未命中，从 API 获取`);
  
  // 记录 API 调用结果，用于调试
  const apiResults: Array<{api: string; success: boolean; hasData: boolean; error?: string; timestamp: number}> = [];
  
  // 收集所有 API 返回的数据，用于最后统一处理（如果都没有 description，使用 title）
  const collectedData: Array<{api: string; data: WebsiteData}> = [];
  
  const isChinese = isChineseWebsite(url);
  console.log(`[fetchWebsiteData] ${url} 网站类型: ${isChinese ? '国内' : '国外'}`);
  
  // 根据测试结果优化 API 调用顺序：
  // 国内网站：Ahfi (有description) → Jxcxin (有description) → Xxapi (只有title) → Microlink (不稳定) → Uapis
  // 国外网站：Jxcxin (有description) → Ahfi (有description) → Microlink (不稳定) → Xxapi (只有title) → Uapis
  
  if (isChinese) {
    logger.log(`[fetchWebsiteData] ${url} 是国内网站，优先使用 Ahfi → Jxcxin → Xxapi`);
    
    // 方案一：国内网站优先使用 Ahfi API（测试显示有 title 和 description）
    let ahfiData: WebsiteData;
    try {
      console.log(`[fetchWebsiteData] ${url} 调用 Ahfi API...`);
      ahfiData = await fetchDataFromAhfi(url);
      const hasData = !!(ahfiData.title || ahfiData.description);
      apiResults.push({ api: 'Ahfi', success: true, hasData, timestamp: Date.now() });
      console.log(`[fetchWebsiteData] ${url} Ahfi API 结果:`, { hasData, data: ahfiData });
      
      if (hasData && isValidWebsiteData(ahfiData, url)) {
        logger.log(`[fetchWebsiteData] ${url} 使用 Ahfi 数据`);
        setCachedWebsiteData(url, ahfiData);
        return ahfiData;
      } else if (hasData) {
        console.warn(`[fetchWebsiteData] ${url} Ahfi 返回的数据无效，继续尝试其他 API:`, ahfiData);
        logger.warn(`[fetchWebsiteData] ${url} Ahfi 数据无效，继续尝试其他 API`);
        // 收集数据，可能只有 title
        if (ahfiData.title || ahfiData.description) {
          collectedData.push({ api: 'Ahfi', data: ahfiData });
        }
      }
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      apiResults.push({ api: 'Ahfi', success: false, hasData: false, error: errorMsg, timestamp: Date.now() });
      console.error(`[fetchWebsiteData] ${url} Ahfi API 调用异常:`, error);
      logger.error(`[fetchWebsiteData] ${url} Ahfi API 调用异常:`, error);
    }
    
    logger.log(`[fetchWebsiteData] ${url} Ahfi 失败，尝试 Jxcxin`);
    
    // 方案二：Ahfi 失败后尝试 Jxcxin API（测试显示有 title 和 description）
    let jxcxinData: WebsiteData;
    try {
      console.log(`[fetchWebsiteData] ${url} 调用 Jxcxin API...`);
      jxcxinData = await fetchDataFromJxcxin(url);
      const hasData = !!(jxcxinData.title || jxcxinData.description);
      apiResults.push({ api: 'Jxcxin', success: true, hasData, timestamp: Date.now() });
      console.log(`[fetchWebsiteData] ${url} Jxcxin API 结果:`, { hasData, data: jxcxinData });
      
      if (hasData && isValidWebsiteData(jxcxinData, url)) {
        logger.log(`[fetchWebsiteData] ${url} 使用 Jxcxin 数据`);
        setCachedWebsiteData(url, jxcxinData);
        return jxcxinData;
      } else if (hasData) {
        console.warn(`[fetchWebsiteData] ${url} Jxcxin 返回的数据无效，继续尝试其他 API:`, jxcxinData);
        logger.warn(`[fetchWebsiteData] ${url} Jxcxin 数据无效，继续尝试其他 API`);
        // 收集数据，可能只有 title
        if (jxcxinData.title || jxcxinData.description) {
          collectedData.push({ api: 'Jxcxin', data: jxcxinData });
        }
      }
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      apiResults.push({ api: 'Jxcxin', success: false, hasData: false, error: errorMsg, timestamp: Date.now() });
      console.error(`[fetchWebsiteData] ${url} Jxcxin API 调用异常:`, error);
      logger.error(`[fetchWebsiteData] ${url} Jxcxin API 调用异常:`, error);
    }
    
    logger.log(`[fetchWebsiteData] ${url} Jxcxin 失败，尝试 Xxapi`);
    
    // 方案三：前两个 API 都失败，尝试 Xxapi API（测试显示只有 title，无 description）
    let xxapiData: WebsiteData;
    try {
      console.log(`[fetchWebsiteData] ${url} 调用 Xxapi API...`);
      xxapiData = await fetchDataFromXxapi(url);
      const hasData = !!(xxapiData.title || xxapiData.description);
      apiResults.push({ api: 'Xxapi', success: true, hasData, timestamp: Date.now() });
      console.log(`[fetchWebsiteData] ${url} Xxapi API 结果:`, { hasData, data: xxapiData });
      
      if (hasData && isValidWebsiteData(xxapiData, url)) {
        logger.log(`[fetchWebsiteData] ${url} 使用 Xxapi 数据`);
        setCachedWebsiteData(url, xxapiData);
        return xxapiData;
      } else if (hasData) {
        console.warn(`[fetchWebsiteData] ${url} Xxapi 返回的数据无效，继续尝试其他 API:`, xxapiData);
        logger.warn(`[fetchWebsiteData] ${url} Xxapi 数据无效，继续尝试其他 API`);
        // 收集数据，可能只有 title
        if (xxapiData.title || xxapiData.description) {
          collectedData.push({ api: 'Xxapi', data: xxapiData });
        }
      }
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      apiResults.push({ api: 'Xxapi', success: false, hasData: false, error: errorMsg, timestamp: Date.now() });
      console.error(`[fetchWebsiteData] ${url} Xxapi API 调用异常:`, error);
      logger.error(`[fetchWebsiteData] ${url} Xxapi API 调用异常:`, error);
    }
    
    logger.log(`[fetchWebsiteData] ${url} Xxapi 失败，尝试 Microlink`);
    
    // 方案四：尝试 Microlink API（测试显示不稳定，容易超时）
    if (isMicrolinkAvailable()) {
      let microlinkData: WebsiteData;
      try {
        console.log(`[fetchWebsiteData] ${url} 调用 Microlink API...`);
        microlinkData = await queueMicrolinkRequest(() => fetchDataFromMicrolink(url));
        const hasData = !!(microlinkData.title || microlinkData.description);
        apiResults.push({ api: 'Microlink', success: true, hasData, timestamp: Date.now() });
        console.log(`[fetchWebsiteData] ${url} Microlink API 结果:`, { hasData, data: microlinkData });
        
        if (hasData && isValidWebsiteData(microlinkData, url)) {
          logger.log(`[fetchWebsiteData] ${url} 使用 Microlink 数据`);
          setCachedWebsiteData(url, microlinkData);
          return microlinkData;
        } else if (hasData) {
          console.warn(`[fetchWebsiteData] ${url} Microlink 返回的数据无效，继续尝试其他 API:`, microlinkData);
          logger.warn(`[fetchWebsiteData] ${url} Microlink 数据无效，继续尝试其他 API`);
          // 收集数据，可能只有 title
          if (microlinkData.title || microlinkData.description) {
            collectedData.push({ api: 'Microlink', data: microlinkData });
          }
        }
      } catch (error: any) {
        const errorMsg = error?.message || String(error);
        apiResults.push({ api: 'Microlink', success: false, hasData: false, error: errorMsg, timestamp: Date.now() });
        console.error(`[fetchWebsiteData] ${url} Microlink API 调用异常:`, error);
        logger.error(`[fetchWebsiteData] ${url} Microlink API 调用异常:`, error);
      }
    } else {
      logger.warn(`[fetchWebsiteData] ${url} Microlink 处于熔断冷却期，跳过`);
      apiResults.push({ api: 'Microlink', success: false, hasData: false, error: '熔断冷却期', timestamp: Date.now() });
    }
  } else {
    logger.log(`[fetchWebsiteData] ${url} 是国外网站，优先使用 Jxcxin → Ahfi → Microlink`);
    
    // 方案一：国外网站优先使用 Jxcxin API（测试显示表现好）
    let jxcxinData: WebsiteData;
    try {
      console.log(`[fetchWebsiteData] ${url} 调用 Jxcxin API...`);
      jxcxinData = await fetchDataFromJxcxin(url);
      const hasData = !!(jxcxinData.title || jxcxinData.description);
      apiResults.push({ api: 'Jxcxin', success: true, hasData, timestamp: Date.now() });
      console.log(`[fetchWebsiteData] ${url} Jxcxin API 结果:`, { hasData, data: jxcxinData });
      
      if (hasData && isValidWebsiteData(jxcxinData, url)) {
        logger.log(`[fetchWebsiteData] ${url} 使用 Jxcxin 数据`);
        setCachedWebsiteData(url, jxcxinData);
        return jxcxinData;
      } else if (hasData) {
        console.warn(`[fetchWebsiteData] ${url} Jxcxin 返回的数据无效，继续尝试其他 API:`, jxcxinData);
        logger.warn(`[fetchWebsiteData] ${url} Jxcxin 数据无效，继续尝试其他 API`);
        // 收集数据，可能只有 title
        if (jxcxinData.title || jxcxinData.description) {
          collectedData.push({ api: 'Jxcxin', data: jxcxinData });
        }
      }
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      apiResults.push({ api: 'Jxcxin', success: false, hasData: false, error: errorMsg, timestamp: Date.now() });
      console.error(`[fetchWebsiteData] ${url} Jxcxin API 调用异常:`, error);
      logger.error(`[fetchWebsiteData] ${url} Jxcxin API 调用异常:`, error);
    }
    
    logger.log(`[fetchWebsiteData] ${url} Jxcxin 失败，尝试 Ahfi`);
    
    // 方案二：Jxcxin 失败后尝试 Ahfi API
    let ahfiData: WebsiteData;
    try {
      console.log(`[fetchWebsiteData] ${url} 调用 Ahfi API...`);
      ahfiData = await fetchDataFromAhfi(url);
      const hasData = !!(ahfiData.title || ahfiData.description);
      apiResults.push({ api: 'Ahfi', success: true, hasData, timestamp: Date.now() });
      console.log(`[fetchWebsiteData] ${url} Ahfi API 结果:`, { hasData, data: ahfiData });
      
      if (hasData && isValidWebsiteData(ahfiData, url)) {
        logger.log(`[fetchWebsiteData] ${url} 使用 Ahfi 数据`);
        setCachedWebsiteData(url, ahfiData);
        return ahfiData;
      } else if (hasData) {
        console.warn(`[fetchWebsiteData] ${url} Ahfi 返回的数据无效，继续尝试其他 API:`, ahfiData);
        logger.warn(`[fetchWebsiteData] ${url} Ahfi 数据无效，继续尝试其他 API`);
        // 收集数据，可能只有 title
        if (ahfiData.title || ahfiData.description) {
          collectedData.push({ api: 'Ahfi', data: ahfiData });
        }
      }
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      apiResults.push({ api: 'Ahfi', success: false, hasData: false, error: errorMsg, timestamp: Date.now() });
      console.error(`[fetchWebsiteData] ${url} Ahfi API 调用异常:`, error);
      logger.error(`[fetchWebsiteData] ${url} Ahfi API 调用异常:`, error);
    }
    
    logger.log(`[fetchWebsiteData] ${url} Ahfi 失败，尝试 Microlink`);
    
    // 方案三：尝试 Microlink API（可能对国外网站更好，但不稳定）
    if (isMicrolinkAvailable()) {
      let microlinkData: WebsiteData;
      try {
        console.log(`[fetchWebsiteData] ${url} 调用 Microlink API...`);
        microlinkData = await queueMicrolinkRequest(() => fetchDataFromMicrolink(url));
        const hasData = !!(microlinkData.title || microlinkData.description);
        apiResults.push({ api: 'Microlink', success: true, hasData, timestamp: Date.now() });
        console.log(`[fetchWebsiteData] ${url} Microlink API 结果:`, { hasData, data: microlinkData });
        
        if (hasData && isValidWebsiteData(microlinkData, url)) {
          logger.log(`[fetchWebsiteData] ${url} 使用 Microlink 数据`);
          setCachedWebsiteData(url, microlinkData);
          return microlinkData;
        } else if (hasData) {
          console.warn(`[fetchWebsiteData] ${url} Microlink 返回的数据无效，继续尝试其他 API:`, microlinkData);
          logger.warn(`[fetchWebsiteData] ${url} Microlink 数据无效，继续尝试其他 API`);
          // 收集数据，可能只有 title
          if (microlinkData.title || microlinkData.description) {
            collectedData.push({ api: 'Microlink', data: microlinkData });
          }
        }
      } catch (error: any) {
        const errorMsg = error?.message || String(error);
        apiResults.push({ api: 'Microlink', success: false, hasData: false, error: errorMsg, timestamp: Date.now() });
        console.error(`[fetchWebsiteData] ${url} Microlink API 调用异常:`, error);
        logger.error(`[fetchWebsiteData] ${url} Microlink API 调用异常:`, error);
      }
    } else {
      logger.warn(`[fetchWebsiteData] ${url} Microlink 处于熔断冷却期，跳过`);
      apiResults.push({ api: 'Microlink', success: false, hasData: false, error: '熔断冷却期', timestamp: Date.now() });
    }
    
    logger.log(`[fetchWebsiteData] ${url} Microlink 失败，尝试 Xxapi`);
    
    // 方案四：尝试 Xxapi API（只有 title，无 description）
    let xxapiData: WebsiteData;
    try {
      console.log(`[fetchWebsiteData] ${url} 调用 Xxapi API...`);
      xxapiData = await fetchDataFromXxapi(url);
      const hasData = !!(xxapiData.title || xxapiData.description);
      apiResults.push({ api: 'Xxapi', success: true, hasData, timestamp: Date.now() });
      console.log(`[fetchWebsiteData] ${url} Xxapi API 结果:`, { hasData, data: xxapiData });
      
      if (hasData && isValidWebsiteData(xxapiData, url)) {
        logger.log(`[fetchWebsiteData] ${url} 使用 Xxapi 数据`);
        setCachedWebsiteData(url, xxapiData);
        return xxapiData;
      } else if (hasData) {
        console.warn(`[fetchWebsiteData] ${url} Xxapi 返回的数据无效，继续尝试其他 API:`, xxapiData);
        logger.warn(`[fetchWebsiteData] ${url} Xxapi 数据无效，继续尝试其他 API`);
        // 收集数据，可能只有 title
        if (xxapiData.title || xxapiData.description) {
          collectedData.push({ api: 'Xxapi', data: xxapiData });
        }
      }
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      apiResults.push({ api: 'Xxapi', success: false, hasData: false, error: errorMsg, timestamp: Date.now() });
      console.error(`[fetchWebsiteData] ${url} Xxapi API 调用异常:`, error);
      logger.error(`[fetchWebsiteData] ${url} Xxapi API 调用异常:`, error);
    }
  }
  
  logger.log(`[fetchWebsiteData] ${url} 尝试最后的备选方案 (Uapis)`);
  
  logger.log(`[fetchWebsiteData] ${url} Jxcxin 失败，尝试方案五 (Uapis)`);
  
  // 方案五：所有其他 API 都失败后，尝试 Uapis API
  let uapisData: WebsiteData;
  try {
    console.log(`[fetchWebsiteData] ${url} 调用 Uapis API...`);
    uapisData = await fetchDataFromUapis(url);
    const hasData = !!(uapisData.title || uapisData.description);
    apiResults.push({ api: 'Uapis', success: true, hasData, timestamp: Date.now() });
    console.log(`[fetchWebsiteData] ${url} Uapis API 结果:`, { hasData, data: uapisData });
    
    if (hasData && isValidWebsiteData(uapisData, url)) {
      logger.log(`[fetchWebsiteData] ${url} 使用 Uapis 数据`);
      setCachedWebsiteData(url, uapisData);
      return uapisData;
    } else if (hasData) {
      console.warn(`[fetchWebsiteData] ${url} Uapis 返回的数据无效，继续尝试其他 API:`, uapisData);
      logger.warn(`[fetchWebsiteData] ${url} Uapis 数据无效，继续尝试其他 API`);
      // 收集数据，可能只有 title
      if (uapisData.title || uapisData.description) {
        collectedData.push({ api: 'Uapis', data: uapisData });
      }
    }
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    apiResults.push({ api: 'Uapis', success: false, hasData: false, error: errorMsg, timestamp: Date.now() });
    console.error(`[fetchWebsiteData] ${url} Uapis API 调用异常:`, error);
    logger.error(`[fetchWebsiteData] ${url} Uapis API 调用异常:`, error);
  }
  
  // 保存调试信息到全局对象
  debugApiCalls.set(url, apiResults);
  
  // 所有 API 都失败，记录详细的调试信息
  logger.error(`[fetchWebsiteData] ${url} 所有 API 都失败，API 调用结果:`, apiResults);
  
  // 强制输出错误信息（即使日志关闭）
  console.error(`[fetchWebsiteData] ❌ ${url} 所有 API 调用失败！`, {
    url,
    isChinese,
    apiResults,
    timestamp: new Date().toISOString(),
  });
  
  // 输出到控制台的友好提示
  console.group(`🔍 [调试] ${url} API 调用详情`);
  apiResults.forEach(result => {
    if (result.success && result.hasData) {
      console.log(`✅ ${result.api}: 成功，有数据`);
    } else if (result.success && !result.hasData) {
      console.warn(`⚠️ ${result.api}: 成功，但无数据`);
    } else {
      console.error(`❌ ${result.api}: 失败`, result.error || '未知错误');
    }
  });
  console.groupEnd();
  
  logger.log(`[fetchWebsiteData] ${url} Uapis 失败，检查是否有可用的 title`);
  
  // 检查收集到的数据，如果没有任何 API 返回 description，但至少有一个返回了 title，使用 title 作为 description
  let bestTitle: string | undefined;
  let bestTitleApi: string | undefined;
  
  for (const item of collectedData) {
    if (item.data.title && item.data.title.trim().length > 0) {
      // 优先选择最长的 title（通常包含更多信息）
      if (!bestTitle || item.data.title.length > bestTitle.length) {
        bestTitle = item.data.title;
        bestTitleApi = item.api;
      }
    }
  }
  
  if (bestTitle) {
    logger.log(`[fetchWebsiteData] ${url} 所有 API 都没有 description，使用 ${bestTitleApi} 返回的 title 作为 description`);
    const fallbackData: WebsiteData = {
      title: bestTitle,
      description: bestTitle, // 使用 title 作为 description
    };
    setCachedWebsiteData(url, fallbackData);
    return fallbackData;
  }
  
  // 所有 API 都失败，生成默认描述
  logger.log(`[fetchWebsiteData] ${url} 所有 API 都失败，生成默认描述`);
  const defaultDescription = `访问 ${extractDomain(url)} 网站`;
  const defaultData = { description: defaultDescription };
  
  // 写入缓存，避免下次重复请求
  setCachedWebsiteData(url, defaultData);
  
  return defaultData;
}


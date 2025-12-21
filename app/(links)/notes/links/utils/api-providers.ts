import { logger } from './logger';
import { WebsiteData } from './cache';
import { queueMicrolinkRequest, blockMicrolink, isMicrolinkAvailable } from './microlink-queue';

/**
 * API 请求超时时间：8 秒
 */
const API_TIMEOUT = 8000;

/**
 * 通用的 API 请求函数
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; SiteCard/1.0)',
        ...options.headers,
      },
      mode: 'cors',
      credentials: 'omit',
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * 方案一：使用 microlink.io API 获取网站的 title 和 description
 */
export async function fetchDataFromMicrolink(url: string): Promise<WebsiteData> {
  try {
    const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&data=title,description`;
    const response = await fetchWithTimeout(apiUrl);
    
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
 */
export async function fetchDataFromAhfi(url: string): Promise<WebsiteData> {
  try {
    const apiUrl = `https://api.ahfi.cn/api/websiteinfo?url=${encodeURIComponent(url)}`;
    const response = await fetchWithTimeout(apiUrl);
    
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
 */
export async function fetchDataFromXxapi(url: string): Promise<WebsiteData> {
  try {
    const apiUrl = `https://v2.xxapi.cn/api/tdk?url=${encodeURIComponent(url)}`;
    const response = await fetchWithTimeout(apiUrl);
    
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
 */
export async function fetchDataFromJxcxin(url: string): Promise<WebsiteData> {
  try {
    const apiUrl = `https://apis.jxcxin.cn/api/title?url=${encodeURIComponent(url)}`;
    const response = await fetchWithTimeout(apiUrl);
    
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
    
    // 检查响应结构
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
 */
export async function fetchDataFromUapis(url: string): Promise<WebsiteData> {
  try {
    const apiUrl = `https://uapis.cn/api/v1/webparse/metadata?url=${encodeURIComponent(url)}`;
    const response = await fetchWithTimeout(apiUrl);
    
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


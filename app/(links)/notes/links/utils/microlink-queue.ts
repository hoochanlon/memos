import { logger } from './logger';

/**
 * Microlink 熔断时间：10 分钟
 * 当 Microlink 多次返回 429 或被拦截时，短时间内跳过，直接使用备选方案
 */
const MICROLINK_COOLDOWN = 10 * 60 * 1000; // 10 分钟
const MICROLINK_BLOCKED_KEY = 'microlink_blocked_until';

/**
 * 最小请求间隔 400ms，减轻 429 风险
 */
const MIN_REQUEST_INTERVAL = 400;

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

export function isMicrolinkAvailable(): boolean {
  const blockedUntil = getMicrolinkBlockedUntil();
  return Date.now() >= blockedUntil;
}

export function blockMicrolink(reason: string) {
  const blockedUntil = Date.now() + MICROLINK_COOLDOWN;
  setMicrolinkBlockedUntil(blockedUntil);
  logger.warn(`[Microlink] 触发熔断，${MICROLINK_COOLDOWN / 60000} 分钟内跳过。原因: ${reason}`);
}

// Microlink 请求队列：确保同一时间只有一个请求
let microlinkRequestQueue: Array<() => Promise<void>> = [];
let isProcessingMicrolinkQueue = false;

/**
 * 将 Microlink 请求加入队列，确保同一时间只有一个请求
 */
export async function queueMicrolinkRequest<T>(requestFn: () => Promise<T>): Promise<T> {
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


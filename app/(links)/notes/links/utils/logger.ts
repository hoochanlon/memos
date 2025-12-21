/**
 * 日志工具：只在开发环境输出日志
 * 可以通过 NEXT_PUBLIC_ENABLE_LOGS=true 在生产环境启用日志
 */
const isDev = process.env.NODE_ENV === 'development';
const enableLogs = isDev || process.env.NEXT_PUBLIC_ENABLE_LOGS === 'true';

export const logger = {
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


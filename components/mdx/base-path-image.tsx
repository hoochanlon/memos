'use client';

import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import { useState, useLayoutEffect } from 'react';

interface BasePathImageProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  [key: string]: any;
}

// 获取 basePath（在客户端运行时）
function getBasePath(): string {
  if (typeof window === 'undefined') return '';
  
  const pathname = window.location.pathname;
  
  // 优先从 pathname 检测（最可靠）
  // 如果路径以 /memos 开头，说明部署在子路径
  if (pathname.startsWith('/memos/') || pathname === '/memos') {

    return '/memos';
  }
  
  // 也尝试从环境变量获取（构建时可能已替换）
  // 注意：在生产环境构建时，这个值应该被 Next.js 替换为 '/memos'
  const envBasePath = process.env.NEXT_PUBLIC_BASE_PATH;
  if (envBasePath) {
    return envBasePath;
  }
  
  return '';
}

/**
 * 带 basePath 自动处理的图片组件
 * 在 MDX 中使用：
 * 
 * import { BasePathImage } from '@/components/mdx/base-path-image';
 * 
 * <BasePathImage src="/imgs/welcome.png" alt="欢迎图片" />
 * 
 * 本地开发：/imgs/welcome.png -> /imgs/welcome.png
 * 生产环境：/imgs/welcome.png -> /memos/imgs/welcome.png
 */
// 处理图片路径的函数
function processImageSrc(src: string): string {
  if (!src || typeof src !== 'string') return src;
  
  // 跳过外部 URL
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  
  // 只处理本地路径（以 / 开头）
  if (src.startsWith('/')) {
    const basePath = getBasePath();
    // 如果路径还没有包含 basePath，添加它
    if (basePath && !src.startsWith(basePath)) {
      return `${basePath}${src}`;
    }
  }
  
  return src;
}

export function BasePathImage({
  src,
  width = 1200,
  height = 800,
  ...rest
}: BasePathImageProps) {
  // 使用状态来跟踪是否在客户端
  const [isClient, setIsClient] = useState(false);
  const [processedSrc, setProcessedSrc] = useState(src);
  
  // 在客户端立即设置标志和处理路径
  useLayoutEffect(() => {
    setIsClient(true);
    const newSrc = processImageSrc(src);
    setProcessedSrc(newSrc);
    
    // 调试日志
    const basePath = getBasePath();
    console.log('[BasePathImage]', {
      original: src,
      basePath,
      processed: newSrc,
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'N/A',
      isClient: true
    });
  }, [src]);
  
  // 服务端渲染时不渲染图片，避免使用错误路径
  // 客户端水合后再渲染，确保使用正确路径
  if (!isClient) {
    return (
      <div 
        style={{ 
          width: `${width}px`, 
          height: `${height}px`,
          backgroundColor: 'transparent'
        }} 
        aria-hidden="true"
      />
    );
  }
  
  return (
    <ImageZoom 
      {...rest} 
      src={processedSrc} 
      width={width} 
      height={height} 
    />
  );
}



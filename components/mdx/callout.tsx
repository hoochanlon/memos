'use client';

import Image from 'next/image';
import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from 'fumadocs-ui/utils/cn';
import { useState, useLayoutEffect } from 'react';

type CalloutType =
  | 'default'
  | 'info'
  | 'warning'
  | 'error'
  | 'important'
  | 'note'
  | 'tip'
  | (string & {});

interface CustomCalloutProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  type?: CalloutType;
}

const ICON_MAP: Record<string, string> = {
  warning: '/icons/warning.svg',
  error: '/icons/ban.svg',
  danger: '/icons/ban.svg',
  info: '/icons/info.svg',
  note: '/icons/light.svg',
  tip: '/icons/light.svg',
  light: '/icons/light.svg',
  important: '/icons/important.svg',
  default: '/icons/info.svg',
};

const TYPE_CLASS_MAP: Record<string, string> = {
  warning:
    'border-amber-300/70 bg-amber-50/80 text-amber-900 dark:border-amber-400/60 dark:bg-amber-950/40 dark:text-amber-50',
  error:
    'border-red-300/70 bg-red-50/80 text-red-900 dark:border-red-400/60 dark:bg-red-950/40 dark:text-red-50',
  danger:
    'border-red-300/70 bg-red-50/80 text-red-900 dark:border-red-400/60 dark:bg-red-950/40 dark:text-red-50',
  info:
    'border-sky-300/70 bg-sky-50/80 text-sky-900 dark:border-sky-400/60 dark:bg-sky-950/40 dark:text-sky-50',
  note:
    'border-slate-300/70 bg-slate-50/80 text-slate-900 dark:border-slate-400/60 dark:bg-slate-950/40 dark:text-slate-50',
  tip: 'border-emerald-300/70 bg-emerald-50/80 text-emerald-900 dark:border-emerald-400/60 dark:bg-emerald-950/40 dark:text-emerald-50',
  light:
    'border-slate-300/70 bg-slate-50/80 text-slate-900 dark:border-slate-400/60 dark:bg-slate-950/40 dark:text-slate-50',
  important:
    'border-purple-300/70 bg-purple-50/80 text-purple-900 dark:border-purple-400/60 dark:bg-purple-950/40 dark:text-purple-50',
  default:
    'border-sky-300/70 bg-sky-50/80 text-sky-900 dark:border-sky-400/60 dark:bg-sky-950/40 dark:text-sky-50',
};

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
  const envBasePath = process.env.NEXT_PUBLIC_BASE_PATH;
  if (envBasePath) {
    return envBasePath;
  }
  
  return '';
}

// 处理图标路径的函数
function processIconSrc(src: string): string {
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

export function MdxCallout({
  title,
  type = 'default',
  className,
  children,
  ...rest
}: CustomCalloutProps) {
  const key = type in ICON_MAP ? type : 'default';
  const originalIconSrc = ICON_MAP[key];
  const typeClass = TYPE_CLASS_MAP[key] ?? TYPE_CLASS_MAP.default;
  
  // 使用状态来处理图标路径（客户端水合后）
  const [isClient, setIsClient] = useState(false);
  const [iconSrc, setIconSrc] = useState(originalIconSrc);
  
  // 在客户端水合时处理路径
  useLayoutEffect(() => {
    setIsClient(true);
    const processedSrc = processIconSrc(originalIconSrc);
    setIconSrc(processedSrc);
  }, [originalIconSrc]);

  return (
    <div
      {...rest}
      className={cn(
        'not-prose mt-4 mb-4 flex gap-3 rounded-xl border px-4 py-4 text-[0.95rem] leading-relaxed',
        typeClass,
        className,
      )}
    >
      <div className="mt-1 shrink-0">
        {isClient ? (
          <Image
            src={iconSrc}
            alt={typeof title === 'string' ? title : key}
            width={22}
            height={22}
          />
        ) : (
          <div 
            style={{ 
              width: '22px', 
              height: '22px',
              backgroundColor: 'transparent'
            }} 
            aria-hidden="true"
          />
        )}
      </div>
      <div className="min-w-0 space-y-1">
        {title && (
          <div className="text-[20px] text-base font-semibold leading-snug tracking-tight">
            {title}
          </div>
        )}
        <div className="prose prose-sm prose-invert:text-inherit prose-p:my-0 prose-ul:my-0 prose-ol:my-0">
          {children}
        </div>
      </div>
    </div>
  );
}



'use client';

import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { SiteIcon } from './site-icon';
import type { Site } from './site-links';
import { extractDomain } from './site-utils';
import { fetchWebsiteData } from './utils/website-data';
import { logger } from './utils/logger';

interface SiteCardProps {
  site: Site;
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
    // 立即输出调试信息（即使日志关闭也输出，方便排查生产环境问题）
    console.log(`[SiteCard] 开始处理: ${site.url}`, {
      name: site.name,
      description: site.description,
      needsName: needsAutoFetchName(site.name),
      needsDescription: needsAutoFetchDescription(site.description),
      isClient: typeof window !== 'undefined',
    });
    
    // 只有当 name 和 description 都未填写时，才调用 API
    // 如果已经填了 name 和 description，就不调用 API
    const hasName = site.name !== undefined && site.name.trim() !== '';
    const hasDescription = site.description !== undefined;
    
    // 只有当 name 和 description 都已填写时，才跳过 API 调用
    if (hasName && hasDescription) {
      console.log(`[SiteCard] ${site.url} 已填写完整信息（name 和 description），跳过 API 调用`);
      setIsLoading(false);
      return;
    }
    
    // 计算是否需要获取
    const shouldFetchName = needsAutoFetchName(site.name);
    const shouldFetchDescription = needsAutoFetchDescription(site.description);
    
    // 如果 name 和 description 都不需要获取，直接返回
    if (!shouldFetchName && !shouldFetchDescription) {
      console.log(`[SiteCard] ${site.url} 不需要获取数据，跳过 API 调用`);
      setIsLoading(false);
      return;
    }

    console.log(`[SiteCard] ${site.url} 开始调用 API 获取数据...`);
    
    // 使用 API 自动获取 title 和 description
    fetchWebsiteData(site.url)
      .then((data) => {
        logger.log(`[SiteCard] ${site.url} 获取数据成功:`, {
          hasTitle: !!data.title,
          hasDescription: !!data.description,
          shouldFetchName,
          shouldFetchDescription,
        });
        
        if (data.title && shouldFetchName) {
          setName(data.title);
        }
        // 只有 description 是 undefined 时才自动获取，空字符串不获取
        if (data.description && shouldFetchDescription) {
          setDescription(data.description);
        } else if (shouldFetchDescription && !data.description) {
          // 如果应该获取但没有获取到，记录警告
          logger.warn(`[SiteCard] ${site.url} 未能获取到 description，所有 API 都失败了`);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        // 记录错误信息，方便排查生产环境问题
        logger.error(`[SiteCard] ${site.url} 获取数据失败:`, error);
        console.error(`[SiteCard] 错误详情 - URL: ${site.url}`, {
          error: error?.message || String(error),
          stack: error?.stack,
          name: error?.name,
        });
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

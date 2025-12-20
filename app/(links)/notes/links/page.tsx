import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { BackToTop } from '@/components/back-to-top';
import { FileText, Archive, Tag as TagIcon, List } from 'lucide-react';
import { SiteCard } from './site-card';
import { siteLinks } from './site-links';

export const metadata: Metadata = {
  title: '网站导航',
  description: '常用网站导航，快速访问搜索引擎和常用站点',
};

// 生成分类的锚点 ID（支持中文）
function getCategoryId(category: string): string {
  // 现代浏览器支持直接在锚点中使用中文
  // 只需要处理空格和特殊字符
  return category
    .trim()
    .replace(/\s+/g, '-')           // 空格替换为连字符
    .replace(/\+/g, '-plus')        // + 替换为 -plus
    .replace(/-+/g, '-')            // 多个连字符合并为一个
    .replace(/^-|-$/g, '');         // 移除首尾连字符
  // 保留中文字符，浏览器会自动处理 URL 编码
}

export default function LinksPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight mb-4">网站导航</h1>
        <div className="flex flex-col gap-4 mb-10">
          <p className="text-fd-muted-foreground">
            常用网站导航，方便快速访问搜索引擎和常用站点。
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/notes/essay"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md border border-fd-border bg-fd-card text-fd-foreground hover:border-fd-primary hover:bg-fd-primary/5 transition-colors"
            >
              <FileText className="w-4 h-4" />
              返回备忘录
            </Link>
            <Link
              href="/notes"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md border border-fd-border bg-fd-card text-fd-foreground hover:border-fd-primary hover:bg-fd-primary/5 transition-colors"
            >
              <Archive className="w-4 h-4" />
              查看归档
            </Link>
            <Link
              href="/notes/tags"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md border border-fd-border bg-fd-card text-fd-foreground hover:border-fd-primary hover:bg-fd-primary/5 transition-colors"
            >
              <TagIcon className="w-4 h-4" />
              查看标签
            </Link>
          </div>
        </div>

        {/* 导航分类（可折叠） */}
        <details className="mb-8 group">
          <summary className="cursor-pointer p-4 rounded-lg border border-fd-border bg-fd-card hover:border-fd-primary hover:bg-fd-primary/5 transition-colors list-none select-none">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <List className="w-5 h-5 text-fd-muted-foreground" />
                <h2 className="text-lg font-semibold">导航分类</h2>
              </div>
              <svg
                className="w-5 h-5 text-fd-muted-foreground transition-transform group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </summary>
          <div className="mt-2 p-4 rounded-lg border border-fd-border bg-fd-card">
            <nav className="flex flex-wrap gap-2">
              {siteLinks.map((category) => {
                const categoryId = getCategoryId(category.category);
                // 对中文进行 URL 编码以确保兼容性
                const encodedId = encodeURIComponent(categoryId);
                return (
                  <a
                    key={categoryId}
                    href={`#${encodedId}`}
                    className="inline-flex items-center px-3 py-1.5 text-sm rounded-md border border-fd-border bg-fd-background hover:border-fd-primary hover:bg-fd-primary/5 hover:text-fd-primary transition-colors no-underline select-none"
                  >
                    {category.category}
                  </a>
                );
              })}
            </nav>
          </div>
        </details>

        {/* 分类内容 */}
        <div className="space-y-12">
          {siteLinks.map((category) => {
            const categoryId = getCategoryId(category.category);
            return (
              <section
                key={category.category}
                id={categoryId}
                className="space-y-4 scroll-mt-20"
              >
                <div>
                  <h2 className="text-2xl font-semibold">
                    {category.category}
                  </h2>
                  {category.description && (
                    <p className="mt-2 text-sm text-fd-muted-foreground">
                      {category.description}
                    </p>
                  )}
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {category.sites.map((site) => (
                    <SiteCard key={site.url} site={site} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}


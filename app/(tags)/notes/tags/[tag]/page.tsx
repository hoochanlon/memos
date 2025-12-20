import { source } from '@/lib/source';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteFooter } from '@/components/site-footer';
import { BackToTop } from '@/components/back-to-top';
import { Tag as TagIcon, FileText, CalendarDays, Clock3 } from 'lucide-react';

export default async function TagPage(props: PageProps<'/notes/tags/[tag]'>) {
  const params = await props.params;
  let tagName: string;
  try {
    tagName = decodeURIComponent(params.tag);
  } catch {
    tagName = params.tag;
  }

  const allPages = source.getPages();
  const taggedPages = allPages.filter((page) => {
    const tags = (page.data as any).tags;
    if (!tags || !Array.isArray(tags)) return false;
    return tags.some((tag) => String(tag) === tagName);
  });

  if (taggedPages.length === 0) {
    notFound();
  }

  taggedPages.sort((a, b) => {
    const dateA = a.data.publishedAt || a.data.lastUpdated;
    const dateB = b.data.publishedAt || b.data.lastUpdated;

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    const timeA = dateA instanceof Date ? dateA.getTime() : new Date(dateA).getTime();
    const timeB = dateB instanceof Date ? dateB.getTime() : new Date(dateB).getTime();

    return timeB - timeA;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-12">
        <section className="w-full">
          <div className="flex items-baseline gap-3 mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">标签: {tagName}</h1>
            <span className="text-sm font-normal text-fd-muted-foreground">
              ({taggedPages.length} 篇文章)
            </span>
          </div>

          <div className="mb-8 flex flex-wrap gap-2">
            <Link
              href="/notes/tags"
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-accent/50 rounded-md transition-colors no-underline"
            >
              <TagIcon className="w-4 h-4" />
              查看所有标签
            </Link>
            <Link
              href="/notes/essay"
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-accent/50 rounded-md transition-colors no-underline"
            >
              <FileText className="w-4 h-4" />
              返回笔记
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {taggedPages.map((page) => {
              const publishedAt =
                page.data.publishedAt instanceof Date
                  ? page.data.publishedAt
                  : page.data.publishedAt
                    ? new Date(page.data.publishedAt)
                    : undefined;
              const lastUpdated =
                page.data.lastUpdated instanceof Date
                  ? page.data.lastUpdated
                  : page.data.lastUpdated
                    ? new Date(page.data.lastUpdated)
                    : undefined;

              return (
                <Link
                  key={page.url}
                  href={`/notes/${page.slugs && page.slugs.length > 0 ? page.slugs.join('/') : page.url}`}
                  className="group block p-6 rounded-xl border-2 border-fd-border bg-fd-card hover:border-fd-primary hover:bg-fd-primary/5 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 no-underline"
                >
                  <h3 className="text-lg font-semibold text-fd-foreground group-hover:text-fd-primary transition-colors mb-2 line-clamp-2">
                    {page.data.title}
                  </h3>
                  {page.data.description && (
                    <p className="text-sm text-fd-muted-foreground mb-4 line-clamp-3">
                      {page.data.description}
                    </p>
                  )}
                  {(publishedAt || lastUpdated) && (
                    <div className="flex flex-wrap items-center gap-3 text-xs text-fd-muted-foreground pt-3 border-top border-fd-border">
                      {publishedAt && (
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="w-4 h-4 text-fd-muted-foreground/60" />
                          {publishedAt.toLocaleDateString('zh-CN')}
                        </span>
                      )}
                      {lastUpdated &&
                        publishedAt &&
                        lastUpdated.getTime() !== publishedAt.getTime() && (
                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 className="w-4 h-4 text-fd-muted-foreground/60" />
                            {lastUpdated.toLocaleDateString('zh-CN')}
                          </span>
                        )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}

export async function generateStaticParams() {
  const allPages = source.getPages();
  const tagSet = new Set<string>();

  for (const page of allPages) {
    const tags = (page.data as any).tags;
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        tagSet.add(String(tag));
      }
    }
  }

  return Array.from(tagSet).map((tag) => ({
    tag,
  }));
}

export async function generateMetadata(
  props: PageProps<'/notes/tags/[tag]'>,
): Promise<Metadata> {
  const params = await props.params;
  let tagName: string;
  try {
    tagName = decodeURIComponent(params.tag);
  } catch {
    tagName = params.tag;
  }

  const allPages = source.getPages();
  const taggedPages = allPages.filter((page) => {
    const tags = (page.data as any).tags;
    if (!tags || !Array.isArray(tags)) return false;
    return tags.some((tag) => String(tag) === tagName);
  });

  return {
    title: `标签: ${tagName}`,
    description: `包含标签 "${tagName}" 的 ${taggedPages.length} 篇文章`,
  };
}


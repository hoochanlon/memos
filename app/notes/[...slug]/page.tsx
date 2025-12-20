import { source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/notebook/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/mdx-components';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import Link from 'next/link';
import { CalendarDays, Clock3, PenLine } from 'lucide-react';
import { PasswordProtection } from '@/components/password-protection';
import { BackToTop } from '@/components/back-to-top';

export default async function Page(props: PageProps<'/notes/[...slug]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const lastUpdated = page.data.lastUpdated instanceof Date
    ? page.data.lastUpdated
    : page.data.lastUpdated
      ? new Date(page.data.lastUpdated)
      : undefined;
  const publishedAt = page.data.publishedAt instanceof Date
    ? page.data.publishedAt
    : page.data.publishedAt
      ? new Date(page.data.publishedAt)
      : undefined;
  
  // 检查 frontmatter 中是否禁用编辑按钮，默认为 true（显示）
  const editOnGitHub = (page.data as any).editOnGitHub !== false;
  
  // 检查是否有密码保护
  const password = (page.data as any).password;
  // 检查是否有密码提示
  const passwordHint = (page.data as any).passwordHint;

  const content = (
    <>
      <DocsTitle>{page.data.title}</DocsTitle>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[15px] leading-6 text-fd-muted-foreground flex flex-wrap items-center gap-2">
          {publishedAt && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="w-4 h-4" />
              发布时间：{publishedAt.toLocaleDateString('zh-CN')}
            </span>
          )}
          {publishedAt && lastUpdated && <span className="mx-1">|</span>}
          {lastUpdated && (
            <span className="inline-flex items-center gap-1">
              <Clock3 className="w-4 h-4" />
              最近更新：{lastUpdated.toLocaleDateString('zh-CN')}
            </span>
          )}
          {editOnGitHub && (publishedAt || lastUpdated) && <span className="mx-1">|</span>}
          {editOnGitHub && (
            <a
              href={`https://github.dev/hoochanlon/memos/blob/main/content/notes/${page.path}`}
              rel="noreferrer noopener"
              target="_blank"
              className="text-[15px] leading-6 text-fd-muted-foreground flex flex-wrap items-center gap-2"
            >
              <PenLine className="w-4 h-4" />
              在 GitHub 上编辑
            </a>
          )}
        </p>
      </div>
      {(page.data as any).tags && Array.isArray((page.data as any).tags) && (page.data as any).tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-2 text-[15px] leading-6 text-fd-muted-foreground">
          <span>标签：</span>
          {(page.data as any).tags.map((tag: any, index: number) => {
            const tagName = String(tag);
            return (
              <Link
                key={index}
                href={`/notes/tags/${encodeURIComponent(tagName)}/`}
                className="inline-flex items-center px-2 py-1 rounded-md bg-fd-muted text-[15px] leading-6 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground transition-colors no-underline"
              >
                # {tagName}
              </Link>
            );
          })}
        </div>
      )}
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </>
  );

  // 如果有密码保护，将 PasswordProtection 包裹在 DocsPage 内部
  if (password) {
    return (
      <>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const articleId = 'nd-page';
                const tocId = 'nd-toc';
                const styleId = 'password-protection-' + articleId;
                
                // 检查是否已解锁
                const savedPassword = localStorage.getItem('article-password-' + articleId);
                const correctPassword = ${JSON.stringify(password)};
                
                // 尝试 base64 解码
                let decodedPassword = correctPassword;
                try {
                  const decoded = atob(correctPassword);
                  if (/^[\\x20-\\x7E]+$/.test(decoded)) {
                    decodedPassword = decoded;
                  }
                } catch(e) {}
                
                if (savedPassword !== decodedPassword) {
                  // 未解锁，立即隐藏内容（只隐藏非密码输入界面的内容）
                  let style = document.getElementById(styleId);
                  if (!style) {
                    style = document.createElement('style');
                    style.id = styleId;
                    style.textContent = '#' + articleId + ' > *:not([data-password-form]) { display: none !important; }\\n#' + tocId + ' { display: none !important; }\\n[data-toc-popover] { display: none !important; }\\n[data-toc-popover-trigger] { display: none !important; }\\n[data-toc-popover-content] { display: none !important; }';
                    document.head.appendChild(style);
                  }
                } else {
                  // 已解锁，只移除隐藏样式，不操作内容（让 React 组件自然渲染，避免闪烁）
                  let style = document.getElementById(styleId);
                  if (style) {
                    style.remove();
                  }
                  // 添加样式立即隐藏密码输入界面（避免闪烁）
                  let hidePasswordFormStyle = document.getElementById('hide-password-form');
                  if (!hidePasswordFormStyle) {
                    hidePasswordFormStyle = document.createElement('style');
                    hidePasswordFormStyle.id = 'hide-password-form';
                    hidePasswordFormStyle.textContent = '[data-password-form] { display: none !important; }';
                    document.head.appendChild(hidePasswordFormStyle);
                  }
                  // 不操作内容，让 React 组件自然渲染，保持与没加密文章一样的刷新效果
                }
              })();
            `,
          }}
        />
        <DocsPage 
          toc={page.data.toc} 
          full={page.data.full}
          tableOfContent={{
            enabled: page.data.toc !== false
            ,style: 'clerk'
          }}
          tableOfContentPopover={{
            enabled: page.data.toc !== false
          }}
          footer={{
            enabled: page.data.footer !== false
          }}
        >
          <PasswordProtection 
            password={password} 
            articleId="nd-page" 
            tocId="nd-toc"
            passwordHint={passwordHint}
          >
            {content}
          </PasswordProtection>
        </DocsPage>
        <BackToTop />
      </>
    );
  }

  // 没有密码保护，直接渲染（不添加任何脚本，保持正常刷新效果）
  return (
    <>
      <DocsPage 
        toc={page.data.toc} 
        full={page.data.full}
        tableOfContent={{
          enabled: page.data.toc !== false
          ,style: 'clerk'
        }}
        tableOfContentPopover={{
          enabled: page.data.toc !== false
        }}
        footer={{
          enabled: page.data.footer !== false
        }}
      >
        {content}
      </DocsPage>
      <BackToTop />
    </>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: PageProps<'/notes/[...slug]'>,
): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}


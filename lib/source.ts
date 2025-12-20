import { notes } from 'fumadocs-mdx:collections/server';
import { type InferPageType, loader, type LoaderPlugin } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';

/**
 * 自定义 slugs 插件
 * 如果 frontmatter 中有 slug 字段，则使用它作为 URL 路径
 * 这样可以实现固定链接，即使文件改名或移动文件夹，URL 也不会改变
 * 
 * 同时支持在 meta.json 中使用 slug 引用页面，这样文件重命名后无需更新 meta.json
 */
function customSlugsPlugin(): LoaderPlugin {
  // 建立 slug 到完整文件路径的映射
  // key: slug 的最后一段（用于在 meta.json 中引用）
  // value: 文件的完整路径（相对于 content/notes 目录）
  const slugToFileMap = new Map<string, string>();
  // 建立完整 slug 路径到文件路径的映射（用于更精确的匹配）
  const fullSlugToFileMap = new Map<string, string>();
  
  return {
    enforce: 'pre',
    transformStorage({ storage }: { storage: { getFiles: () => string[]; read: (file: string) => any } }) {
      // 优化：只遍历一次文件列表，同时处理页面和 meta 文件
      const files = storage.getFiles();
      const metaFiles: string[] = [];
      
      // 第一步：处理所有页面，设置 slugs 并建立映射
      for (const file of files) {
        const content = storage.read(file);
        if (!content) continue;
        
        if (content.format === 'page') {
          // 从 frontmatter 中读取 slug 字段
          const frontmatter = content.data as { slug?: string | string[] };
          
          if (frontmatter.slug) {
            // 如果 slug 是字符串，转换为数组
            // 如果 slug 是数组，直接使用
            const slugArray = Array.isArray(frontmatter.slug)
              ? frontmatter.slug
              : frontmatter.slug.split('/').filter(Boolean);
            
            content.slugs = slugArray;
            
            // 获取文件路径（去掉 content/notes/ 前缀和文件扩展名）
            let filePath = file.replace(/^content\/notes\//, '');
            // 去掉 /index.mdx 或 /index.md 后缀
            filePath = filePath.replace(/\/index\.(mdx|md)$/, '');
            // 去掉其他 .mdx 或 .md 扩展名
            filePath = filePath.replace(/\.(mdx|md)$/, '');
            
            // 建立映射：slug 的最后一段 -> 文件路径
            const lastSlug = slugArray[slugArray.length - 1];
            if (lastSlug) {
              slugToFileMap.set(lastSlug, filePath);
            }
            
            // 建立完整 slug 路径的映射（用于更精确的匹配）
            const fullSlug = slugArray.join('/');
            if (fullSlug) {
              fullSlugToFileMap.set(fullSlug, filePath);
            }
          }
          // 如果没有 slug 字段，Fumadocs 会使用默认的文件路径生成 slugs
        } else if (content.format === 'meta') {
          // 收集 meta 文件，稍后处理
          metaFiles.push(file);
        }
      }
      
      // 第二步：处理 meta.json 文件，将 slug 引用替换为文件路径
      for (const file of metaFiles) {
        const content = storage.read(file);
        if (!content || content.format !== 'meta') continue;
        
        // 获取 meta.json 所在的目录路径（相对于 content/notes）
        const metaDir = file.replace(/^content\/notes\//, '').replace(/\/meta\.json$/, '');
        
        // 获取 meta 数据
        const metaData = content.data as { pages?: (string | { name: string; [key: string]: any })[] };
        
        if (metaData.pages && Array.isArray(metaData.pages)) {
          // 遍历 pages 数组，将 slug 替换为文件路径
          metaData.pages = metaData.pages.map((page) => {
            if (typeof page === 'string') {
              // 如果是字符串，检查是否是 slug
              // 首先尝试完整路径匹配
              let filePath = fullSlugToFileMap.get(page);
              
              // 如果完整路径不匹配，尝试最后一段匹配
              if (!filePath) {
                filePath = slugToFileMap.get(page);
              }
              
              if (filePath) {
                // 如果找到对应的文件路径，计算相对于当前 meta.json 的路径
                const relativePath = getRelativePath(metaDir, filePath);
                return relativePath;
              }
              // 如果不是 slug，保持原样（文件路径）
              return page;
            } else if (typeof page === 'object' && page.name) {
              // 如果是对象，检查 name 字段是否是 slug
              let filePath = fullSlugToFileMap.get(page.name);
              if (!filePath) {
                filePath = slugToFileMap.get(page.name);
              }
              if (filePath) {
                const relativePath = getRelativePath(metaDir, filePath);
                return { ...page, name: relativePath };
              }
              return page;
            }
            return page;
          });
        }
      }
    },
  };
}

/**
 * 计算相对于 meta.json 所在目录的文件路径
 * 例如：meta.json 在 "essay"，文件在 "essay/demo"，返回 "demo"
 */
function getRelativePath(metaDir: string, filePath: string): string {
  // 如果文件路径以 meta 目录开头，去掉前缀
  if (filePath.startsWith(metaDir + '/')) {
    const relative = filePath.substring(metaDir.length + 1);
    // 返回最后一段（文件夹名或文件名）
    const segments = relative.split('/');
    return segments[segments.length - 1];
  }
  
  // 如果文件路径就是 meta 目录本身，返回空（表示当前目录的 index）
  if (filePath === metaDir) {
    return 'index';
  }
  
  // 否则，返回文件路径的最后一段
  const segments = filePath.split('/');
  return segments[segments.length - 1];
}

// See https://fumadocs.dev/docs/headless/source-api for more info
// baseUrl 不需要包含 basePath，Next.js 的 basePath 会自动处理前缀
export const source = loader({
  baseUrl: '/notes',
  source: notes.toFumadocsSource(),
  plugins: [
    customSlugsPlugin(), // 包含过滤加密文章的逻辑
    lucideIconsPlugin()
  ],
});

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    // Next.js 的 basePath 会自动处理前缀，这里不需要手动添加
    url: `/og/notes/${segments.join('/')}`,
  };
}

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title}

${processed}`;
}

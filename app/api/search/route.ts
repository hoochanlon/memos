import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';
import { createTokenizer } from '@orama/tokenizers/mandarin';
import type { NextRequest } from 'next/server';
import { notes } from 'fumadocs-mdx:collections/server';
import { loader, type LoaderPlugin } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';

// 创建一个专门用于搜索的 source，在构建索引时就排除加密文章
function filterEncryptedPlugin(): LoaderPlugin {
  return {
    enforce: 'pre',
    transformStorage({ storage }: { storage: { getFiles: () => string[]; read: (file: string) => any } }) {
      const originalGetFiles = storage.getFiles.bind(storage);
      
      // 重写 getFiles 方法，过滤掉加密文章
      storage.getFiles = () => {
        const files = originalGetFiles();
        return files.filter((file: string) => {
          try {
            const content = storage.read(file);
            if (!content || content.format !== 'page') return true;
            
            // 检查 frontmatter 中是否有 password 字段
            const password = (content.data as any)?.password;
            // 如果有密码，排除这篇文章（不加入搜索索引）
            return !password;
          } catch {
            // 如果读取失败，保留文件
            return true;
          }
        });
      };
      
      return storage;
    },
  };
}

// 创建专门用于搜索的 source（排除加密文章）
const searchSource = loader({
  baseUrl: '/notes',
  source: notes.toFumadocsSource(),
  plugins: [
    filterEncryptedPlugin(), // 在构建索引时就排除加密文章
    lucideIconsPlugin()
  ],
});

// 创建搜索API实例，使用过滤后的 source
const { GET: originalGET, staticGET: originalStaticGET } = createFromSource(searchSource, {
  // 配置中文支持
  components: {
    tokenizer: createTokenizer(),
  },
  search: {
    threshold: 0,
    tolerance: 0,
  },
});

// 从 URL 中提取 slug 数组
function extractSlugFromUrl(url: string): string[] | null {
  if (!url) return null;
  
  // 移除各种前缀
  let slug = url
    .replace(/^\/memos\/notes\//, '/notes/')  // 先处理 basePath
    .replace(/^\/notes\//, '')                  // 移除 /notes/ 前缀
    .replace(/\/$/, '');                        // 移除尾部斜杠
  
  if (!slug) return null;
  
  // 分割为 slug 数组
  return slug.split('/').filter(Boolean);
}

// 检查页面是否加密
function isEncryptedPage(slugArray: string[] | null): boolean {
  if (!slugArray || slugArray.length === 0) return false;
  
  try {
    const page = source.getPage(slugArray);
    if (!page) return false;
    
    // 检查是否有 password 字段
    const password = (page.data as any)?.password;
    return !!password;
  } catch {
    // 如果获取页面失败，假设不是加密的
    return false;
  }
}

// 过滤加密文章的辅助函数（运行时二次过滤，确保安全）
function filterEncryptedArticles(results: any): any {
  if (!results || !Array.isArray(results)) {
    return results;
  }
  
  return results.filter((result: any) => {
    // 尝试从不同字段获取 URL
    const url = result.url || result.href || result.path || result.id || '';
    if (!url) return true;
    
    // 提取 slug
    const slugArray = extractSlugFromUrl(url);
    if (!slugArray) return true;
    
    // 检查是否加密
    return !isEncryptedPage(slugArray);
  });
}

// 过滤搜索索引中的加密文章
function filterEncryptedFromIndex(indexData: any): any {
  if (!indexData) return indexData;
  
  // 如果是数组（索引项列表）
  if (Array.isArray(indexData)) {
    return indexData.filter((item: any) => {
      // 检查是否是页面索引项
      const url = item.url || item.href || item.path || item.id || '';
      if (!url) return true;
      
      // 提取 slug
      const slugArray = extractSlugFromUrl(url);
      if (!slugArray) return true;
      
      // 检查是否加密
      return !isEncryptedPage(slugArray);
    });
  }
  
  // 如果是对象，递归处理
  if (typeof indexData === 'object') {
    const filtered: any = {};
    for (const key in indexData) {
      if (key === 'pages' || key === 'results' || key === 'data') {
        filtered[key] = filterEncryptedArticles(indexData[key]);
      } else if (Array.isArray(indexData[key])) {
        filtered[key] = filterEncryptedFromIndex(indexData[key]);
      } else if (typeof indexData[key] === 'object') {
        filtered[key] = filterEncryptedFromIndex(indexData[key]);
      } else {
        filtered[key] = indexData[key];
      }
    }
    return filtered;
  }
  
  return indexData;
}

// 自定义 GET 处理程序，过滤加密文章
export async function GET(request: NextRequest) {
  // 调用原始的搜索处理程序（staticGET 不接受参数）
  const response = await originalStaticGET();
  
  // 检查响应类型
  const contentType = response.headers.get('content-type') || '';
  
  // 如果是 JSON 响应（搜索结果或搜索索引）
  if (contentType.includes('application/json')) {
    const data = await response.json();
    
    // 统一处理：无论数据结构如何，都尝试过滤
    let filteredData = data;
    
    // 处理搜索结果（包含 results 字段）
    if (data.results && Array.isArray(data.results)) {
      filteredData = { ...data, results: filterEncryptedArticles(data.results) };
    }
    // 处理搜索索引数据（直接是数组）
    else if (Array.isArray(data)) {
      filteredData = filterEncryptedFromIndex(data);
    }
    // 如果包含 pages 字段（可能是索引结构）
    else if (data.pages && Array.isArray(data.pages)) {
      filteredData = { ...data, pages: filterEncryptedArticles(data.pages) };
    }
    // 如果包含 data 字段（可能是嵌套结构）
    else if (data.data) {
      filteredData = { ...data, data: filterEncryptedFromIndex(data.data) };
    }
    // 其他情况，尝试递归过滤整个对象
    else if (typeof data === 'object') {
      filteredData = filterEncryptedFromIndex(data);
    }
    
    return Response.json(filteredData, {
      status: response.status,
      headers: response.headers,
    });
  }
  
  return response;
}

// 配置路由为静态可渲染
export const dynamic = 'force-static';
export const revalidate = false;

/**
 * 从 URL 中提取域名
 * @param url 完整的 URL 字符串
 * @returns 域名（不包含协议和路径）
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, ''); // 移除 www. 前缀
  } catch {
    // 如果不是有效的 URL，尝试直接提取域名
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
    return match ? match[1].replace(/^www\./, '') : url;
  }
}

/**
 * 根据 URL 自动生成 favicon URL
 * @param url 网站 URL
 * @returns favicon URL
 */
export function generateFaviconUrl(url: string): string {
  const domain = extractDomain(url);
  return `https://favicon.im/${domain}`;
}

/**
 * 创建网站对象，自动处理 favicon URL
 * @param site 网站信息
 *   - name: 网站名称（必填）
 *   - url: 网站 URL（必填）
 *   - description: 网站描述（可选，建议手动填写）
 *   - icon: 图标（可选，如果不提供会自动从 URL 生成 favicon URL）
 * @returns 完整的网站对象
 * 
 * @example
 * // 自动生成 favicon
 * createSite({
 *   name: '示例网站',
 *   url: 'https://example.com',
 *   description: '这是一个示例网站'
 * })
 * // 结果: icon 会自动生成为 'https://favicon.im/example.com'
 * 
 * @example
 * // 使用自定义图标（emoji 或自定义 URL）
 * createSite({
 *   name: '示例网站',
 *   url: 'https://example.com',
 *   icon: '🌐' // 使用 emoji，不会自动生成
 * })
 */
export function createSite(site: {
  name?: string; // 可选，如果不提供会自动从 microlink.io API 获取 title
  url: string;
  description?: string; // 可选：不提供(undefined)会自动获取，空字符串('')表示"没有描述"不获取
  icon?: string; // 可选，如果不提供会自动生成
}): {
  name?: string;
  url: string;
  description?: string;
  icon: string;
} {
  return {
    ...site,
    // 保留空字符串，不转换为 undefined，以便区分"没有描述"和"需要自动获取"
    // name 如果是空字符串，转换为 undefined（空字符串的 name 没有意义）
    name: site.name && site.name.trim() ? site.name : undefined,
    icon: site.icon || generateFaviconUrl(site.url),
  };
}

/**
 * 自动获取网站的 meta description
 * 注意：此函数只能在开发环境中使用（需要 Node.js 运行时）
 * 在静态导出模式下，建议在开发时运行此函数获取 description，然后手动填入
 * 
 * @param url 网站 URL
 * @returns Promise<string | undefined> 网站的 description，如果获取失败返回 undefined
 * 
 * @example
 * // 在开发环境中使用
 * const desc = await fetchSiteDescription('https://example.com');
 * console.log(desc); // 输出网站的 description
 */
export async function fetchSiteDescription(url: string): Promise<string | undefined> {
  // 只在开发环境中使用
  if (process.env.NODE_ENV === 'production') {
    console.warn('fetchSiteDescription 只能在开发环境中使用');
    return undefined;
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    const html = await response.text();
    
    // 尝试多种方式获取 description
    // 1. <meta name="description" content="...">
    let match = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    if (match) return match[1].trim();
    
    // 2. <meta property="og:description" content="...">
    match = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    if (match) return match[1].trim();
    
    // 3. <meta name="Description" content="...">
    match = html.match(/<meta\s+name=["']Description["']\s+content=["']([^"']+)["']/i);
    if (match) return match[1].trim();
    
    return undefined;
  } catch (error) {
    console.error(`获取 ${url} 的 description 失败:`, error);
    return undefined;
  }
}


import { createMDX } from 'fumadocs-mdx/next';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// ESM 等价的 __dirname
const __dirname = dirname(fileURLToPath(import.meta.url));

const withMDX = createMDX();

// 开发默认根路径；生产（或设置了 NEXT_PUBLIC_BASE_PATH）走子路径
// 生产环境（包括 Vercel 和 GitHub Pages）都使用 /memos
const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH ??
  (process.env.NODE_ENV === 'production' ? '/memos' : '');

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // 只在生产环境启用静态导出模式
  // 开发环境不使用静态导出，以支持动态路由
  ...(process.env.NODE_ENV === 'production' && { output: 'export' }),
  // GitHub Pages 子路径配置
  // 在静态导出模式下，basePath 会自动处理所有资源路径
  basePath,
  // 添加尾部斜杠，有助于静态文件生成
  trailingSlash: true,
  // 设置环境变量，供客户端使用
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    // 静态导出模式下必须禁用图片优化
    unoptimized: true,
    // 正确写法（Next.js 15 最新要求）
    remotePatterns: [
      // 放开所有 https 图片（开发/文档站最方便）
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // 为 Turbopack 指定根目录，避免根目录推断警告
  turbopack: {
    root: __dirname,
  },
  // 优化构建配置，减少内存使用
  experimental: {
    // 减少并发构建任务，降低内存占用
    workerThreads: false,
    // 禁用不必要的优化
    optimizeCss: false,
    // 禁用服务器组件（静态导出不需要）
    serverComponentsExternalPackages: [],
  },
  // 生产环境优化：禁用 source map 以减少内存使用
  productionBrowserSourceMaps: false,
  // 减少构建时的内存使用：限制并发
  ...(process.env.NODE_ENV === 'production' && {
    swcMinify: true, // 使用 SWC 压缩（更快，内存占用更少）
  }),
  // 减少构建时的内存使用
  webpack: (config, { isServer, dev }) => {
    // 生产构建时优化内存使用
    if (!isServer && !dev) {
      // 客户端构建优化
      config.optimization = {
        ...config.optimization,
        // 减少代码分割，降低内存使用
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
          },
        },
      };
      // 减少内存使用：简化优化配置
      config.optimization.usedExports = false;
    }
    // 减少内存使用：禁用 source map（生产环境）
    if (!dev) {
      config.devtool = false;
    }
    return config;
  },
};

export default withMDX(config);

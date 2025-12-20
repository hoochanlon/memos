# Deno Deploy 内存溢出问题解决方案

## 问题描述

在 Deno Deploy 上构建 Next.js 项目时出现内存溢出错误：
```
Fatal JavaScript out of memory: Ineffective mark-compacts near heap limit
```

## 原因分析

1. **Deno Deploy 内存限制**：
   - 免费计划：构建环境约 512MB-1GB 内存限制
   - Pro 计划：构建环境约 3-4GB RAM
   - 内存限制是平台级别的，无法通过代码配置完全绕过

2. **Next.js 构建内存消耗**：
   - MDX 文件处理需要大量内存
   - Webpack 构建过程内存占用高
   - 代码分割和优化会增加内存使用

3. **构建配置未优化**：之前的配置没有充分优化内存使用

## 解决方案

### 方案 1：在 Deno Deploy 中设置环境变量（如果支持）

在 Deno Deploy 的项目设置中添加环境变量：

1. 登录 Deno Deploy 控制台
2. 进入项目设置（Project Settings）→ Environment Variables
3. 尝试添加：
   - **Key**: `NODE_OPTIONS`
   - **Value**: `--max-old-space-size=2048` 或 `--max-old-space-size=4096`

**注意**：Deno Deploy 可能不支持此环境变量，因为它是 Deno 运行时而非 Node.js。

### 方案 2：优化构建配置（已实施）

已经在 `next.config.mjs` 中添加了以下内存优化：

- ✅ 禁用 worker threads（`workerThreads: false`）
- ✅ 禁用 CSS 优化（`optimizeCss: false`）
- ✅ 禁用生产环境 source map（`productionBrowserSourceMaps: false`）
- ✅ 使用 SWC 压缩（更快，内存占用更少）
- ✅ 优化 webpack 代码分割配置
- ✅ 简化 webpack 优化配置

### 方案 3：升级到 Deno Deploy Pro 计划（推荐）

如果免费计划的内存限制不足：

1. 升级到 Deno Deploy Pro 计划
2. Pro 计划提供更大的构建内存（3-4GB）
3. 访问：https://deno.com/deploy/pricing

### 方案 4：本地构建后部署静态文件（最可靠）

如果 Deno Deploy 的内存限制无法满足需求：

1. **在本地构建项目**：
   ```bash
   # 设置内存限制
   $env:NODE_OPTIONS="--max-old-space-size=4096"
   pnpm run build
   ```

2. **将构建产物部署**：
   - 构建完成后会生成 `out` 目录
   - 将 `out` 目录的内容部署到 Deno Deploy
   - 或者使用其他静态托管服务（Vercel、Netlify、GitHub Pages 等）

3. **使用 GitHub Actions 自动构建**：
   ```yaml
   # .github/workflows/build.yml
   name: Build and Deploy
   on:
     push:
       branches: [main]
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: pnpm/action-setup@v2
         - uses: actions/setup-node@v3
         - run: pnpm install
         - run: NODE_OPTIONS="--max-old-space-size=4096" pnpm run build
         - # 部署 out 目录到 Deno Deploy
   ```

### 方案 5：减少构建时的内存使用

如果必须使用 Deno Deploy 构建，可以尝试：

1. **减少 MDX 文件数量**：将部分内容移到外部或简化内容
2. **禁用不必要的功能**：检查是否有可以禁用的插件或优化
3. **分批构建**：如果可能，将项目拆分为多个较小的项目

## 当前配置状态

- ✅ `deno.json`：已简化为 `"build": "next build"`
- ✅ `next.config.mjs`：已添加多项内存优化配置
- ⚠️ 环境变量：需要在 Deno Deploy 控制台手动设置（如果支持）

## 验证步骤

1. 检查 Deno Deploy 构建日志
2. 确认没有内存溢出错误
3. 验证构建成功完成
4. 检查 `out` 目录是否生成

## 如果问题仍然存在

1. **检查 Deno Deploy 计划**：确认当前计划的内存限制
2. **联系 Deno 支持**：https://deno.com/deploy/docs/support
3. **考虑替代方案**：
   - 使用 Vercel（对 Next.js 优化更好）
   - 使用 Netlify
   - 使用 GitHub Pages + GitHub Actions

## 参考链接

- [Deno Deploy 定价和限制](https://deno.com/deploy/pricing)
- [Deno Deploy 构建参考](https://docs.deno.com/deploy/reference/builds/)
- [Next.js 构建优化](https://nextjs.org/docs/app/building-your-application/configuring/debugging)


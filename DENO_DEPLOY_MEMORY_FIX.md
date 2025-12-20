# Deno Deploy 内存溢出问题解决方案

## 问题描述

在 Deno Deploy 上构建 Next.js 项目时出现内存溢出错误：
```
Fatal JavaScript out of memory: Ineffective mark-compacts near heap limit
```

## 原因分析

1. **默认内存限制过低**：Deno/Node.js 默认的堆内存限制可能不足以支持大型 Next.js 项目的构建
2. **构建任务配置错误**：`deno.json` 中的 build 任务配置不正确
3. **大量 MDX 文件处理**：项目包含大量 MDX 文件，构建时需要更多内存

## 解决方案

### 方案 1：在 Deno Deploy 中设置环境变量（推荐）

在 Deno Deploy 的项目设置中添加环境变量：

1. 登录 Deno Deploy 控制台
2. 进入项目设置（Project Settings）
3. 在 "Environment Variables" 部分添加：
   - **Key**: `NODE_OPTIONS`
   - **Value**: `--max-old-space-size=4096`

这将把 Node.js 的堆内存限制设置为 4GB。

### 方案 2：使用 deno.json 中的 build 任务

如果 Deno Deploy 使用 `deno.json` 中的 build 任务，已经修复为：
```json
{
  "tasks": {
    "build": "NODE_OPTIONS=--max-old-space-size=4096 next build"
  }
}
```

### 方案 3：优化构建配置

已经在 `next.config.mjs` 中添加了内存优化配置：
- 禁用 worker threads
- 限制 CPU 核心数
- 禁用 CSS 优化
- 优化 webpack 代码分割

### 方案 4：本地构建后部署（如果上述方案无效）

如果 Deno Deploy 的内存限制仍然不足，可以考虑：

1. 在本地构建项目：
   ```bash
   NODE_OPTIONS=--max-old-space-size=4096 pnpm run build
   ```

2. 将构建产物（`out` 目录）部署到 Deno Deploy

## 验证

部署后，检查构建日志是否包含：
- 没有内存溢出错误
- 构建成功完成
- `out` 目录已生成

## 注意事项

- 4GB 内存限制可能需要 Deno Deploy 的付费计划
- 如果仍然出现内存问题，可以尝试增加到 8GB：`--max-old-space-size=8192`
- 确保 Deno Deploy 项目有足够的内存配额


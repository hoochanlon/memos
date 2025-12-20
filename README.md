# Memos

基于 fumadocs 构建的静态个人网页备忘录。

* 增加行号适配
* 增加标签页、归档页
* 增加静态网页导航
* 增加更新时间、发布时间
* 增加文章加密
* 增加返回顶部按钮
* 增加中文 URL 解码(JS)
* 增加本地图片路径兼容组件(MDX)
* 接入 [Pages CMS](https://pagescms.org) 提供便捷写作

完整功能详细见：https://github.com/fuma-nama/fumadocs/discussions/2717#discussioncomment-15276522

`pnpm install` 安装与 `pnpm dev` 运行：

* `pnpm add -D tsx` 安装运行时，`npx tsx your-file.ts` 直接运行 TypeScript
* package.json：`"postbuild": "node scripts/decode-paths.js"`
    * 这会在 `pnpm run build` 完成后自动运行 scripts/decode-paths.js。

下载地址：https://github.com/hoochanlon/memos/releases

![](https://cdn.jsdelivr.net/gh/hoochanlon/picx-images-hosting@master/uploads/2025/PixPin_2025-12-10_20-39-13.webp)
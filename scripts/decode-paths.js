const { readdirSync, renameSync, statSync } = require('fs');
const { join } = require('path');

// 遍历 out 目录，将编码过的路径解码为可读目录名（支持中文）
const root = join(process.cwd(), 'out');

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (!statSync(full).isDirectory()) continue;

    const decoded = decodeURIComponent(name);
    const target = decoded === name ? full : join(dir, decoded);

    // 先重命名，再递归
    if (decoded !== name) {
      renameSync(full, target);
    }

    walk(target);
  }
}

walk(root);
console.log('中文目录解码完成');


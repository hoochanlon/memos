import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import SearchDialog from '@/components/search';
import type { Metadata } from 'next';
import 'katex/dist/katex.css';
import { Quicksand } from 'next/font/google';

// 获取 basePath，确保图标路径正确
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const metadataBase = process.env.NODE_ENV === 'production' 
  ? new URL(`https://blog.hoochanlon.moe${basePath}`)
  : new URL('http://localhost:3000');

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-quicksand',
});

export const metadata: Metadata = {
  metadataBase,
  title: 'My memos',
  description: '个人备忘录：随笔、记录、归档。',
  // 在静态导出模式下，使用 public 目录中的图标
  icons: {
    icon: `${basePath}/icon.svg`,
    shortcut: `${basePath}/icon.svg`,
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning className={quicksand.variable}>
      <body className="flex flex-col min-h-screen antialiased">
        <RootProvider
          search={{
            SearchDialog,
          }}
          theme={{
            defaultTheme: 'light', // 设置默认主题为浅色模式
            enableSystem: false,  // 禁用系统主题检测，始终使用默认主题
            attribute: 'class',   // 使用 class 属性而不是 data-theme
            storageKey: 'theme',  // 存储键名
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}

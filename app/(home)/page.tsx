'use client';

import Link from 'next/link';
import { ArrowRight, ExternalLink, Github, Book, Code, Brain, Clock, Star,FileText } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { SiteFooter } from '@/components/site-footer';
import { useEffect } from 'react';

export default function HomePage() {
  // 预加载 welcome.png 图片，确保点击"浏览内容"后立即显示
  useEffect(() => {
    // 获取 basePath（与 BasePathImage 组件逻辑一致）
    const getBasePath = (): string => {
      if (typeof window === 'undefined') return '';
      const pathname = window.location.pathname;
      if (pathname.startsWith('/memos/') || pathname === '/memos') {
        return '/memos';
      }
      const envBasePath = process.env.NEXT_PUBLIC_BASE_PATH;
      if (envBasePath) {
        return envBasePath;
      }
      return '';
    };

    const basePath = getBasePath();
    const imageSrc = `${basePath}/imgs/welcome.png`;
    
    // 预加载图片
    const img = new window.Image();
    img.src = imageSrc;
    
    // 也可以使用 link prefetch（更现代的方法）
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'image';
    link.href = imageSrc;
    document.head.appendChild(link);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* 英雄区域 pt 移动端高度，md:pt 桌面端高度，pb 移动端底部间距，md:pb 桌面端底部间距 */}
      <section className="flex flex-col items-center justify-start pt-30 pb-10 md:pt-50 md:pb-12 px-4 text-center flex-1">
        {/* 头像图片 */}
        <motion.div 
          className="flex justify-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-border shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <Image
              src="/avatar.png"
              alt="Hoochanlon"
              fill
              className="object-cover"
              priority
              fetchPriority="high"
              sizes="(max-width: 768px) 128px, 160px"
            />
          </div>
        </motion.div>
        
        <motion.div 
          className="max-w-3xl mx-auto space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-400 dark:text-gray-400">
            Hoochanlon's Memos
          </h1>
          <p className="text-gray-400 dark:text-gray-500 leading-relaxed" style={{ fontFamily: "'Resource Han Rounded CN', sans-serif", fontSize: '24px', fontWeight: 300, letterSpacing: '0.02em' }}>
            个人备忘录：随笔、记录、归档。
          </p>
          
          {/* 按钮组 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">

            <Link
              href="https://hoochanlon.moe/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-foreground border border-border rounded-lg hover:opacity-90 transition-all duration-300 transform hover:scale-105"
              style={{ fontFamily: "'Resource Han Rounded CN', sans-serif", fontSize: '20px', fontWeight: 700, letterSpacing: '0.03em', color: 'rgb(156, 163, 175)' }}
              >
              <ExternalLink className="w-5 h-5" />
              个人主页
            </Link>
            
            <Link
              href="/notes/essay"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-foreground border border-border rounded-lg hover:opacity-90 transition-all duration-300 transform hover:scale-105"
              style={{ fontFamily: "'Resource Han Rounded CN', sans-serif", fontSize: '20px', fontWeight: 700, letterSpacing: '0.03em', color: 'rgb(156, 163, 175)' }}
              prefetch={true}
            >
              浏览内容
              <ArrowRight className="w-5 h-5" />
            </Link>

            {/* <Link
              href="https://github.com/hoochanlon"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gray-100 dark:bg-gray-800 text-foreground rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
            >
              <Github className="w-5 h-5" />
              GitHub
            </Link> */}
          </div>
        </motion.div>
      </section>

      {/* 预加载 welcome.png 图片，确保点击"浏览内容"后立即显示 */}
      <div className="hidden">
        <Image
          src="/imgs/welcome.png"
          alt=""
          width={1200}
          height={800}
          priority={false}
          fetchPriority="low"
          loading="lazy"
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      </div>

      {/* <SiteFooter /> */}
    </div>
  );
}

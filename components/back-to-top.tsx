'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // 当页面滚动超过 300px 时显示按钮
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // 检测主题
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    // 监听主题变化
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    checkTheme();
    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
      observer.disconnect();
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) {
    return null;
  }

  // 根据主题设置阴影
  const getShadow = (hover = false) => {
    if (isDark) {
      return hover
        ? '0 20px 35px -5px rgba(0, 0, 0, 0.5), 0 10px 15px -6px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(96, 165, 250, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
        : '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(96, 165, 250, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
    } else {
      return hover
        ? '0 20px 35px -5px rgba(0, 0, 0, 0.2), 0 10px 15px -6px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
        : '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
    }
  };

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-24 right-8 z-50 flex items-center justify-center w-12 h-12 rounded-full border-2 border-fd-border dark:border-blue-400/40 bg-fd-card dark:bg-[#1a1f3a] text-fd-foreground hover:border-fd-primary dark:hover:border-blue-400/60 hover:bg-fd-primary/5 dark:hover:bg-[#252b4a] transition-all duration-200 hover:scale-110 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-fd-primary/50 focus:ring-offset-2"
      style={{
        boxShadow: getShadow(false),
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = getShadow(true);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = getShadow(false);
      }}
      aria-label="回到顶部"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}


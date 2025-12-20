'use client';

import { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, Eye, EyeOff } from 'lucide-react';

interface PasswordProtectionProps {
  password: string; // 可以是明文或 base64 编码的密码
  children: React.ReactNode;
  articleId?: string; // 要保护的 article 元素 ID，默认为 'nd-page'
  tocId?: string; // 要保护的目录元素 ID，默认为 'nd-toc'
  passwordHint?: string; // 密码提示文字，通过 front-matter 的 passwordHint 字段设置
}

/**
 * 密码保护组件
 * 支持 base64 编码的密码
 */
export function PasswordProtection({
  password,
  children,
  articleId = 'nd-page',
  tocId = 'nd-toc',
  passwordHint,
}: PasswordProtectionProps) {
  // 解码 base64 密码或使用明文
  const decodePassword = (pwd: string): string => {
    try {
      // 尝试 base64 解码
      const decoded = atob(pwd);
      // 检查解码后的字符串是否看起来像有效的密码（不是乱码）
      // 简单检查：如果解码后包含可打印字符，则使用解码后的值
      if (/^[\x20-\x7E]+$/.test(decoded)) {
        return decoded;
      }
    } catch {
      // 如果不是 base64，使用原值
    }
    return pwd;
  };

  const correctPassword = decodePassword(password);

  // 在初始化时同步检查 localStorage（仅在客户端）
  const getInitialUnlockedState = (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const savedPassword = localStorage.getItem(`article-password-${articleId}`);
      return savedPassword === correctPassword;
    } catch {
      return false;
    }
  };

  const [isUnlocked, setIsUnlocked] = useState(getInitialUnlockedState);
  const [inputPassword, setInputPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const articleRef = useRef<HTMLElement | null>(null);
  const tocRef = useRef<HTMLElement | null>(null);

  // 初始加载时同步状态并处理样式
  useEffect(() => {
    const styleId = `password-protection-${articleId}`;
    
    // 如果已解锁，只移除隐藏样式，不操作内容（让内容自然渲染，避免闪烁）
    if (isUnlocked) {
      // 移除隐藏密码输入界面的样式
      const hidePasswordFormStyle = document.getElementById('hide-password-form');
      if (hidePasswordFormStyle) {
        hidePasswordFormStyle.remove();
      }
      // 移除内容隐藏样式
      const style = document.getElementById(styleId);
      if (style) {
        style.remove();
      }
      // 不操作内容，让 React 组件自然渲染，保持与没加密文章一样的刷新效果
    } else {
      // 如果未解锁，确保隐藏样式存在（只隐藏非密码输入界面的内容）
      let style = document.getElementById(styleId);
      if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          #${articleId} > *:not([data-password-form]) { display: none !important; }
          #${tocId} { display: none !important; }
          [data-toc-popover] { display: none !important; }
          [data-toc-popover-trigger] { display: none !important; }
          [data-toc-popover-content] { display: none !important; }
        `;
        document.head.appendChild(style);
      }
    }
    
    // 清理函数：组件卸载时移除样式
    return () => {
      const styleToRemove = document.getElementById(styleId);
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, [articleId, tocId, isUnlocked]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (inputPassword === correctPassword) {
      setIsUnlocked(true);
      // 保存密码到 localStorage（可选，方便下次访问）
      localStorage.setItem(`article-password-${articleId}`, correctPassword);
      setInputPassword('');
    } else {
      setError('密码错误，请重试');
      setInputPassword('');
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    localStorage.removeItem(`article-password-${articleId}`);
    setInputPassword('');
    setError('');
  };


  if (isUnlocked) {
    return (
      <>
        <div className="mb-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-fd-border bg-fd-card">
            <div className="flex items-center gap-2 text-sm text-fd-muted-foreground">
              <Unlock className="w-4 h-4 text-fd-primary" />
              <span>文章已解锁</span>
            </div>
            <button
              onClick={handleLock}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-fd-border bg-fd-card text-fd-foreground hover:border-fd-primary hover:bg-fd-primary/5 transition-colors"
            >
              <Lock className="w-4 h-4" />
              重新锁定
            </button>
          </div>
        </div>
        {children}
      </>
    );
  }

  return (
    <div 
      data-password-form
      className="flex flex-col items-center justify-center min-h-[400px] p-8"
    >
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-fd-primary/10 mb-2">
            <Lock className="w-8 h-8 text-fd-primary" />
          </div>
          <h2 className="text-2xl font-semibold">该笔记已加密</h2>
          <p className="text-base text-fd-muted-foreground">
            请输入密码以查看内容
          </p>
          {passwordHint && (
            <div className="mt-5 p-4 rounded-lg bg-fd-muted/50 border border-fd-border">
              <p className="text-base text-fd-muted-foreground text-center">
                {passwordHint}
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                value={inputPassword}
                onChange={(e) => {
                  setInputPassword(e.target.value);
                  setError('');
                }}
                placeholder="请输入密码"
                className="w-full px-4 py-3.5 pr-12 text-base rounded-lg border border-fd-border bg-fd-card text-fd-foreground placeholder:text-fd-muted-foreground focus:outline-none focus:ring-2 focus:ring-fd-primary focus:border-transparent transition-colors"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-fd-muted-foreground hover:text-fd-foreground transition-colors p-1"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full px-4 py-3.5 text-base rounded-lg bg-fd-primary text-fd-primary-foreground font-semibold hover:bg-fd-primary/90 transition-colors shadow-sm"
          >
            解锁文章
          </button>
        </form>
      </div>
    </div>
  );
}


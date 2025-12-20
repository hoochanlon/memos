'use client';

import { ReactNode } from 'react';

interface NoSelectProps {
  children: ReactNode;
  className?: string;
  as?: 'summary' | 'a' | 'div';
  href?: string;
  onClick?: () => void;
}

export function NoSelect({ 
  children, 
  className = '', 
  as = 'div',
  href,
  onClick 
}: NoSelectProps) {
  const handleMouseDown = (e: React.MouseEvent) => {
    // 阻止文本选择
    if (e.detail > 1) {
      e.preventDefault();
    }
  };

  const handleSelectStart = (e: React.SyntheticEvent) => {
    e.preventDefault();
  };

  const commonProps = {
    className: `${className} select-none`,
    onMouseDown: handleMouseDown,
    onSelectStart: handleSelectStart,
    style: {
      userSelect: 'none' as const,
      WebkitUserSelect: 'none' as const,
      MozUserSelect: 'none' as const,
      msUserSelect: 'none' as const,
    },
  };

  if (as === 'summary') {
    return (
      <summary {...commonProps} onClick={onClick}>
        {children}
      </summary>
    );
  }

  if (as === 'a') {
    return (
      <a {...commonProps} href={href} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <div {...commonProps} onClick={onClick}>
      {children}
    </div>
  );
}


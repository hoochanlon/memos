import Link from 'next/link';

import BackButton from '@/components/back-button';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/cn';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold sm:text-4xl">404 Not Found</h1>
        <p className="text-fd-muted-foreground">
          找不到请求的页面。
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/"
          className={cn(
            buttonVariants({ color: 'primary', size: 'sm' }),
            'px-5 py-2.5 text-base',
          )}
        >
          返回首页
        </Link>
        <BackButton size="sm" className="px-5 py-2.5 text-base" />
      </div>
    </main>
  );
}


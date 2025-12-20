import Link from 'next/link';
import { FileText, Github } from 'lucide-react';
import { Quicksand } from 'next/font/google';

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-quicksand',
});

export function SiteFooter() {
  return (
    <footer
      className={`${quicksand.className} site-footer py-3 px-4 border-t border-border`}
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="text-muted-foreground text-[18px] leading-snug">
          © {new Date().getFullYear()} Hoochanlon
        </div>
        <div className="flex items-center gap-5">
          <Link
            href="https://blog.hoochanlon.moe/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-[16px] font-medium"
          >
            <FileText className="w-4 h-4" />
            My Blog
          </Link>
          <Link
            href="https://github.com/hoochanlon"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-[16px] font-medium"
          >
            <Github className="w-4 h-4" />
            GitHub
          </Link>
        </div>
      </div>
    </footer>
  );
}


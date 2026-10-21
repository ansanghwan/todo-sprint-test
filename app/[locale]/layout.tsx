import type { Metadata } from 'next';
import { Geist_Mono } from 'next/font/google';
import Toaster from '@/components/ui/toast/Toaster';
import QueryProvider from '@/providers/QueryProvider';
import '@/styles/globals.css';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { locale as rootLocale } from 'next/root-params';
import { routing } from '@/i18n/routing';
import ThemeProvider from '@/providers/ThemeProvider';

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'BrickByBrick',
  description: '오늘 쌓은 하나의 할 일, 내일의 단단한 포트폴리오.',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
}: LayoutProps<'/[locale]'>) {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <html
      lang={locale}
      className={`${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        {/* 버전을 고정한 가변 다이나믹 서브셋: 필요한 글자 묶음만 다운로드합니다. */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <ThemeProvider>
          <NextIntlClientProvider>
            <QueryProvider>{children}</QueryProvider>
            <Toaster />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

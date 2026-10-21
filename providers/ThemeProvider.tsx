'use client';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';
/**
 * next-themes는 새로고침 때 화면이 번쩍이지 않도록 <script>로 테마를 먼저 적용합니다.
 * 이 스크립트는 서버 HTML에서만 실행되면 충분합니다. 브라우저에서 다시 그릴 때는
 * 실행되지 않는 데이터 블록(application/json)으로 바꿔 React 19의 script 경고를 막습니다.
 */
const scriptProps = {
  type: typeof window === 'undefined' ? 'text/javascript' : 'application/json',
};

export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="system"
      scriptProps={scriptProps}
      enableSystem
    >
      {children}
    </NextThemesProvider>
  );
}

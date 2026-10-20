import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { expect, it, vi } from 'vitest';
import IntlTestProvider from '@/test/IntlTestProvider';
import Home from './page';

// 이 테스트는 번역과 마크업만 확인하며 GSAP와 로그인 요청은 실행하지 않습니다.
vi.mock('@/components/landing/LandingSmoothScroll', () => ({
  default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock('@/components/landing/LandingStartButton', () => ({
  default: ({ children }: { children: ReactNode }) => (
    <button>{children}</button>
  ),
}));

it.each(['ko', 'en'] as const)(
  '랜딩의 %s 문장과 줄바꿈·시작 버튼을 표시한다',
  (locale) => {
    render(
      <IntlTestProvider locale={locale}>
        <Home />
      </IntlTestProvider>,
    );
    const english = locale === 'en';
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(
      english
        ? 'One task accomplished today,a solid portfolio tomorrow.'
        : '오늘 쌓은 하나의 할 일,내일의 단단한 포트폴리오.',
    );
    expect(heading.querySelector('br')).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', {
        name: english ? 'Get Started' : '시작하기',
      }),
    ).toHaveLength(2);
    expect(
      screen.getByRole('heading', {
        name: english
          ? 'Get started on your to-dos quickly and easily'
          : '쉽고 빠르게 할 일을 시작해요',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: english
          ? 'Characters communicating with one another inside speech bubbles'
          : '말풍선 속 캐릭터들이 서로 소통하는 모습',
      }),
    ).toBeInTheDocument();
  },
);

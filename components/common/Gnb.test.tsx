import '@testing-library/jest-dom/vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import messages from '@/messages/ko.json';
import Gnb from './Gnb';

vi.mock('next/link', () => ({
  default: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} />,
}));

// Gnb의 i18n Link가 useLocale()을 쓰므로 앱 layout처럼 Provider로 감쌉니다.
function wrapper({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="ko" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const menu = () => within(screen.getByRole('navigation', { name: '주 메뉴' }));

describe('주 메뉴 활성 상태', () => {
  it('선택 메뉴를 전달하지 않으면 활성 표시가 없고 목표 목록은 닫힌다', () => {
    render(<Gnb />, { wrapper });
    expect(
      screen.getByRole('navigation').querySelector('[aria-current]'),
    ).toBeNull();
    expect(
      menu().getByRole('button', { name: '목표 목록 펼치기', hidden: true }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('링크 이동을 차단하지 않고 활성 표시는 전달받은 경로 상태를 따른다', () => {
    render(<Gnb activeMenu="dashboard" />, { wrapper });
    for (const title of [
      '대시보드',
      '캘린더',
      '소통 게시판',
      '노트 모아보기',
      '목표',
    ]) {
      const link = menu().getByRole('link', { name: title, hidden: true });
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });
      // 링크 기본 동작은 테스트 환경에서만 막고, 컴포넌트의 차단 여부를 먼저 확인합니다.
      document.addEventListener(
        'click',
        (event) => {
          expect(event.defaultPrevented).toBe(false);
          event.preventDefault();
        },
        { once: true },
      );
      fireEvent(link, event);
    }
    expect(menu().getByRole('link', { name: '대시보드' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      menu().getByRole('link', { name: '목표', hidden: true }),
    ).not.toHaveAttribute('aria-current');
  });

  it('목표 목록을 열고 닫아도 현재 메뉴의 활성 표시는 유지한다', () => {
    render(<Gnb activeMenu="dashboard" />, { wrapper });
    const toggle = menu().getByRole('button', {
      name: '목표 목록 펼치기',
      hidden: true,
    });
    const panel = document.getElementById(
      toggle.getAttribute('aria-controls')!,
    );
    expect(panel).toHaveAttribute('inert');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(panel).not.toHaveAttribute('inert');
    fireEvent.click(toggle);
    expect(panel).toHaveAttribute('inert');
    expect(menu().getByRole('link', { name: '대시보드' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});

it('배치 위치가 달라도 같은 알림 상태와 열기 함수를 사용한다', () => {
  const onOpenNotifications = vi.fn();
  const view = render(
    <Gnb
      pageTitle="내 정보 관리"
      hasNotification
      onOpenNotifications={onOpenNotifications}
    />,
    { wrapper },
  );
  expect(screen.getByText('내 정보 관리')).toBeInTheDocument();
  // jsdom은 반응형 CSS를 계산하지 않으므로 세 배치의 공통 연결을 검증합니다.
  const buttons = screen.getAllByRole('button', {
    name: '알림 열기 (새 알림 있음)',
  });
  expect(buttons).toHaveLength(3);
  buttons.forEach((button) => fireEvent.click(button));
  expect(onOpenNotifications).toHaveBeenCalledTimes(3);
  view.rerender(
    <Gnb hasNotification={false} onOpenNotifications={onOpenNotifications} />,
  );
  expect(
    screen.queryByRole('button', { name: '알림 열기 (새 알림 있음)' }),
  ).not.toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: '알림 열기' })).toHaveLength(3);
});

it.each([false, true])(
  '메뉴 이동 시 태블릿 이상(%s)은 유지하고 모바일은 즉시 닫는다',
  (wideScreen) => {
    vi.stubGlobal('matchMedia', () => ({
      matches: wideScreen,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const { container } = render(<Gnb activeMenu="dashboard" />, { wrapper });
    const toggle = screen.getByRole('button', { name: '메뉴 열기·닫기' });
    fireEvent.click(toggle);
    const link = menu().getByRole('link', { name: '캘린더' });
    // Next Link가 브라우저 기본 이동을 막고 클라이언트 이동을 수행하는 상황입니다.
    link.addEventListener('click', (event) => event.preventDefault(), {
      once: true,
    });
    fireEvent.click(link);
    expect(container.querySelector('aside')).toHaveAttribute(
      'data-open',
      String(wideScreen),
    );
    const panel = container.querySelector<HTMLElement>('#gnb-menu')!;
    expect(panel.style.transitionDuration).toBe(wideScreen ? '' : '0s');
    if (!wideScreen) {
      fireEvent.click(toggle);
      expect(panel.style.transitionDuration).toBe('');
      expect(container.querySelector('aside')).toHaveAttribute(
        'data-open',
        'true',
      );
    }
  },
);

it('프로필 링크에 사용자 이미지를 보여주고, 없으면 기본 이미지를 보여준다', () => {
  const avatar = () =>
    screen.getByRole('link', { name: '내 정보 관리' }).querySelector('img');
  const { rerender } = render(<Gnb userImage="https://example.com/me.png" />, {
    wrapper,
  });
  expect(avatar()).toHaveAttribute('src', 'https://example.com/me.png');

  rerender(<Gnb userImage={null} />);
  expect(avatar()?.getAttribute('src')).toContain('img_profile.jpg');
});

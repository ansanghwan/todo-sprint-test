import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import IntlTestProvider from '@/test/IntlTestProvider';
import TodoItemKebab from './TodoItemKebab';

const renderKebab = (props: Parameters<typeof TodoItemKebab>[0]) =>
  render(
    <IntlTestProvider>
      <TodoItemKebab {...props} />
    </IntlTestProvider>,
  );

const openMenu = async (props: Parameters<typeof TodoItemKebab>[0]) => {
  // 메뉴가 열려 있는 동안 Radix가 body에 pointer-events: none을 겁니다.
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  renderKebab(props);
  await user.click(screen.getByRole('button', { name: '더보기' }));
  return user;
};

// 흰 케밥 아이콘(IconKebabWhite)만 흰 원 배경을 가집니다.
const hasWhiteIcon = () =>
  screen
    .getByRole('button', { name: '더보기' })
    .querySelector('circle[fill="white"]') !== null;

describe('TodoItemKebab', () => {
  it('onEdit이 없으면 수정 메뉴를 그리지 않는다', async () => {
    await openMenu({ onDelete: vi.fn() });

    expect(
      screen.queryByRole('menuitem', { name: '수정하기' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: '삭제하기' }),
    ).toBeInTheDocument();
  });

  it('수정하기를 고르면 onEdit만 호출한다', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const user = await openMenu({ onEdit, onDelete });

    await user.click(screen.getByRole('menuitem', { name: '수정하기' }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('삭제하기를 고르면 onDelete만 호출한다', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const user = await openMenu({ onEdit, onDelete });

    await user.click(screen.getByRole('menuitem', { name: '삭제하기' }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('isWhite면 흰 케밥 아이콘을, 기본은 일반 아이콘을 쓴다', () => {
    const { unmount } = renderKebab({ onDelete: vi.fn(), isWhite: true });
    expect(hasWhiteIcon()).toBe(true);
    unmount();

    renderKebab({ onDelete: vi.fn() });
    expect(hasWhiteIcon()).toBe(false);
  });
});

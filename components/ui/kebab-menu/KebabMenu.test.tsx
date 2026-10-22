import { render as rtlRender, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import IntlTestProvider from '@/test/IntlTestProvider';

import KebabMenu from './KebabMenu';

const render = (ui: ReactElement) =>
  rtlRender(ui, { wrapper: IntlTestProvider });

const renderKebabMenu = () => {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  render(
    <KebabMenu
      items={[
        { label: '수정하기', onSelect: onEdit },
        { label: '삭제하기', onSelect: onDelete },
      ]}
    />,
  );
  return { onEdit, onDelete };
};

describe('KebabMenu', () => {
  it('처음에는 메뉴가 닫혀 있다', () => {
    renderKebabMenu();

    expect(screen.getByRole('button', { name: '더보기' })).toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('버튼을 누르면 주입한 항목이 열린다', async () => {
    const user = userEvent.setup();
    renderKebabMenu();

    await user.click(screen.getByRole('button', { name: '더보기' }));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: '수정하기' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: '삭제하기' }),
    ).toBeInTheDocument();
  });

  it('항목을 누르면 해당 onSelect를 호출하고 닫힌다', async () => {
    const user = userEvent.setup();
    const { onEdit, onDelete } = renderKebabMenu();

    await user.click(screen.getByRole('button', { name: '더보기' }));
    await user.click(screen.getByRole('menuitem', { name: '삭제하기' }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('ESC를 누르면 닫힌다', async () => {
    const user = userEvent.setup();
    renderKebabMenu();

    await user.click(screen.getByRole('button', { name: '더보기' }));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('바깥을 누르면 닫힌다', async () => {
    // 열려 있는 동안 Radix가 body에 pointer-events: none을 걸어 바깥 클릭을 가로챕니다.
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderKebabMenu();

    await user.click(screen.getByRole('button', { name: '더보기' }));
    await user.click(document.body);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('키보드로 열고 방향키로 항목을 고를 수 있다', async () => {
    const user = userEvent.setup();
    const { onEdit } = renderKebabMenu();

    screen.getByRole('button', { name: '더보기' }).focus();
    await user.keyboard('{Enter}');
    await user.keyboard('{Enter}');

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('ariaLabel로 버튼 이름을 바꿀 수 있다', () => {
    render(<KebabMenu items={[]} ariaLabel="할 일 더보기" />);

    expect(
      screen.getByRole('button', { name: '할 일 더보기' }),
    ).toBeInTheDocument();
  });
});

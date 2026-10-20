import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ConfirmModal from './ConfirmModal';

const renderConfirmModal = (
  props: Partial<Parameters<typeof ConfirmModal>[0]> = {},
) => {
  const onOpenChange = vi.fn();
  const onConfirm = vi.fn();
  render(
    <ConfirmModal
      isOpen
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title="정말 삭제하시겠어요?"
      {...props}
    />,
  );
  return { onOpenChange, onConfirm };
};

describe('ConfirmModal', () => {
  it('제목을 다이얼로그 이름으로 노출하고 기본 버튼 문구를 보여준다', () => {
    renderConfirmModal();

    expect(
      screen.getByRole('dialog', { name: '정말 삭제하시겠어요?' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
  });

  it('X 닫기 버튼을 그리지 않는다', () => {
    renderConfirmModal();

    expect(
      screen.queryByRole('button', { name: '닫기' }),
    ).not.toBeInTheDocument();
  });

  it('description이 있을 때만 경고 문구를 보여준다', () => {
    const { unmount } = render(
      <ConfirmModal
        isOpen
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        title="정말 삭제하시겠어요?"
      />,
    );
    expect(
      screen.queryByText('삭제된 프로젝트는 복구할 수 없습니다.'),
    ).not.toBeInTheDocument();
    unmount();

    renderConfirmModal({
      description: '삭제된 프로젝트는 복구할 수 없습니다.',
    });
    expect(
      screen.getByText('삭제된 프로젝트는 복구할 수 없습니다.'),
    ).toBeInTheDocument();
  });

  it('버튼 문구를 바꿀 수 있다', () => {
    renderConfirmModal({ cancelLabel: '계속 작성', confirmLabel: '나가기' });

    expect(
      screen.getByRole('button', { name: '계속 작성' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '나가기' })).toBeInTheDocument();
  });

  it('확인을 누르면 onConfirm을 호출한다', async () => {
    const user = userEvent.setup();
    const { onConfirm, onOpenChange } = renderConfirmModal();

    await user.click(screen.getByRole('button', { name: '확인' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('취소를 누르면 닫힘을 요청한다', async () => {
    const user = userEvent.setup();
    const { onOpenChange, onConfirm } = renderConfirmModal();

    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('ESC를 누르면 닫힘을 요청한다', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderConfirmModal();

    await user.keyboard('{Escape}');

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('바깥(오버레이)을 누르면 닫힘을 요청한다', async () => {
    // 열려 있는 동안 Radix가 body에 pointer-events: none을 걸어 바깥 클릭을 가로챕니다.
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const { onOpenChange } = renderConfirmModal();
    const overlay = document.querySelector('.bg-black\\/60');

    await user.click(overlay as Element);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('isPending이면 버튼이 비활성화되고 ESC로도 닫히지 않는다', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderConfirmModal({ isPending: true });

    expect(screen.getByRole('button', { name: '취소' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '확인' })).toBeDisabled();

    await user.keyboard('{Escape}');

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

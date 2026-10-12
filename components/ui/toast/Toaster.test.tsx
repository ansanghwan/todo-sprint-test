import {
  act,
  render,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import Toaster, { toast } from './Toaster';

describe('toast', () => {
  afterEach(() => {
    act(() => {
      toast.dismiss();
    });
  });

  it('success 토스트에 내용과 meta를 렌더링한다', async () => {
    render(<Toaster />);
    act(() => {
      toast.success('임시 저장이 완료되었습니다', { meta: '1초전' });
    });

    const message = await screen.findByText(
      (_, el) =>
        el?.tagName === 'P' &&
        el.textContent === '임시 저장이 완료되었습니다ㆍ1초전',
    );
    expect(screen.getByText('check')).toBeInTheDocument();
    expect(message.closest('div')).toHaveClass('text-orange-600');
  });

  it('error 토스트에 ReactNode 내용을 렌더링한다', async () => {
    render(<Toaster />);
    act(() => {
      toast.error(<strong>저장에 실패했습니다</strong>);
    });

    const message = await screen.findByText('저장에 실패했습니다');
    expect(screen.getByText('error')).toBeInTheDocument();
    expect(message.closest('div')).toHaveClass('text-danger');
  });

  it('icon에 null을 넘기면 아이콘을 숨긴다', async () => {
    render(<Toaster />);
    act(() => {
      toast.success('아이콘 없음', { icon: null });
    });

    await screen.findByText('아이콘 없음');
    expect(screen.queryByText('check')).not.toBeInTheDocument();
  });

  it('closable이면 닫기 버튼으로 토스트를 닫는다', async () => {
    render(<Toaster />);
    act(() => {
      toast.error('닫을 수 있는 토스트', {
        closable: true,
        duration: Infinity,
      });
    });

    const close = await screen.findByRole('button', { name: '닫기' });
    act(() => {
      close.click();
    });
    await waitForElementToBeRemoved(() =>
      screen.queryByText('닫을 수 있는 토스트'),
    );
  });

  it('closable이 없으면 닫기 버튼이 없다', async () => {
    render(<Toaster />);
    act(() => {
      toast.success('기본 토스트');
    });

    await screen.findByText('기본 토스트');
    expect(
      screen.queryByRole('button', { name: '닫기' }),
    ).not.toBeInTheDocument();
  });
});

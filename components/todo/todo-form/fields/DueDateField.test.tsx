import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog } from 'radix-ui';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import IntlTestProvider, { type TestLocale } from '@/test/IntlTestProvider';
import { installRadixDomMocks } from '@/test/domMocks';
import type { TodoFormErrorKey } from '../todoFormSchema';
import DueDateField from './DueDateField';

beforeEach(() => {
  installRadixDomMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const Harness = ({
  initialValue = '',
  error,
  onChange,
  locale,
}: {
  initialValue?: string;
  error?: TodoFormErrorKey;
  onChange?: (date: string) => void;
  locale?: TestLocale;
}) => {
  const [value, setValue] = useState(initialValue);
  return (
    <IntlTestProvider locale={locale}>
      <DueDateField
        value={value}
        onChange={(date) => {
          setValue(date);
          onChange?.(date);
        }}
        error={error}
      />
    </IntlTestProvider>
  );
};

// 라벨과 연결돼 있어서 버튼의 접근성 이름이 '마감기한'으로 시작합니다.
const trigger = () => screen.getByRole('button', { name: /^마감기한/ });
const openPicker = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(trigger());
  return screen.findByRole('dialog');
};
/** 달력에서 'YYYY-MM-DD' 날짜 칸의 버튼 */
const dayButton = (picker: HTMLElement, date: string) =>
  within(picker.querySelector<HTMLElement>(`[data-day="${date}"]`)!).getByRole(
    'button',
  );
const selectedDay = (picker: HTMLElement) =>
  picker.querySelector('[aria-selected="true"]')?.getAttribute('data-day');

describe('DueDateField', () => {
  it('라벨과 연결되고 필수 입력으로 알리며, 선택 전에는 안내 문구를 보여 준다', () => {
    render(<Harness />);

    expect(trigger()).toHaveAttribute('aria-required', 'true');
    expect(trigger()).toHaveTextContent('날짜를 선택해주세요');
  });

  it('저장된 날짜를 YYYY. MM. DD로 보여 준다', () => {
    render(<Harness initialValue="2026-10-05" />);

    expect(trigger()).toHaveTextContent('2026. 10. 05');
  });

  it('달력은 저장된 날짜의 달을 일요일 시작으로 보여 준다', async () => {
    const user = userEvent.setup();
    render(<Harness initialValue="2026-10-10" />);

    const picker = await openPicker(user);

    expect(within(picker).getByText('2026년 10월')).toBeVisible();
    expect(
      Array.from(picker.querySelectorAll('th')).map(
        (header) => header.textContent,
      ),
    ).toEqual(['일', '월', '화', '수', '목', '금', '토']);
    expect(selectedDay(picker)).toBe('2026-10-10');
  });

  it('날짜를 누르기만 해서는 반영되지 않고, 확인을 눌러야 반영된다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initialValue="2026-10-10" onChange={onChange} />);
    const picker = await openPicker(user);

    await user.click(dayButton(picker, '2026-10-15'));
    expect(onChange).not.toHaveBeenCalled();
    expect(trigger()).toHaveTextContent('2026. 10. 10');

    await user.click(within(picker).getByRole('button', { name: '확인' }));

    expect(onChange).toHaveBeenCalledWith('2026-10-15');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger()).toHaveTextContent('2026. 10. 15');
  });

  it('취소하면 기존 값을 유지한다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initialValue="2026-10-10" onChange={onChange} />);
    const picker = await openPicker(user);

    await user.click(dayButton(picker, '2026-10-15'));
    await user.click(within(picker).getByRole('button', { name: '취소' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger()).toHaveTextContent('2026. 10. 10');
  });

  it('다시 열면 임시 선택이 저장된 날짜로 돌아간다', async () => {
    const user = userEvent.setup();
    render(<Harness initialValue="2026-10-10" />);
    const firstPicker = await openPicker(user);
    await user.click(dayButton(firstPicker, '2026-10-15'));
    expect(selectedDay(firstPicker)).toBe('2026-10-15');
    await user.click(within(firstPicker).getByRole('button', { name: '취소' }));

    const secondPicker = await openPicker(user);

    expect(selectedDay(secondPicker)).toBe('2026-10-10');
  });

  it('취소·확인 버튼은 한 줄을 절반씩 나눠 쓴다', async () => {
    // 공용 Button의 w-full shrink-0 그대로면 버튼이 팝업 밖으로 넘칩니다 (모바일 검수에서 확인).
    const user = userEvent.setup();
    render(<Harness initialValue="2026-10-10" />);

    const picker = await openPicker(user);

    for (const name of ['취소', '확인']) {
      const button = within(picker).getByRole('button', { name });
      expect(button).toHaveClass('min-w-0', 'flex-1', 'shrink');
      expect(button).not.toHaveClass('shrink-0');
    }
  });

  it('선택한 날짜가 없으면 확인을 누를 수 없다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const picker = await openPicker(user);

    expect(within(picker).getByRole('button', { name: '확인' })).toBeDisabled();
  });

  it('달을 넘겨서 고른 날짜도 하루 밀리지 않고 그대로 반영된다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initialValue="2026-12-31" onChange={onChange} />);
    const picker = await openPicker(user);

    await user.click(within(picker).getByRole('button', { name: '다음 달' }));
    await user.click(dayButton(picker, '2027-01-01'));
    await user.click(within(picker).getByRole('button', { name: '확인' }));

    expect(onChange).toHaveBeenCalledWith('2027-01-01');
  });

  it('Esc를 누르면 선택기만 닫히고 바깥 모달은 닫히지 않는다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onModalOpenChange = vi.fn();
    render(
      <Dialog.Root open onOpenChange={onModalOpenChange}>
        <Dialog.Portal>
          <Dialog.Content aria-describedby={undefined}>
            <Dialog.Title>할 일 생성</Dialog.Title>
            <Harness initialValue="2026-10-10" onChange={onChange} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    await user.click(trigger());
    const picker = await screen.findByText('2026년 10월');
    await user.click(
      within(picker.closest('[role="dialog"]') as HTMLElement).getByRole(
        'button',
        { name: /10월 15일/ },
      ),
    );

    await user.keyboard('{Escape}');

    expect(screen.queryByText('2026년 10월')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(onModalOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: '할 일 생성' })).toBeVisible();
    expect(trigger()).toHaveFocus();
  });

  it('오류가 있으면 문구를 보여 주고 trigger와 연결한다', () => {
    render(<Harness error="dueDateRequired" />);

    expect(trigger()).toHaveAttribute('aria-invalid', 'true');
    expect(trigger()).toHaveAccessibleDescription('마감기한을 선택해주세요');
  });

  it('영어에서는 달 이름과 이동 버튼 이름이 영어로 나온다', async () => {
    const user = userEvent.setup();
    render(<Harness initialValue="2026-10-10" locale="en" />);

    await user.click(screen.getByRole('button', { name: /Due Date/ }));
    const picker = await screen.findByRole('dialog');

    expect(within(picker).getByText('October 2026')).toBeVisible();
    expect(
      within(picker).getByRole('button', { name: 'Next month' }),
    ).toBeVisible();
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import IntlTestProvider from '@/test/IntlTestProvider';
import { TAG_MAX_COUNT, type TodoFormErrorKey } from '../todoFormSchema';
import TagInputField from './TagInputField';

const Harness = ({
  initialTags = [],
  error,
  onSubmit,
}: {
  initialTags?: string[];
  error?: TodoFormErrorKey;
  onSubmit?: () => void;
}) => {
  const [tags, setTags] = useState(initialTags);
  return (
    <IntlTestProvider>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit?.();
        }}
      >
        <TagInputField value={tags} onChange={setTags} error={error} />
      </form>
    </IntlTestProvider>
  );
};

const chipLabels = () =>
  screen
    .queryAllByRole('listitem')
    .map((chip) => chip.firstElementChild?.textContent);
const chipColors = () =>
  screen
    .queryAllByRole('listitem')
    .map((chip) => chip.getAttribute('data-color'));

describe('TagInputField', () => {
  it('라벨과 연결된다', () => {
    render(<Harness />);

    expect(screen.getByLabelText('태그')).toHaveAttribute(
      'placeholder',
      '입력 후 Enter',
    );
  });

  it('Enter를 누르면 trim한 태그를 추가하고 입력을 비운다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText('태그'), '  공부 {Enter}');

    expect(chipLabels()).toEqual(['공부']);
    expect(screen.getByLabelText('태그')).toHaveValue('');
  });

  it('Enter로 폼이 제출되지 않는다', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('태그'), '공부{Enter}');

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('공백만 입력하고 Enter를 누르면 추가하지 않고 오류도 없다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText('태그'), '   {Enter}');

    expect(chipLabels()).toEqual([]);
    expect(screen.getByLabelText('태그')).toHaveAttribute(
      'aria-invalid',
      'false',
    );
  });

  it('한글 조합 중의 Enter로는 추가하지 않는다', () => {
    render(<Harness />);
    const input = screen.getByLabelText('태그');

    fireEvent.change(input, { target: { value: '공부' } });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });

    expect(chipLabels()).toEqual([]);
  });

  it('칩의 X로 해당 태그만 지운다', async () => {
    const user = userEvent.setup();
    render(<Harness initialTags={['업무', '공부', '운동']} />);

    await user.click(screen.getByRole('button', { name: '공부 태그 삭제' }));

    expect(chipLabels()).toEqual(['업무', '운동']);
  });

  it('같은 태그를 다시 추가하면 막고 오류를 입력과 연결한다', async () => {
    const user = userEvent.setup();
    render(<Harness initialTags={['공부']} />);
    const input = screen.getByLabelText('태그');

    await user.type(input, ' 공부 {Enter}');

    expect(chipLabels()).toEqual(['공부']);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('이미 추가한 태그입니다');
  });

  it('다시 입력하면 추가 오류가 사라진다', async () => {
    const user = userEvent.setup();
    render(<Harness initialTags={['공부']} />);
    const input = screen.getByLabelText('태그');

    await user.type(input, '공부{Enter}');
    await user.type(input, '2');

    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('51자 태그는 막는다', async () => {
    render(<Harness />);
    const input = screen.getByLabelText('태그');

    fireEvent.change(input, { target: { value: 'a'.repeat(51) } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(chipLabels()).toEqual([]);
    expect(input).toHaveAccessibleDescription(
      '태그는 50자 이내로 입력해주세요',
    );
  });

  it('10개가 있으면 더 추가하지 못한다', async () => {
    const user = userEvent.setup();
    const tags = Array.from({ length: TAG_MAX_COUNT }, (_, i) => `태그${i}`);
    render(<Harness initialTags={tags} />);
    const input = screen.getByLabelText('태그');

    await user.type(input, '하나 더{Enter}');

    expect(chipLabels()).toHaveLength(TAG_MAX_COUNT);
    expect(input).toHaveAccessibleDescription(
      '태그는 최대 10개까지 추가할 수 있습니다',
    );
  });

  it('폼 검증 오류도 입력과 연결한다', () => {
    render(<Harness error="tooManyTags" />);

    expect(screen.getByLabelText('태그')).toHaveAccessibleDescription(
      '태그는 최대 10개까지 추가할 수 있습니다',
    );
  });

  it('입력 중인 글자를 알리고, 태그로 추가되면 빈 값으로 알린다', async () => {
    const user = userEvent.setup();
    const onDraftChange = vi.fn();
    render(
      <IntlTestProvider>
        <TagInputField
          value={[]}
          onChange={() => {}}
          onDraftChange={onDraftChange}
        />
      </IntlTestProvider>,
    );

    await user.type(screen.getByLabelText('태그'), '공부');
    expect(onDraftChange).toHaveBeenLastCalledWith('공부');

    await user.keyboard('{Enter}');
    expect(onDraftChange).toHaveBeenLastCalledWith('');
  });

  describe('칩 색', () => {
    it('순서대로 초록 → 노랑 → 빨강을 반복한다', () => {
      render(<Harness initialTags={['가', '나', '다', '라']} />);

      expect(chipColors()).toEqual(['green', 'yellow', 'red', 'green']);
    });

    it('색을 따로 저장하지 않아서, 앞 태그를 지우면 뒤 태그의 색이 당겨진다', async () => {
      const user = userEvent.setup();
      render(<Harness initialTags={['가', '나', '다']} />);

      await user.click(screen.getByRole('button', { name: '가 태그 삭제' }));

      expect(chipLabels()).toEqual(['나', '다']);
      expect(chipColors()).toEqual(['green', 'yellow']);
    });
  });
});

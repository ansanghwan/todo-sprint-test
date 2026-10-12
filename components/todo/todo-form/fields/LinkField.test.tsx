import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import IntlTestProvider from '@/test/IntlTestProvider';
import type { TodoFormErrorKey } from '../todoFormSchema';
import LinkField from './LinkField';

const Harness = ({
  initialValue = '',
  error,
}: {
  initialValue?: string;
  error?: TodoFormErrorKey;
}) => {
  const [value, setValue] = useState(initialValue);
  return (
    <IntlTestProvider>
      <LinkField value={value} onChange={setValue} error={error} />
    </IntlTestProvider>
  );
};

describe('LinkField', () => {
  it('라벨과 연결되고 선택 입력이라 필수로 알리지 않는다', () => {
    render(<Harness />);

    const input = screen.getByLabelText('링크');
    expect(input).toHaveAttribute('placeholder', '링크를 입력해주세요');
    expect(input).not.toHaveAttribute('aria-required');
  });

  it('직접 입력할 수 있다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText('링크'), 'example.com');

    expect(screen.getByLabelText('링크')).toHaveValue('example.com');
  });

  it('값이 없으면 삭제 버튼이 없고, 값이 있으면 X로 지운다', async () => {
    const user = userEvent.setup();
    render(<Harness initialValue="example.com" />);

    await user.click(screen.getByRole('button', { name: '링크 삭제' }));

    expect(screen.getByLabelText('링크')).toHaveValue('');
    expect(
      screen.queryByRole('button', { name: '링크 삭제' }),
    ).not.toBeInTheDocument();
  });

  it('오류가 있으면 문구를 보여 주고 입력과 연결한다', () => {
    render(<Harness initialValue="hello world" error="linkInvalid" />);

    const input = screen.getByLabelText('링크');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('올바른 링크를 입력해주세요');
  });
});

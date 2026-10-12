import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import IntlTestProvider from '@/test/IntlTestProvider';
import type { TodoFormErrorKey } from '../todoFormSchema';
import TitleField from './TitleField';

const renderField = (error?: TodoFormErrorKey, onChange = vi.fn()) => {
  render(
    <IntlTestProvider>
      <TitleField value="" onChange={onChange} error={error} />
    </IntlTestProvider>,
  );
  return onChange;
};

// 접근성 이름에는 aria-hidden인 별표가 들어가지 않습니다.
const titleInput = () => screen.getByRole('textbox', { name: '제목' });

describe('TitleField', () => {
  it('라벨과 연결되고 필수 입력으로 알린다', () => {
    renderField();

    const input = titleInput();
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(input).toHaveAttribute('placeholder', '할 일의 제목을 적어주세요');
  });

  it('필수 별표는 보조 기기에 읽히지 않는다', () => {
    renderField();

    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
  });

  it('입력한 값을 그대로 알린다', async () => {
    const user = userEvent.setup();
    const onChange = renderField();

    await user.type(titleInput(), '가');

    expect(onChange).toHaveBeenCalledWith('가');
  });

  it('오류가 있으면 문구를 보여 주고 입력과 연결한다', () => {
    renderField('titleTooLong');

    const input = titleInput();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(
      '제목은 30자 이내로 입력해주세요',
    );
  });

  it('공용 TextField의 파란 포커스 테두리와 링을 쓰지 않는다', () => {
    renderField();

    expect(titleInput()).toHaveClass('focus:border-orange-500', 'focus:ring-0');
    expect(titleInput()).not.toHaveClass('focus:border-blue-500');
  });

  it('오류 상태에서 포커스해도 danger 테두리를 유지한다', () => {
    renderField('titleRequired');

    expect(titleInput()).toHaveClass('focus:border-danger');
    expect(titleInput()).not.toHaveClass('focus:border-blue-500');
  });

  it('오류 색은 폼 시안의 danger를 쓴다', () => {
    renderField('titleRequired');

    expect(titleInput()).toHaveClass('border-danger');
    expect(screen.getByText('제목을 입력해주세요')).toHaveClass('text-danger');
  });
});

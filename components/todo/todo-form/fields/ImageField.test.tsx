import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import IntlTestProvider from '@/test/IntlTestProvider';
import type { TodoFormErrorKey } from '../todoFormSchema';
import ImageField from './ImageField';

const createObjectURL = vi.fn();
const revokeObjectURL = vi.fn();

beforeEach(() => {
  let count = 0;
  createObjectURL.mockImplementation(() => {
    count += 1;
    return `blob:preview-${count}`;
  });
  // jsdom에는 없는 API라 테스트 동안만 붙입니다.
  Object.assign(URL, { createObjectURL, revokeObjectURL });
});

afterEach(() => {
  vi.clearAllMocks();
});

const png = (name = 'photo.png') =>
  new File(['image'], name, { type: 'image/png' });

const Harness = ({
  onChange,
  error,
}: {
  onChange?: (file: File | null) => void;
  error?: TodoFormErrorKey;
}) => {
  const [file, setFile] = useState<File | null>(null);
  return (
    <IntlTestProvider>
      <ImageField
        value={file}
        onChange={(next) => {
          setFile(next);
          onChange?.(next);
        }}
        error={error}
      />
    </IntlTestProvider>
  );
};

const attachButton = () => screen.getByRole('button', { name: '이미지 첨부' });
const fileInput = () =>
  screen.getByTestId<HTMLInputElement>('image-file-input');
// 허용하지 않는 확장자도 고를 수 있게 accept 필터를 끕니다.
const setup = () => userEvent.setup({ applyAccept: false });

describe('ImageField', () => {
  it('라벨과 연결되고 허용 확장자만 고르도록 안내한다', () => {
    render(<Harness />);

    expect(screen.getByRole('group', { name: '이미지' })).toBeInTheDocument();
    expect(attachButton()).toHaveAccessibleDescription(
      '이미지는 최대 1개만 첨부할 수 있습니다',
    );
    expect(fileInput()).toHaveAttribute(
      'accept',
      '.jpg,.jpeg,.png,.gif,.webp,.svg',
    );
  });

  it('파일을 고르면 업로드하지 않고 미리보기만 보여 준다', async () => {
    const user = setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const file = png();

    await user.upload(fileInput(), file);

    expect(onChange).toHaveBeenCalledWith(file);
    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(
      screen.getByRole('img', { name: '첨부한 이미지 미리보기' }),
    ).toHaveAttribute('src', 'blob:preview-1');
    expect(
      screen.queryByRole('button', { name: '이미지 첨부' }),
    ).not.toBeInTheDocument();
  });

  it('X로 삭제하면 미리보기 URL을 해제하고 첨부 버튼으로 돌아간다', async () => {
    const user = setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await user.upload(fileInput(), png());

    await user.click(screen.getByRole('button', { name: '이미지 삭제' }));

    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-1');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('삭제한 뒤 같은 파일을 다시 고를 수 있다', async () => {
    const user = setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const file = png();

    await user.upload(fileInput(), file);
    expect(fileInput().value).toBe('');
    await user.click(screen.getByRole('button', { name: '이미지 삭제' }));
    await user.upload(fileInput(), file);

    expect(onChange.mock.calls.map(([value]) => value)).toEqual([
      file,
      null,
      file,
    ]);
  });

  it('다른 파일로 바꾸면 이전 미리보기 URL을 해제한다', async () => {
    const user = setup();
    render(<Harness />);

    await user.upload(fileInput(), png('first.png'));
    await user.upload(fileInput(), png('second.png'));

    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-1');
    expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:preview-2');
  });

  it('컴포넌트가 사라질 때 미리보기 URL을 해제한다', async () => {
    const user = setup();
    const { unmount } = render(<Harness />);
    await user.upload(fileInput(), png());

    unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-1');
  });

  it('허용하지 않는 확장자는 첨부하지 않고 오류를 보여 준다', async () => {
    const user = setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.upload(
      fileInput(),
      new File(['doc'], 'doc.pdf', { type: 'application/pdf' }),
    );

    expect(onChange).not.toHaveBeenCalled();
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(attachButton()).toHaveAccessibleDescription(
      /jpg, jpeg, png, gif, webp, svg 파일만 첨부할 수 있습니다/,
    );
  });

  it('올바른 파일을 고르면 오류가 사라진다', async () => {
    const user = setup();
    render(<Harness />);
    await user.upload(
      fileInput(),
      new File(['doc'], 'doc.pdf', { type: 'application/pdf' }),
    );

    await user.upload(fileInput(), png());

    expect(
      screen.queryByText(/파일만 첨부할 수 있습니다/),
    ).not.toBeInTheDocument();
  });

  it('폼 검증 오류도 첨부 버튼과 연결한다', () => {
    render(<Harness error="imageExtensionInvalid" />);

    expect(attachButton()).toHaveAccessibleDescription(
      /파일만 첨부할 수 있습니다/,
    );
  });
});

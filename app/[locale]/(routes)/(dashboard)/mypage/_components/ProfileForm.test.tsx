import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { Suspense } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/lib/api/client-fetcher';
import { uploadImage } from '@/lib/api/images';
import TestProviders from '@/test/TestProviders';
import ProfileForm from './ProfileForm';

vi.mock('@/lib/api/images', () => ({ uploadImage: vi.fn() }));

const originalAdapter = api.defaults.adapter;
afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

const me = {
  id: 1,
  teamId: 'team',
  email: 'user@example.com',
  name: '홍길동',
  image: null,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

const replyToUserRequests = ({
  isNameAvailable,
}: {
  isNameAvailable: boolean;
}) => {
  const sent: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async (config) => {
    sent.push(config);
    const data =
      config.url === '/users/check-nickname'
        ? { available: isNameAvailable }
        : config.method === 'patch'
          ? { ...me, ...JSON.parse(config.data) }
          : me;
    return { data, status: 200, statusText: '', headers: {}, config };
  };
  api.defaults.adapter = adapter;
  return sent;
};

const renderForm = () =>
  render(
    <Suspense fallback={null}>
      <ProfileForm />
    </Suspense>,
    { wrapper: TestProviders },
  );

const changeName = async (
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) => {
  const input = await screen.findByLabelText('이름');
  await user.clear(input);
  await user.type(input, name);
};
const saveButton = () => screen.getByRole('button', { name: '저장하기' });
const checkButton = () => screen.getByRole('button', { name: '중복 검사' });

describe('ProfileForm', () => {
  it('이메일은 읽기 전용이고 바꾼 것이 없으면 저장할 수 없다', async () => {
    replyToUserRequests({ isNameAvailable: true });
    renderForm();

    expect(await screen.findByLabelText('이메일')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('이메일')).toHaveValue('user@example.com');
    expect(saveButton()).toBeDisabled();
  });

  it('이름을 바꾸면 중복 검사를 통과해야 저장할 수 있고, 바뀐 이름만 보낸다', async () => {
    const user = userEvent.setup();
    const sent = replyToUserRequests({ isNameAvailable: true });
    renderForm();

    await changeName(user, '새이름');
    expect(saveButton()).toBeDisabled();

    await user.click(checkButton());
    expect(
      await screen.findByText('사용 가능한 이름입니다.'),
    ).toBeInTheDocument();
    await user.click(saveButton());

    const patch = await vi.waitFor(() => {
      const request = sent.find(({ method }) => method === 'patch');
      expect(request).toBeDefined();
      return request!;
    });
    expect(patch.url).toBe('/users/me');
    expect(JSON.parse(patch.data)).toEqual({ name: '새이름' });
  });

  it('이미지를 고르면 저장할 때 올리고, 받은 URL만 보낸다', async () => {
    const user = userEvent.setup();
    const sent = replyToUserRequests({ isNameAvailable: true });
    vi.mocked(uploadImage).mockResolvedValue('https://files.test/profile.png');
    renderForm();
    await screen.findByLabelText('이름');

    const file = new File(['image'], 'profile.png', { type: 'image/png' });
    await user.upload(screen.getByTestId('profile-image-input'), file);
    expect(uploadImage).not.toHaveBeenCalled();
    await user.click(saveButton());

    const patch = await vi.waitFor(() => {
      const request = sent.find(({ method }) => method === 'patch');
      expect(request).toBeDefined();
      return request!;
    });
    expect(uploadImage).toHaveBeenCalledWith(file);
    expect(JSON.parse(patch.data)).toEqual({
      image: 'https://files.test/profile.png',
    });
    await vi.waitFor(() => expect(saveButton()).toBeDisabled());
  });

  it('이미 사용 중인 이름이면 안내하고 저장을 막는다', async () => {
    const user = userEvent.setup();
    replyToUserRequests({ isNameAvailable: false });
    renderForm();

    await changeName(user, '새이름');
    await user.click(checkButton());

    expect(
      await screen.findByText('이미 사용 중인 이름입니다.'),
    ).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  it('검사한 뒤 이름을 다시 고치면 다시 검사해야 한다', async () => {
    const user = userEvent.setup();
    replyToUserRequests({ isNameAvailable: true });
    renderForm();

    await changeName(user, '새이름');
    await user.click(checkButton());
    await screen.findByText('사용 가능한 이름입니다.');
    await user.type(screen.getByLabelText('이름'), '2');

    expect(
      screen.queryByText('사용 가능한 이름입니다.'),
    ).not.toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });
});

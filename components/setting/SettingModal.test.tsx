import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import IntlTestProvider from '@/test/IntlTestProvider';
import { installRadixDomMocks } from '@/test/domMocks';
import SettingModal from './SettingModal';

// vi.mock은 파일 맨 위로 끌어올려지므로, 안에서 쓸 가짜 함수도 vi.hoisted로 먼저 만듭니다.
const { replace, setTheme } = vi.hoisted(() => ({
  replace: vi.fn(),
  setTheme: vi.fn(),
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/posts/edit',
}));
vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light', setTheme }),
}));

const renderSettingModal = (isOpen = true) => {
  const onOpenChange = vi.fn();
  render(
    <IntlTestProvider>
      <SettingModal isOpen={isOpen} onOpenChange={onOpenChange} />
    </IntlTestProvider>,
  );
  return { onOpenChange };
};

// Radix 모달은 열릴 때 바깥에 pointer-events: none을 걸어서, jsdom에서는 클릭 검사를 끕니다.
const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 });

const chooseLanguage = async (
  user: ReturnType<typeof setupUser>,
  name: string,
) => {
  await user.click(screen.getByRole('combobox', { name: '언어' }));
  await user.click(await screen.findByRole('option', { name }));
};

beforeEach(() => {
  installRadixDomMocks();
  window.history.replaceState(null, '', '/ko/posts/edit?postId=3');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('SettingModal', () => {
  it('열려 있으면 현재 언어와 테마를 선택해 둔 채로 보여 준다', () => {
    renderSettingModal();

    expect(screen.getByRole('dialog', { name: '설정' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '언어' })).toHaveTextContent(
      '한국어',
    );
    expect(
      screen.getByRole('radiogroup', { name: '다크모드' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '라이트 모드' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '다크 모드' })).not.toBeChecked();
  });

  it('닫혀 있으면 아무것도 그리지 않는다', () => {
    renderSettingModal(false);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('확인을 누르기 전에는 고른 값을 적용하지 않는다', async () => {
    const user = setupUser();
    renderSettingModal();

    await chooseLanguage(user, 'English');
    await user.click(screen.getByRole('radio', { name: '다크 모드' }));

    expect(screen.getByRole('combobox', { name: '언어' })).toHaveTextContent(
      'English',
    );
    expect(replace).not.toHaveBeenCalled();
    expect(setTheme).not.toHaveBeenCalled();
  });

  it('확인을 누르면 고른 언어와 테마를 적용하고 닫는다', async () => {
    const user = setupUser();
    const { onOpenChange } = renderSettingModal();

    await chooseLanguage(user, 'English');
    await user.click(screen.getByRole('radio', { name: '다크 모드' }));
    await user.click(screen.getByRole('button', { name: '확인' }));

    expect(setTheme).toHaveBeenCalledWith('dark');
    expect(replace).toHaveBeenCalledWith('/posts/edit?postId=3', {
      locale: 'en',
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('아무것도 바꾸지 않고 확인을 누르면 닫기만 한다', async () => {
    const user = setupUser();
    const { onOpenChange } = renderSettingModal();

    await user.click(screen.getByRole('button', { name: '확인' }));

    expect(setTheme).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('취소를 누르면 고른 값을 버리고 닫는다', async () => {
    const user = setupUser();
    const { onOpenChange } = renderSettingModal();

    await user.click(screen.getByRole('radio', { name: '다크 모드' }));
    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(setTheme).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

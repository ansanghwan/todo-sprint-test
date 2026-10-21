'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useId, useState } from 'react';

import LanguageSelect, {
  type AppLocale,
} from '@/components/setting/LanguageSelect';
import ThemeToggle, { type ThemeMode } from '@/components/setting/ThemeToggle';
import Button from '@/components/ui/button/Button';
import { usePathname, useRouter } from '@/i18n/navigation';

interface SettingFormProps {
  onClose: () => void;
}

/** 확인을 누르기 전까지는 고른 값을 임시로만 들고 있다가, 확인을 누르면 한 번에 적용합니다. */
export default function SettingForm({ onClose }: SettingFormProps) {
  const t = useTranslations('Setting');
  const currentLocale = useLocale() as AppLocale;
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const languageLabelId = useId();
  const themeLabelId = useId();

  // "시스템 설정"을 따르고 있으면 지금 실제로 보이는 테마를 처음 선택값으로 씁니다.
  const [initialTheme] = useState<ThemeMode>(
    resolvedTheme === 'dark' ? 'dark' : 'light',
  );
  const [locale, setLocale] = useState(currentLocale);
  const [theme, setThemeDraft] = useState(initialTheme);

  const handleConfirm = () => {
    // 테마를 건드리지 않았으면 "시스템 설정" 상태를 그대로 둡니다.
    if (theme !== initialTheme) setTheme(theme);
    if (locale !== currentLocale) {
      // ?postId= 같은 검색 조건은 누른 순간의 주소에서 읽어 그대로 유지합니다.
      router.replace(`${pathname}${window.location.search}`, { locale });
    }
    onClose();
  };

  return (
    <div className="mt-6 flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <section className="flex flex-col gap-2">
          <h3
            id={languageLabelId}
            className="text-sm/5 font-semibold text-heading"
          >
            {t('language')}
          </h3>
          <LanguageSelect
            labelId={languageLabelId}
            value={locale}
            onValueChange={setLocale}
          />
        </section>
        <section className="flex flex-col gap-2">
          <h3
            id={themeLabelId}
            className="text-sm/5 font-semibold text-heading"
          >
            {t('darkMode')}
          </h3>
          <ThemeToggle
            labelId={themeLabelId}
            value={theme}
            onValueChange={setThemeDraft}
          />
        </section>
      </div>

      <div className="flex gap-2 md:gap-3">
        <Button
          variant="neutral"
          size="lg"
          className="h-10 flex-1 text-sm"
          onClick={onClose}
        >
          {t('cancel')}
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="h-10 flex-1 text-sm"
          onClick={handleConfirm}
        >
          {t('confirm')}
        </Button>
      </div>
    </div>
  );
}

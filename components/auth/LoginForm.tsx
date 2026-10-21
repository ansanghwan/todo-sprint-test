'use client';

import { useTranslations } from 'next-intl';

import Button from '@/components/ui/button/Button';
import { toast } from '@/components/ui/toast/Toaster';
import useLoginForm from '@/hooks/auth/useLoginForm';
import AuthTextField from './AuthTextField';

/** 로그인 폼. 시안에 보이는 라벨이 없어 aria-label로 이름을 줍니다. */
const LoginForm = () => {
  const t = useTranslations('Auth');
  const { formProps, fields, errors, isLoggingIn } = useLoginForm({
    onLoginFailed: () => toast.error(t('loginFailed')),
  });

  return (
    <form noValidate {...formProps} className="flex flex-col gap-6 md:gap-8">
      <div className="flex flex-col gap-1">
        <AuthTextField
          {...fields.email}
          type="email"
          inputMode="email"
          autoComplete="username"
          aria-label={t('emailLabel')}
          placeholder={t('emailPlaceholder')}
          error={errors.email}
        />
        <AuthTextField
          {...fields.password}
          type="password"
          autoComplete="current-password"
          aria-label={t('passwordLabel')}
          placeholder={t('passwordPlaceholder')}
          // 인증 실패 문구는 Figma 에러 시안대로 마지막 입력 아래(폼 하단)에 표시합니다.
          error={errors.password ?? errors.credentials}
        />
      </div>
      <Button type="submit" size="lg" disabled={isLoggingIn}>
        {t('loginSubmit')}
      </Button>
    </form>
  );
};

export default LoginForm;

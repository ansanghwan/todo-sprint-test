'use client';

import { useTranslations } from 'next-intl';

import Button from '@/components/ui/button/Button';
import { toast } from '@/components/ui/toast/Toaster';
import useSignupForm from '@/hooks/auth/useSignupForm';
import { NAME_MAX_LENGTH } from '@/lib/auth/authFormSchema';
import AuthTextField from './AuthTextField';

/** 회원가입 폼. passwordConfirm은 화면에서만 씁니다. */
const SignupForm = () => {
  const t = useTranslations('Auth');
  const { formProps, fields, errors, isSigningUp } = useSignupForm({
    onSignupFailed: () => toast.error(t('signupFailed')),
  });

  return (
    <form noValidate {...formProps} className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <AuthTextField
          {...fields.name}
          type="text"
          autoComplete="name"
          maxLength={NAME_MAX_LENGTH}
          label={t('nameLabel')}
          placeholder={t('namePlaceholder')}
          error={errors.name}
        />
        <AuthTextField
          {...fields.email}
          type="email"
          inputMode="email"
          autoComplete="email"
          label={t('emailLabel')}
          placeholder={t('emailPlaceholder')}
          error={errors.email}
        />
        <AuthTextField
          {...fields.password}
          type="password"
          autoComplete="new-password"
          label={t('passwordLabel')}
          placeholder={t('passwordPlaceholder')}
          error={errors.password}
        />
        <AuthTextField
          {...fields.passwordConfirm}
          type="password"
          autoComplete="new-password"
          label={t('passwordConfirmLabel')}
          placeholder={t('passwordConfirmPlaceholder')}
          error={errors.passwordConfirm}
          showPasswordLabel={t('showPasswordConfirm')}
          hidePasswordLabel={t('hidePasswordConfirm')}
        />
      </div>
      <Button type="submit" size="lg" disabled={isSigningUp}>
        {t('signupSubmit')}
      </Button>
    </form>
  );
};

export default SignupForm;

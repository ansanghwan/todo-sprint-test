'use client';

import { useTranslations } from 'next-intl';

import Button from '@/components/ui/button/Button';
import TextField from '@/components/ui/textfield/TextField';
import usePasswordForm from '@/hooks/user/usePasswordForm';

const PasswordForm = () => {
  const t = useTranslations('MyInfo');
  const { formProps, fields, errors, isChanging } = usePasswordForm();

  return (
    <form noValidate {...formProps} className="flex flex-col gap-8 md:gap-12">
      <div className="flex flex-col gap-2">
        <h3 className="px-1 text-sm/5 font-semibold text-foreground md:text-base/6">
          {t('passwordTitle')}
        </h3>
        {/* 에러 문구가 나타나도 아래가 밀리지 않게 한 줄 자리를 미리 둡니다: 입력 58 + 간격 6 + 문구 20 = 84px */}
        <div className="flex flex-col">
          <div className="min-h-21">
            <TextField
              {...fields.currentPassword}
              type="password"
              autoComplete="current-password"
              aria-label={t('currentPassword')}
              placeholder={t('currentPassword')}
              error={errors.currentPassword}
            />
          </div>
          <div className="min-h-21">
            <TextField
              {...fields.newPassword}
              type="password"
              autoComplete="new-password"
              aria-label={t('newPassword')}
              placeholder={t('newPassword')}
              error={errors.newPassword}
            />
          </div>
          <div className="min-h-21">
            <TextField
              {...fields.newPasswordConfirm}
              type="password"
              autoComplete="new-password"
              aria-label={t('newPasswordConfirm')}
              placeholder={t('newPasswordConfirm')}
              error={errors.newPasswordConfirm}
            />
          </div>
        </div>
      </div>
      <Button type="submit" size="lg" disabled={isChanging}>
        {t('changePassword')}
      </Button>
    </form>
  );
};

export default PasswordForm;

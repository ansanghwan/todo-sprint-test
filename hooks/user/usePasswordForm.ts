import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { toast } from '@/components/ui/toast/Toaster';
import useValidateOnIdle from '@/hooks/auth/useValidateOnIdle';
import {
  passwordFormSchema,
  type PasswordFormValues,
} from '@/lib/user/myInfoFormSchema';
import useChangePassword from './useChangePassword';

const usePasswordForm = () => {
  const t = useTranslations('MyInfo');
  const { changePassword, isChanging } = useChangePassword();
  const [wrongPassword, setWrongPassword] = useState<string>();
  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setError,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    // 서버가 틀렸다고 알려준 현재 비밀번호는 값을 바꾸기 전까지 검증에서 계속 실패시킵니다.
    resolver: zodResolver(
      passwordFormSchema.refine(
        ({ currentPassword }) => currentPassword !== wrongPassword,
        { path: ['currentPassword'], error: 'currentPasswordWrong' },
      ),
    ),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      newPasswordConfirm: '',
    },
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  // 새 비밀번호를 고치면 이미 입력해 둔 확인 값의 일치 여부도 다시 검사합니다.
  const validateField = (name: keyof PasswordFormValues) =>
    trigger(
      name === 'newPassword' && getValues('newPasswordConfirm')
        ? ['newPassword', 'newPasswordConfirm']
        : name,
    );
  const idleValidation = useValidateOnIdle(validateField);

  const submit = ({ currentPassword, newPassword }: PasswordFormValues) => {
    changePassword(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          reset();
          toast.success(t('saved'));
        },
        onFailure: (reason) => {
          if (reason === 'wrongCurrentPassword') {
            setWrongPassword(currentPassword);
            setError('currentPassword', { message: 'currentPasswordWrong' });
            return;
          }
          toast.error(t('passwordChangeFailed'));
        },
      },
    );
  };

  const errorText = (key?: string) => (key ? t(`errors.${key}`) : undefined);

  return {
    formProps: { onSubmit: handleSubmit(submit), ...idleValidation },
    fields: {
      currentPassword: register('currentPassword'),
      newPassword: register('newPassword', {
        onBlur: () => validateField('newPassword'),
      }),
      newPasswordConfirm: register('newPasswordConfirm'),
    },
    errors: {
      currentPassword: errorText(errors.currentPassword?.message),
      newPassword: errorText(errors.newPassword?.message),
      newPasswordConfirm: errorText(errors.newPasswordConfirm?.message),
    },
    isChanging,
  };
};

export default usePasswordForm;

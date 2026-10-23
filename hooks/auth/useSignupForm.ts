import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { useRouter } from '@/i18n/navigation';
import {
  signupFormSchema,
  type SignupFormValues,
} from '@/lib/auth/authFormSchema';
import useSignup from './useSignup';
import useValidateOnIdle from './useValidateOnIdle';

interface SignupFormEvents {
  /** 이메일 중복(409) 밖의 이유로 가입하지 못했을 때 */
  onSignupFailed: () => void;
}

const useSignupForm = ({ onSignupFailed }: SignupFormEvents) => {
  const t = useTranslations('Auth');
  const router = useRouter();
  const { signup, isSigningUp } = useSignup();
  const [takenEmail, setTakenEmail] = useState<string>();
  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setError,
    formState: { errors },
  } = useForm<SignupFormValues>({
    // 서버가 중복이라고 알려준 이메일은 값을 바꾸기 전까지 검증에서 계속 실패시킵니다.
    resolver: zodResolver(
      signupFormSchema.refine(({ email }) => email !== takenEmail, {
        path: ['email'],
        error: 'emailTaken',
      }),
    ),
    defaultValues: { name: '', email: '', password: '', passwordConfirm: '' },
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  // 비밀번호를 고치면 이미 입력해 둔 비밀번호 확인의 일치 여부도 다시 검사합니다.
  const validateField = (name: keyof SignupFormValues) =>
    trigger(
      name === 'password' && getValues('passwordConfirm')
        ? ['password', 'passwordConfirm']
        : name,
    );
  const idleValidation = useValidateOnIdle(validateField);

  const submit = ({ name, email, password }: SignupFormValues) => {
    signup(
      { name, email, password },
      {
        onSuccess: () => router.replace('/dashboard'),
        onFailure: (reason) => {
          if (reason === 'emailTaken') {
            setTakenEmail(email);
            setError('email', { message: 'emailTaken' });
            return;
          }
          onSignupFailed();
        },
      },
    );
  };

  const errorText = (key?: string) => (key ? t(`errors.${key}`) : undefined);

  return {
    formProps: { onSubmit: handleSubmit(submit), ...idleValidation },
    fields: {
      name: register('name'),
      email: register('email'),
      password: register('password', {
        onBlur: () => validateField('password'),
      }),
      passwordConfirm: register('passwordConfirm'),
    },
    errors: {
      name: errorText(errors.name?.message),
      email: errorText(errors.email?.message),
      password: errorText(errors.password?.message),
      passwordConfirm: errorText(errors.passwordConfirm?.message),
    },
    isSigningUp,
  };
};

export default useSignupForm;

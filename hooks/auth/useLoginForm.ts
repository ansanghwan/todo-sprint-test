import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';
import { useForm } from 'react-hook-form';

import { useRouter } from '@/i18n/navigation';
import {
  loginFormSchema,
  type LoginFormValues,
} from '@/lib/auth/authFormSchema';
import useLogin from './useLogin';
import useValidateOnIdle from './useValidateOnIdle';

interface LoginFormEvents {
  /** 인증 실패(401) 밖의 이유로 로그인하지 못했을 때 */
  onLoginFailed: () => void;
}

const useLoginForm = ({ onLoginFailed }: LoginFormEvents) => {
  const t = useTranslations('Auth');
  const router = useRouter();
  const { login, isLoggingIn } = useLogin();
  const {
    register,
    handleSubmit,
    trigger,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });
  const idleValidation = useValidateOnIdle((name: keyof LoginFormValues) =>
    trigger(name),
  );

  const submit = (values: LoginFormValues) => {
    login(values, {
      onSuccess: () => router.replace('/dashboard'),
      onFailure: (reason) => {
        if (reason === 'invalidCredentials') {
          setError('root', { message: 'invalidCredentials' });
          return;
        }
        onLoginFailed();
      },
    });
  };

  const handleChange = (event: FormEvent<HTMLFormElement>) => {
    // 입력을 고치기 시작하면 직전 인증 실패 안내는 더 이상 맞지 않습니다.
    clearErrors('root');
    idleValidation.onChange(event);
  };

  const errorText = (key?: string) => (key ? t(`errors.${key}`) : undefined);

  return {
    formProps: {
      onSubmit: handleSubmit(submit),
      onChange: handleChange,
      onBlur: idleValidation.onBlur,
    },
    fields: { email: register('email'), password: register('password') },
    errors: {
      email: errorText(errors.email?.message),
      password: errorText(errors.password?.message),
      credentials: errorText(errors.root?.message),
    },
    isLoggingIn,
  };
};

export default useLoginForm;

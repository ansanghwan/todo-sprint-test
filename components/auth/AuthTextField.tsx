'use client';

import { useTranslations } from 'next-intl';
import { useId, useState, type ComponentPropsWithRef } from 'react';

import { cn } from '@/lib/utils';
import IcEye from './icons/IcEye';
import IcEyeOff from './icons/IcEyeOff';

export interface AuthTextFieldProps extends ComponentPropsWithRef<'input'> {
  label?: string;
  error?: string;
  /** 비밀번호 보기·숨기기 버튼 이름 (기본 Auth.showPassword · hidePassword) */
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
}

/** 로그인·회원가입 전용 입력 필드. 공용 TextField는 사용하지 않습니다. */
const AuthTextField = ({
  label,
  error,
  showPasswordLabel,
  hidePasswordLabel,
  type = 'text',
  id,
  className,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...rest
}: AuthTextFieldProps) => {
  const t = useTranslations('Auth');
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const isPassword = type === 'password';
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const hasError = Boolean(error);

  const describedBy =
    [ariaDescribedBy, hasError ? errorId : undefined]
      .filter(Boolean)
      .join(' ') || undefined;
  const ToggleIcon = isPasswordVisible ? IcEye : IcEyeOff;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          htmlFor={inputId}
          className="px-1 text-sm/5 font-semibold tracking-[-0.03em] text-grayscale-700 md:text-base/6"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={inputId}
          type={isPassword && isPasswordVisible ? 'text' : type}
          aria-invalid={hasError || ariaInvalid}
          aria-describedby={describedBy}
          {...rest}
          className={cn(
            // 높이 모바일 44 · PC 56 (테두리 포함)
            'w-full rounded-xl border bg-white px-3 py-2.75 text-sm tracking-[-0.03em] text-grayscale-700 outline-none placeholder:text-grayscale-500 md:rounded-2xl md:px-4 md:py-3.75 md:text-base md:tracking-[-0.02em]',
            // FN-AU-14: 포커스 시 테두리 색이 바뀌는 애니메이션 (오류 상태에서는 테두리 바깥에 붉은 띠)
            'transition-[border-color,box-shadow] duration-200 motion-reduce:transition-none',
            hasError
              ? 'border-danger focus:ring-2 focus:ring-danger/25'
              : 'border-grayscale-300 focus:border-orange-500',
            isPassword && 'pr-10 md:pr-12',
            className,
          )}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setIsPasswordVisible((prev) => !prev)}
            aria-label={
              isPasswordVisible
                ? (hidePasswordLabel ?? t('hidePassword'))
                : (showPasswordLabel ?? t('showPassword'))
            }
            aria-controls={inputId}
            className="absolute top-1/2 right-3 flex -translate-y-1/2 cursor-pointer items-center rounded-sm text-grayscale-500 hover:text-grayscale-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 md:right-4"
          >
            <ToggleIcon className="size-5 md:size-6" />
          </button>
        )}
      </div>

      {/* 오류 문구가 나타나거나 사라져도 화면이 밀리지 않도록 한 줄 자리를 항상 비워 둡니다. */}
      <div className="min-h-5">
        {error && (
          <p
            key={error}
            id={errorId}
            // FN-AU-13: 오류 메시지가 강조되며 나타나는 애니메이션
            className="px-1 text-sm/5 font-medium tracking-[-0.03em] text-danger transition-[opacity,translate] duration-200 ease-out motion-reduce:transition-none starting:-translate-y-1 starting:opacity-0"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthTextField;

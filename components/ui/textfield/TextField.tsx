import { useId, useState } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

interface TextFieldProps extends React.ComponentProps<'input'> {
  label?: string;
  /** 에러 메시지 문자열 (예: errors.name?.message) */
  error?: string;
  isRequiredIcon?: boolean;
  ref?: React.Ref<HTMLInputElement>; // ref를 일반 prop으로 추가
}

const textfieldVariants = cva(
  `w-full rounded-2xl border bg-input p-4 text-[1rem] text-foreground transition-colors outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-grayscale-800`,
  {
    variants: {
      isError: {
        true: 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100',
        false:
          'border-input-border focus:border-blue-500 focus:ring-2 focus:ring-blue-100',
      },
      isPassword: {
        true: 'pr-10',
        false: 'pr-0',
      },
    },
    defaultVariants: {
      isError: false,
    },
  },
);

export default function TextField({
  label,
  error,
  isRequiredIcon = false,
  type = 'text',
  className,
  id,
  ref,
  ...rest
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const isPassword = type === 'password';
  const [showPassword, setShowPassword] = useState(false);
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const isError = !!error;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[1rem] font-semibold text-foreground"
        >
          {label}
          {isRequiredIcon && (
            <span className="ml-0.5 align-middle text-lg text-red-500">*</span>
          )}
        </label>
      )}

      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={resolvedType}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...rest}
          className={cn(textfieldVariants({ isError, isPassword }), className)}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            tabIndex={-1}
            className="absolute top-1/2 right-4 flex -translate-y-1/2 cursor-pointer items-center text-gray-400 hover:text-gray-600"
          >
            <span className="material-symbols-outlined text-[18px]">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const toastVariants = cva(
  'flex min-h-10 w-full items-center gap-1 rounded-[1.75rem] px-4 py-2 text-sm/5 font-semibold tracking-[-0.03em]',
  {
    variants: {
      variant: {
        success: 'bg-orange-100 text-orange-600',
        error: 'bg-[#FFF0F0] text-danger',
      },
    },
    defaultVariants: { variant: 'success' },
  },
);

// Google Material Symbols (Rounded) 아이콘 이름
const defaultIcons = { success: 'check', error: 'error' } as const;

export type ToastVariant = keyof typeof defaultIcons;

export type ToastProps = ComponentPropsWithRef<'div'> &
  VariantProps<typeof toastVariants> & {
    /** 기본 아이콘을 대체합니다. null을 넘기면 아이콘을 숨깁니다. */
    icon?: ReactNode;
    /** 메시지 뒤에 "ㆍ" 구분자와 함께 붙는 부가 정보 (예: "1초전") */
    meta?: ReactNode;
    /** 넘기면 오른쪽 끝에 닫기 버튼을 표시합니다. */
    onClose?: () => void;
  };

export default function Toast({
  variant,
  icon,
  meta,
  onClose,
  className,
  children,
  ...props
}: ToastProps) {
  const resolvedIcon =
    icon === undefined ? (
      <span
        aria-hidden
        className="material-symbols-rounded shrink-0 text-2xl leading-none"
      >
        {defaultIcons[variant ?? 'success']}
      </span>
    ) : (
      icon
    );

  return (
    <div className={cn(toastVariants({ variant }), className)} {...props}>
      {resolvedIcon}
      <p className="flex min-w-0 flex-wrap items-center gap-1">
        {children}
        {meta != null && (
          <>
            <span aria-hidden className="text-xs/4 font-medium">
              ㆍ
            </span>
            {meta}
          </>
        )}
      </p>
      {onClose && (
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="ml-auto inline-flex size-6 shrink-0 items-center justify-center rounded-full hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-current"
        >
          <span
            aria-hidden
            className="material-symbols-rounded text-xl leading-none"
          >
            close
          </span>
        </button>
      )}
    </div>
  );
}

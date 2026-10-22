import type { ComponentPropsWithRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full border border-solid leading-none font-semibold tracking-[-0.03em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-not-allowed motion-reduce:transition-none',
  {
    variants: {
      variant: {
        primary:
          'border-transparent bg-orange-500 text-white enabled:hover:bg-orange-600 disabled:bg-[#bbb]',
        outline:
          'border-orange-500 bg-transparent text-orange-600 enabled:hover:border-orange-600 disabled:border-[#bbb] disabled:text-[#bbb] dark:enabled:border-orange-400 dark:enabled:text-orange-300 dark:enabled:hover:border-orange-300 dark:enabled:hover:text-orange-200',
        neutral:
          'border-[#ccc] bg-transparent text-muted enabled:hover:border-[#bbb] enabled:hover:text-grayscale-600 disabled:border-[#ccc] disabled:text-[#bbb]',
      },
      size: {
        // 아래 px 수치는 루트 글자 크기 16px 기준입니다.
        // PC / Mobile 동일
        sm: 'h-10 px-4 text-sm',

        // Mobile: 40px / 14px
        // PC: 48px / 16px
        md: 'h-10 px-6 text-sm md:h-12 md:text-base',

        // Mobile: 48px / 16px
        // PC: 56px / 18px
        lg: 'h-12 px-8 text-base md:h-14 md:text-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonProps = ComponentPropsWithRef<'button'> &
  VariantProps<typeof buttonVariants>;

export default function Button({
  variant,
  size,
  className,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  );
}

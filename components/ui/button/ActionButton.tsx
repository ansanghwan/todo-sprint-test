import type { ComponentPropsWithRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import ButtonIcon from './ButtonIcon';

const styles = cva(
  'inline-flex h-12 w-full shrink-0 flex-row items-center justify-center gap-1 rounded-full border border-solid text-base/normal font-semibold tracking-[-0.03em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-not-allowed motion-reduce:transition-none md:size-35 md:flex-col md:gap-3 md:rounded-4xl md:text-lg/normal',
  {
    variants: {
      variant: {
        goal: 'border-transparent bg-orange-500 text-white enabled:hover:bg-orange-600',
        task: 'border-orange-500 text-orange-500 enabled:hover:border-orange-500 enabled:hover:text-orange-600 lg:border-orange-300',
      },
    },
  },
);

type ActionButtonProps = ComponentPropsWithRef<'button'> & {
  variant: 'goal' | 'task';
};

export default function ActionButton({
  variant,
  children,
  type = 'button',
  className,
  ...props
}: ActionButtonProps) {
  return (
    <button
      type={type}
      className={cn(styles({ variant }), className)}
      {...props}
    >
      <span
        className="flex size-5 shrink-0 items-center justify-center md:size-10"
        aria-hidden="true"
      >
        <ButtonIcon
          name={variant === 'goal' ? 'flag' : 'task'}
          className={
            variant === 'goal' ? 'size-5 md:size-10' : 'size-5 md:size-8'
          }
        />
      </span>
      <span>
        {children ?? (variant === 'goal' ? '새 프로젝트' : '새 할일')}
      </span>
    </button>
  );
}

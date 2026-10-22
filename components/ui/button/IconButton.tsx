import type { ComponentPropsWithRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import ButtonIcon from './ButtonIcon';

const styles = cva(
  'relative inline-flex shrink-0 items-center justify-center rounded-full border border-solid bg-white-section focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-not-allowed',
  {
    variants: {
      icon: {
        'chevron-up': 'size-6 border-[#dadada] text-grayscale-400',
        'chevron-down': 'size-6 border-[#dadada] text-grayscale-400',
        bell: 'size-16 border-[#ccc] text-grayscale-500',
        close: 'size-6 border-[#ccc] text-grayscale-400',
      },
    },
  },
);

type IconButtonProps = Omit<ComponentPropsWithRef<'button'>, 'children'> & {
  'aria-label': string;
  /** 알림이 있을 때 사용할 접근성 문구. 생략하면 기존 기본 문구를 사용합니다. */
  notificationLabel?: string;
} & (
    | { icon: 'bell'; hasNotification?: boolean; size?: never }
    | { icon: 'close'; size?: 'sm' | 'md'; hasNotification?: never }
    | {
        icon: 'chevron-up' | 'chevron-down';
        size?: never;
        hasNotification?: never;
      }
  );

export default function IconButton({
  icon,
  size = 'md',
  hasNotification = false,
  type = 'button',
  className,
  'aria-label': label,
  notificationLabel,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={
        hasNotification
          ? (notificationLabel ?? `${label} (새 알림 있음)`)
          : label
      }
      className={cn(
        styles({ icon }),
        icon === 'close' && size === 'sm' && 'size-3.25',
        className,
      )}
      {...props}
    >
      <ButtonIcon
        name={icon}
        className={
          icon === 'bell'
            ? 'h-5.5 w-5'
            : icon === 'close'
              ? size === 'sm'
                ? 'size-2.75'
                : 'size-4.5'
              : 'h-2 w-3.5'
        }
      />
      {hasNotification && (
        <span
          data-notification-dot=""
          aria-hidden="true"
          className="absolute top-0.5 right-1 size-3 rounded-full bg-orange-500"
        />
      )}
    </button>
  );
}

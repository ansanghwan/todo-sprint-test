import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '@/lib/utils';

// api로 받아오는 done:boolean 값 false:'TO DO' 또는 true:'DONE'에 따라 상태가 바뀝니다.
const chipVariants = cva(
  'flex h-[1.4rem] w-12 flex-row flex-nowrap items-center justify-center gap-2 rounded-md px-0.75 py-0.5',
  {
    variants: {
      isTodo: {
        false: 'bg-primary-200 text-primary-600',
        true: 'bg-[#BBBBBB] text-white',
      },
    },

    defaultVariants: { isTodo: false },
  },
);

export type TODOChipProps = ComponentPropsWithRef<'span'> &
  VariantProps<typeof chipVariants>;

export default function TodoStatusChip({ isTodo, className }: TODOChipProps) {
  return (
    <span className={cn(chipVariants({ isTodo }), className)}>
      <span className={'text-xs/4'}>{isTodo ? 'DONE' : 'TO DO'}</span>
    </span>
  );
}

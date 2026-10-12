import type { ComponentPropsWithRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const COMMENT_MAX_LENGTH = 500;

const commentInputVariants = cva(
  'w-full min-w-0 border border-input-border bg-input text-foreground transition-colors outline-none placeholder:text-muted focus:border-orange-500 disabled:cursor-not-allowed',
  {
    variants: {
      size: {
        // 모바일 12px 여백/14px, PC 16px 여백/16px
        default: 'rounded-xl p-3 text-sm md:rounded-2xl md:p-4 md:text-base',
        // PC / Mobile 동일: 12px 여백/14px (댓글 수정 입력창)
        sm: 'rounded-xl p-3 text-sm',
      },
    },
    defaultVariants: { size: 'default' },
  },
);

type CommentInputProps = Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'size' | 'maxLength'
> &
  VariantProps<typeof commentInputVariants>;

const CommentInput = ({ size, className, ...props }: CommentInputProps) => (
  <input
    type="text"
    maxLength={COMMENT_MAX_LENGTH}
    className={cn(commentInputVariants({ size }), className)}
    {...props}
  />
);

export default CommentInput;

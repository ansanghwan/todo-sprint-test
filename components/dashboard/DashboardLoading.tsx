import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// 안내 문구의 색상을 관리합니다. 테마 색상을 선택하면 다크모드에도 대응합니다.
const loadingVariants = cva(
  'relative z-10 flex h-full items-center justify-center text-base font-semibold',
  {
    variants: {
      color: {
        white: 'text-white',
        muted: 'text-muted',
        foreground: 'text-foreground',
      },
    },
    defaultVariants: { color: 'white' },
  },
);

// 회전 아이콘의 크기와 테두리 색상을 관리합니다. 위쪽 테두리는 불투명하게 표시합니다.
const spinnerVariants = cva(
  'mx-auto mb-2 block animate-spin rounded-full border-2 motion-reduce:animate-none',
  {
    variants: {
      // 회전 아이콘 크기: sm 20px, md 24px, lg 32px
      size: { sm: 'size-5', md: 'size-6', lg: 'size-8' },
      // white는 색상 카드용, muted·foreground는 라이트/다크 테마에 대응합니다.
      color: {
        white: 'border-white/30 border-t-white',
        muted: 'border-muted/30 border-t-muted',
        foreground: 'border-foreground/30 border-t-foreground',
      },
    },
    defaultVariants: { size: 'md', color: 'white' },
  },
);

// cva에 선언한 옵션에서 타입을 가져와 스타일과 허용값이 어긋나지 않게 합니다.
type DashboardLoadingProps = VariantProps<typeof spinnerVariants> & {
  /** 조회하는 내용에 맞는 로딩 안내 문구입니다. */
  message: string;
  className?: string;
};

/** 대시보드 카드에서 사용하는 로딩 표시와 안내 메시지입니다. */
export default function DashboardLoading({
  message,
  size,
  color,
  className,
}: DashboardLoadingProps) {
  return (
    <div role="status" className={cn(loadingVariants({ color }), className)}>
      <p className="text-center">
        <span aria-hidden="true" className={spinnerVariants({ size, color })} />
        <span className="block">{message}</span>
      </p>
    </div>
  );
}

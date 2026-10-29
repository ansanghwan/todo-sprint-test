'use client';

import {
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  useRef,
} from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const searchInputVariants = cva(
  'w-full rounded-full border border-solid border-input-border bg-input placeholder:text-muted focus-visible:border-grayscale-500 focus-visible:outline-none',
  {
    variants: {
      size: {
        sm: 'h-10 py-2.5 pr-12 pl-4 text-sm font-medium placeholder:text-sm placeholder:font-medium',
        default:
          'h-12 py-3 pr-13 pl-5 text-base font-normal placeholder:text-base placeholder:font-normal',
      },
    },
    defaultVariants: { size: 'default' },
  },
);

const searchButtonVariants = cva(
  'absolute top-1/2 flex size-8 -translate-y-1/2 items-center justify-end text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:cursor-default',
  {
    variants: {
      size: {
        sm: 'right-4',
        default: 'right-5',
      },
    },
    defaultVariants: { size: 'default' },
  },
);

export type SearchInputSize = NonNullable<
  VariantProps<typeof searchInputVariants>['size']
>;

export type SearchInputProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'className' | 'size' | 'type'
> & {
  /** default는 48px/16px, sm은 40px/14px입니다. */
  size?: SearchInputSize;
  /** 최상위 영역의 너비·배치를 페이지별로 지정합니다. 기본값은 w-full입니다. */
  className?: string;
  /** 입력 요소에만 추가할 클래스입니다. */
  inputClassName?: string;
  /** 돋보기 클릭 또는 Enter 입력 시 현재 검색어를 전달합니다. API 호출은 사용하는 페이지가 담당합니다. */
  onSearch?: (query: string) => void;
};

export default function SearchInput({
  size = 'default',
  className,
  inputClassName,
  onSearch,
  onKeyDown,
  ...inputProps
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const search = () => {
    onSearch?.(inputRef.current?.value ?? '');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.key !== 'Enter' || !onSearch) return;

    event.preventDefault();
    search();
  };

  return (
    <div className={cn('relative w-full', className)}>
      <input
        ref={inputRef}
        type="search"
        onKeyDown={handleKeyDown}
        {...inputProps}
        className={cn(searchInputVariants({ size }), inputClassName)}
      />
      <button
        type="button"
        aria-label="검색"
        disabled={!onSearch}
        onClick={search}
        className={searchButtonVariants({ size })}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M15.8337 9.58329C15.8337 6.13151 13.0354 3.33329 9.58366 3.33329C6.13188 3.33329 3.33366 6.13151 3.33366 9.58329C3.33366 13.0351 6.13188 15.8333 9.58366 15.8333C11.2669 15.8333 12.7934 15.1666 13.9172 14.0844C13.9407 14.0531 13.966 14.0226 13.9945 13.9941C14.0229 13.9656 14.0535 13.9403 14.0848 13.9168C15.1669 12.7931 15.8337 11.2665 15.8337 9.58329ZM17.5003 9.58329C17.5003 11.4692 16.8393 13.1998 15.7384 14.5597L18.0895 16.9108C18.4149 17.2362 18.415 17.7637 18.0895 18.0892C17.7641 18.4146 17.2366 18.4146 16.9111 18.0892L14.5601 15.7381C13.2002 16.839 11.4696 17.5 9.58366 17.5C5.2114 17.5 1.66699 13.9555 1.66699 9.58329C1.66699 5.21104 5.2114 1.66663 9.58366 1.66663C13.9559 1.66663 17.5003 5.21104 17.5003 9.58329Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
}

import { cn } from '@/lib/utils';

const placeholder = 'bg-grayscale-200 dark:bg-grayscale-800';
const barAnimation = 'origin-left motion-safe:animate-skeleton-bar';
const card = 'border border-subtle bg-white-section';
const rowWidths = ['w-3/5', 'w-4/5', 'w-2/3', 'w-1/2', 'w-3/5'];

/** 양쪽 목록에 같은 5개 행과 아이콘 개수를 표시합니다. 실제 데이터 개수와는 무관합니다. */
export function GoalTodoSkeletonRows() {
  return (
    <div aria-hidden="true" className="space-y-2 motion-safe:animate-pulse">
      {rowWidths.map((width, index) => (
        <div
          key={index}
          className="flex h-12 items-center gap-3 rounded-lg px-2 md:h-14"
        >
          <span className={cn('size-5 shrink-0 rounded-md', placeholder)} />
          <div className="min-w-0 flex-1">
            <span
              style={{ animationDelay: `${index * -0.25}s` }}
              className={cn(
                'block h-3 rounded-sm md:h-4',
                width,
                placeholder,
                barAnimation,
              )}
            />
          </div>
          <div className="flex shrink-0 gap-2">
            {Array.from({ length: 3 }, (_, icon) => (
              <span
                key={icon}
                className={cn('size-4 rounded-sm md:size-5', placeholder)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** 실제 목표 상세와 같은 분기를 사용해 사이드바와 기기 폭에 맞춰 배치합니다. */
export default function GoalDetailSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="lg:mx-auto lg:w-full lg:max-w-328"
    >
      <span className="sr-only">목표 상세를 불러오는 중입니다.</span>
      <div aria-hidden="true">
        <div
          className={cn(
            'mb-7.5 h-7 w-40 rounded-sm motion-safe:animate-pulse max-md:hidden lg:mb-8.5 lg:h-8',
            placeholder,
          )}
        />
        <div className="max-md:space-y-4 md:grid md:gap-6 lg:gap-8 xl:grid-cols-2 lg:max-[93.75rem]:[aside[data-open=false]~main_&]:grid-cols-1">
          <div
            className={cn(
              'flex min-w-0 items-center gap-3 rounded-2xl p-4 md:rounded-3xl md:p-6 lg:gap-4 lg:rounded-[2rem] lg:py-15 lg:pr-12 lg:pl-10',
              card,
            )}
          >
            <div
              className={cn(
                'size-10 shrink-0 rounded-xl motion-safe:animate-pulse',
                placeholder,
              )}
            />
            <div
              className={cn('h-6 w-3/4 rounded-lg', placeholder, barAnimation)}
            />
            <div
              className={cn(
                'ml-auto h-6 w-1.5 shrink-0 rounded-sm motion-safe:animate-pulse',
                placeholder,
              )}
            />
          </div>
          <div className="min-w-0 space-y-4 md:grid md:grid-cols-2 md:gap-5 md:space-y-0">
            <div
              className={cn(
                'flex aspect-[343/160] min-w-0 items-center gap-6 rounded-[1.75rem] px-6 md:aspect-auto md:h-40 md:rounded-[2rem]',
                card,
              )}
            >
              <div className="aspect-square w-[27%] shrink-0 rounded-full border-[1rem] border-grayscale-200 motion-safe:animate-pulse md:size-23 dark:border-grayscale-800" />
              <div className="min-w-0 flex-1 space-y-3 motion-safe:animate-pulse">
                <div
                  className={cn(
                    'h-4 w-3/4 rounded-sm',
                    placeholder,
                    barAnimation,
                  )}
                />
                <div
                  className={cn('h-10 w-full max-w-24 rounded-lg', placeholder)}
                />
              </div>
            </div>
            <div
              className={cn(
                'flex aspect-[343/160] min-w-0 items-center gap-4 rounded-[1.75rem] px-6 md:aspect-auto md:h-40 md:rounded-[2rem]',
                card,
              )}
            >
              <div
                className={cn(
                  'h-6 min-w-0 flex-1 rounded-sm',
                  placeholder,
                  barAnimation,
                )}
              />
              <div
                className={cn(
                  'aspect-square w-[30%] shrink-0 rotate-6 rounded-xl motion-safe:animate-pulse md:size-23',
                  placeholder,
                )}
              />
            </div>
          </div>
        </div>
        <div className="mt-12 space-y-6 md:mt-16 lg:flex lg:gap-8 lg:space-y-0">
          {[0, 1].map((column) => (
            <div key={column} className="min-w-0 flex-1">
              <div className="mb-2.5 flex h-10 items-center gap-2">
                <div
                  className={cn(
                    'h-5 w-16 rounded-sm motion-safe:animate-pulse',
                    placeholder,
                  )}
                />
                {column === 0 && (
                  <>
                    <div
                      className={cn(
                        'ml-auto h-10 w-24 rounded-full motion-safe:animate-pulse',
                        placeholder,
                      )}
                    />
                    <div
                      className={cn(
                        'h-10 w-24 rounded-full motion-safe:animate-pulse',
                        placeholder,
                      )}
                    />
                  </>
                )}
              </div>
              <div className={cn('rounded-2xl p-4 lg:p-6', card)}>
                <GoalTodoSkeletonRows />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

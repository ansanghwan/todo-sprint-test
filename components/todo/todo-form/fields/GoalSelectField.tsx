'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Select } from 'radix-ui';
import { useId, useState } from 'react';

import useTodoFormErrorMessage from '@/hooks/todo/useTodoFormErrorMessage';
import { cn } from '@/lib/utils';
import { goalQueries } from '@/queries/goal';
import type { GoalDto } from '@/types/api/goal';
import { fieldBoxVariants } from '../fieldStyles';
import type { TodoFormErrorKey } from '../todoFormSchema';
import FieldLayout from './FieldLayout';
import GoalListSentinel from './GoalListSentinel';

/** 목표 선택에 필요한 최소 정보 */
export type GoalOption = Pick<GoalDto, 'id' | 'title'>;

interface GoalSelectFieldProps {
  value: number | null;
  onChange: (goalId: number) => void;
  onBlur?: () => void;
  error?: TodoFormErrorKey;
  /**
   * 모달을 열 때 미리 선택할 목표. 목록 첫 페이지에 없어도 제목을 바로 보여 주려고 제목까지 받습니다.
   * 목록 맨 위에 두고, 나중에 같은 목표가 조회돼도 한 번만 보여 줍니다.
   */
  initialGoal?: GoalOption;
}

const STATUS_ROW_CLASS = 'px-3.5 py-3.5 text-sm/5 text-grayscale-500';

/**
 * 목표 선택 (FN-TD-22). Figma dropdown (4:9068)
 * 목록은 서버 기본 개수(10개)씩 불러오고, 목록 끝이 보이면 다음 페이지를 요청합니다.
 * 열기·닫기, 방향키 이동, Enter 선택, 글자 입력 탐색은 Radix Select가 처리합니다.
 */
const GoalSelectField = ({
  value,
  onChange,
  onBlur,
  error,
  initialGoal,
}: GoalSelectFieldProps) => {
  const t = useTranslations('Todo');
  const getErrorMessage = useTodoFormErrorMessage();
  const triggerId = useId();
  const errorId = `${triggerId}-error`;
  const [isOpen, setIsOpen] = useState(false);
  const {
    data,
    isPending,
    isError,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery(goalQueries.list({}));

  const fetchedGoals: GoalOption[] =
    data?.pages.flatMap((page) => page.goals) ?? [];
  const options = initialGoal
    ? [
        initialGoal,
        ...fetchedGoals.filter((goal) => goal.id !== initialGoal.id),
      ]
    : fetchedGoals;
  const selectedGoal = options.find((goal) => goal.id === value);

  const handleOpenChange = (nextIsOpen: boolean) => {
    setIsOpen(nextIsOpen);
    if (!nextIsOpen) {
      onBlur?.();
      return;
    }
    // 불러오지 못한 상태로 다시 열면 실패한 요청부터 다시 시도합니다.
    if (isFetchNextPageError) {
      void fetchNextPage();
    } else if (isError) {
      void refetch();
    }
  };

  return (
    <FieldLayout
      label={t('goal')}
      htmlFor={triggerId}
      isRequired
      errorId={errorId}
      errorMessage={getErrorMessage(error)}
    >
      <Select.Root
        value={value === null ? '' : String(value)}
        onValueChange={(goalId) => onChange(Number(goalId))}
        onOpenChange={handleOpenChange}
      >
        <Select.Trigger
          id={triggerId}
          aria-required="true"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            fieldBoxVariants({ isError: Boolean(error) }),
            'justify-between text-left data-placeholder:text-grayscale-500',
          )}
        >
          <span className="min-w-0 truncate">
            <Select.Value placeholder={t('form.goalPlaceholder')}>
              {selectedGoal?.title}
            </Select.Value>
          </span>
          <Select.Icon
            aria-hidden="true"
            className="material-symbols-outlined text-[1.5rem] text-grayscale-500"
          >
            keyboard_arrow_down
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            position="popper"
            sideOffset={4}
            className="z-50 max-h-65 w-(--radix-select-trigger-width) overflow-hidden rounded-2xl bg-white shadow-md"
          >
            <Select.Viewport>
              {options.map((goal) => (
                <Select.Item
                  key={goal.id}
                  value={String(goal.id)}
                  className="group cursor-pointer p-1.5 outline-none"
                >
                  <span className="block truncate rounded-xl p-2 text-base/6 font-medium text-grayscale-700 group-data-highlighted:bg-orange-200">
                    <Select.ItemText>{goal.title}</Select.ItemText>
                  </span>
                </Select.Item>
              ))}

              {isPending && (
                <p role="status" className={STATUS_ROW_CLASS}>
                  {t('form.loadingGoals')}
                </p>
              )}
              {(isError || isFetchNextPageError) && (
                <p role="alert" className={STATUS_ROW_CLASS}>
                  {t('form.fetchGoalsError')}
                </p>
              )}
              {!isPending && !isError && options.length === 0 && (
                <p className={STATUS_ROW_CLASS}>{t('form.noGoals')}</p>
              )}

              {isOpen &&
                hasNextPage &&
                !isFetchingNextPage &&
                !isFetchNextPageError && (
                  <GoalListSentinel
                    onIntersect={() => {
                      // 요청 중 상태가 렌더에 반영되기 전에 다시 호출돼도 새 요청을 시작하지 않습니다.
                      void fetchNextPage({ cancelRefetch: false });
                    }}
                  />
                )}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </FieldLayout>
  );
};

export default GoalSelectField;

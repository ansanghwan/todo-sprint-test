'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Select } from 'radix-ui';
import { useState } from 'react';

import GoalListSentinel from '@/components/todo/todo-form/fields/GoalListSentinel';
import { goalQueries } from '@/queries/goal';
import type { FavoriteGoalFilterValue } from './filterFavoriteTodos';

const ALL_VALUE = 'all';
const STATUS_ROW_CLASS = 'px-3.5 py-3.5 text-sm/5 text-muted';
const ITEM_CLASS = 'group cursor-pointer p-1.5 outline-none ';
const ITEM_TEXT_CLASS =
  'block truncate rounded-xl p-2 text-base/6 font-medium text-foreground group-data-highlighted:bg-orange-200 dark:group-data-highlighted:bg-orange-alpha-20';

interface FavoriteGoalFilterProps {
  value: FavoriteGoalFilterValue;
  onChange: (value: FavoriteGoalFilterValue) => void;
}

/**
 * 목표 필터 (FN-FV-04). Figma 4:11199(닫힘), 4:11254(열림)
 * 첫 항목은 전체 목표, 이어서 GET /goals 결과를 10개씩 이어 붙입니다.
 * 열기·닫기와 키보드 이동은 Radix Select가 처리합니다.
 */
const FavoriteGoalFilter = ({ value, onChange }: FavoriteGoalFilterProps) => {
  const t = useTranslations('Todo');
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
  const goals = data?.pages.flatMap((page) => page.goals) ?? [];
  const selectedTitle =
    value === ALL_VALUE
      ? t('allGoals')
      : goals.find((goal) => goal.id === value)?.title;

  const handleOpenChange = (nextIsOpen: boolean) => {
    setIsOpen(nextIsOpen);
    if (!nextIsOpen) {
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
    <Select.Root
      value={String(value)}
      onValueChange={(next) =>
        onChange(next === ALL_VALUE ? ALL_VALUE : Number(next))
      }
      onOpenChange={handleOpenChange}
    >
      <Select.Trigger
        aria-label={t('goalFilter')}
        className="flex h-13 w-full shrink-0 items-center gap-2 rounded-2xl border border-grayscale-100 bg-grayscale-50 px-4 text-left focus-visible:outline-2 focus-visible:outline-orange-600 md:h-auto md:py-3"
      >
        <Image
          src="/icons/img_goal.svg"
          alt=""
          width={32}
          height={32}
          className="size-8 shrink-0"
        />
        <span className="min-w-0 flex-1 truncate text-sm/5 font-semibold text-grayscale-800 md:text-base/6">
          <Select.Value>{selectedTitle}</Select.Value>
        </span>
        <Select.Icon
          aria-hidden="true"
          className="material-symbols-outlined text-[1.5rem] text-muted"
        >
          keyboard_arrow_down
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={4}
          className="z-50 max-h-65 w-(--radix-select-trigger-width) overflow-hidden rounded-2xl bg-white-section shadow-md"
        >
          <Select.Viewport>
            <Select.Item value={ALL_VALUE} className={ITEM_CLASS}>
              <span className={ITEM_TEXT_CLASS}>
                <Select.ItemText>{t('allGoals')}</Select.ItemText>
              </span>
            </Select.Item>
            {goals.map((goal) => (
              <Select.Item
                key={goal.id}
                value={String(goal.id)}
                className={ITEM_CLASS}
              >
                <span className={ITEM_TEXT_CLASS}>
                  <Select.ItemText>{goal.title}</Select.ItemText>
                </span>
              </Select.Item>
            ))}

            {isPending && (
              <p role="status" className={STATUS_ROW_CLASS}>
                {t('loadingGoals')}
              </p>
            )}
            {(isError || isFetchNextPageError) && (
              <p role="alert" className={STATUS_ROW_CLASS}>
                {t('fetchGoalsError')}
              </p>
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
  );
};

export default FavoriteGoalFilter;

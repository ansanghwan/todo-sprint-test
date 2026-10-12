'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { DropdownMenu } from 'radix-ui';

import useAllGoals from '@/hooks/goal/useAllGoals';
import type { GoalDto } from '@/types/api/goal';

export type CalendarGoal = Pick<GoalDto, 'id' | 'title'>;

const ALL_GOALS_VALUE = 'all';
const ITEM_CLASS_NAME = 'group cursor-pointer p-1.25 outline-none md:p-1.5';
const ITEM_LABEL_CLASS_NAME =
  'block truncate rounded-lg px-1.5 py-0.75 text-sm/5 font-medium tracking-[-0.03em] text-foreground group-data-highlighted:bg-orange-alpha-20 md:rounded-xl md:p-2 md:text-base/6';
const STATUS_ROW_CLASS_NAME = 'px-3 py-2 text-sm/5 text-muted';

interface CalendarGoalFilterProps {
  /** null이면 전체 목표 */
  selectedGoal: CalendarGoal | null;
  onSelectGoal: (goal: CalendarGoal | null) => void;
}

const CalendarGoalFilter = ({
  selectedGoal,
  onSelectGoal,
}: CalendarGoalFilterProps) => {
  const t = useTranslations('Todo');
  const { goals, isLoading, isError, retry } = useAllGoals();

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && isError) {
      retry();
    }
  };

  return (
    <DropdownMenu.Root onOpenChange={handleOpenChange}>
      <DropdownMenu.Trigger className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-2xl border border-orange-500 bg-input px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 lg:w-87.5">
        <span className="flex min-w-0 items-center gap-2">
          <Image
            src="/icons/img_goal.svg"
            width={32}
            height={32}
            alt=""
            className="shrink-0"
          />
          <span className="truncate text-sm/5 font-semibold tracking-[-0.03em] text-foreground">
            {selectedGoal?.title ?? t('allGoals')}
          </span>
        </span>
        <span
          aria-hidden
          className="material-symbols-rounded text-2xl leading-none text-subtle"
        >
          keyboard_arrow_down
        </span>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          collisionPadding={16}
          className="z-50 max-h-(--radix-dropdown-menu-content-available-height) w-(--radix-dropdown-menu-trigger-width) overflow-y-auto rounded-xl bg-white-section shadow-[0_0.25rem_0.5rem_rgba(0,0,0,0.1)] md:rounded-2xl"
        >
          <DropdownMenu.RadioGroup
            value={selectedGoal ? String(selectedGoal.id) : ALL_GOALS_VALUE}
          >
            <DropdownMenu.RadioItem
              value={ALL_GOALS_VALUE}
              onSelect={() => onSelectGoal(null)}
              className={ITEM_CLASS_NAME}
            >
              <span className={ITEM_LABEL_CLASS_NAME}>{t('allGoals')}</span>
            </DropdownMenu.RadioItem>
            {goals?.map(({ id, title }) => (
              <DropdownMenu.RadioItem
                key={id}
                value={String(id)}
                onSelect={() => onSelectGoal({ id, title })}
                className={ITEM_CLASS_NAME}
              >
                <span className={ITEM_LABEL_CLASS_NAME}>{title}</span>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>

          {isLoading && (
            <p role="status" className={STATUS_ROW_CLASS_NAME}>
              {t('loadingGoals')}
            </p>
          )}
          {isError && goals === undefined && (
            <p role="alert" className={STATUS_ROW_CLASS_NAME}>
              {t('fetchGoalsError')}
            </p>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default CalendarGoalFilter;

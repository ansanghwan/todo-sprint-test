'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import Button from '@/components/ui/button/Button';
import IcPlus from '@/components/ui/icons/IcPlus';
import useCalendarTodos from '@/hooks/todo/useCalendarTodos';
import {
  addMonths,
  getCalendarDays,
  getMonthKey,
  groupTodosByDueDate,
  type DateKey,
} from '../_lib/calendarDates';
import type { CalendarGoal } from './CalendarGoalFilter';
import CalendarGrid from './CalendarGrid';
import CalendarHeader from './CalendarHeader';
import DayTodosModal from './DayTodosModal';

interface MonthCalendarProps {
  today: DateKey;
  onAddTodo: () => void;
  onOpenTodo: (todoId: number) => void;
}

const MonthCalendar = ({
  today,
  onAddTodo,
  onOpenTodo,
}: MonthCalendarProps) => {
  const t = useTranslations('Todo');
  const [month, setMonth] = useState(() => getMonthKey(today));
  const [selectedDate, setSelectedDate] = useState(today);
  const [openedDate, setOpenedDate] = useState<DateKey | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<CalendarGoal | null>(null);

  const days = getCalendarDays(month);
  const { todos, isLoading, isError, retry } = useCalendarTodos({
    from: days[0],
    to: days[days.length - 1],
    goalId: selectedGoal?.id,
  });
  const todosByDate = groupTodosByDueDate(todos ?? []);

  const handlePreviousMonth = () => setMonth(addMonths(month, -1));
  const handleNextMonth = () => setMonth(addMonths(month, 1));
  const handleSelectDate = (dateKey: DateKey) => {
    setSelectedDate(dateKey);
    if (todosByDate.has(dateKey)) {
      setOpenedDate(dateKey);
    }
  };
  const handleCloseDay = () => setOpenedDate(null);

  return (
    <div className="mx-auto w-full max-w-7xl pb-16 md:pb-0">
      <section className="-mx-4 overflow-hidden bg-white-section shadow-lg md:mx-0 md:rounded-3xl lg:rounded-4xl">
        <CalendarHeader
          month={month}
          selectedGoal={selectedGoal}
          onSelectGoal={setSelectedGoal}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
        />
        {isLoading && (
          <p role="status" className="sr-only">
            {t('loadingTodos')}
          </p>
        )}
        {isError && (
          <div
            role="alert"
            className="flex items-center justify-center gap-4 border-b border-subtle px-4 py-3"
          >
            <p className="text-sm text-muted">{t('fetchTodosError')}</p>
            <Button
              variant="neutral"
              size="sm"
              className="w-auto"
              onClick={retry}
            >
              {t('retry')}
            </Button>
          </div>
        )}
        <CalendarGrid
          days={days}
          month={month}
          today={today}
          selectedDate={selectedDate}
          todosByDate={todosByDate}
          isLoading={isLoading}
          onSelectDate={handleSelectDate}
        />
      </section>

      {openedDate !== null && (
        <DayTodosModal
          dateKey={openedDate}
          todos={todosByDate.get(openedDate) ?? []}
          onClose={handleCloseDay}
          onOpenTodo={onOpenTodo}
        />
      )}

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-subtle bg-white-section px-4 py-3 shadow-lg md:hidden">
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={onAddTodo}
        >
          <IcPlus className="size-5 shrink-0" />
          {t('addTodo')}
        </Button>
      </div>
    </div>
  );
};

export default MonthCalendar;

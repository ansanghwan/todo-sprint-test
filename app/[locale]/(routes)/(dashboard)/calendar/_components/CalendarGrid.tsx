import { useFormatter } from 'next-intl';

import type { TodoDto } from '@/types/api/todo';
import CalendarCell from './CalendarCell';
import { isInMonth, type DateKey, type MonthKey } from '../_lib/calendarDates';

const DAYS_IN_WEEK = 7;

interface CalendarGridProps {
  /** 월요일부터 시작하는 주 단위(4~6주) */
  days: DateKey[];
  month: MonthKey;
  today: DateKey;
  selectedDate: DateKey;
  todosByDate: Map<DateKey, TodoDto[]>;
  isLoading: boolean;
  onSelectDate: (dateKey: DateKey) => void;
}

const CalendarGrid = ({
  days,
  month,
  today,
  selectedDate,
  todosByDate,
  isLoading,
  onSelectDate,
}: CalendarGridProps) => {
  const format = useFormatter();

  return (
    <div
      aria-busy={isLoading}
      className="grid grid-cols-7 transition-opacity aria-busy:opacity-60 motion-reduce:transition-none"
    >
      {days.slice(0, DAYS_IN_WEEK).map((dateKey) => (
        <div
          key={dateKey}
          className="border-r border-b border-subtle p-2 text-center text-xs font-medium text-muted nth-[7n]:border-r-0"
        >
          {format.dateTime(new Date(dateKey), {
            weekday: 'short',
            timeZone: 'UTC',
          })}
        </div>
      ))}
      {days.map((dateKey) => (
        <CalendarCell
          key={dateKey}
          dateKey={dateKey}
          todos={todosByDate.get(dateKey) ?? []}
          isToday={dateKey === today}
          isSelected={dateKey === selectedDate}
          isOutsideMonth={!isInMonth(dateKey, month)}
          onSelect={onSelectDate}
        />
      ))}
    </div>
  );
};

export default CalendarGrid;

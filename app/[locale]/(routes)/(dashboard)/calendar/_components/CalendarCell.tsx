import { useFormatter, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import type { TodoDto } from '@/types/api/todo';
import { getDayOfMonth, type DateKey } from '../_lib/calendarDates';
import CalendarTodoChip from './CalendarTodoChip';

const MAX_VISIBLE_TODOS = 3;

interface DateState {
  isToday: boolean;
  isSelected: boolean;
  isOutsideMonth: boolean;
}

const getDateClassName = ({
  isToday,
  isSelected,
  isOutsideMonth,
}: DateState) => {
  if (isToday) {
    return 'bg-orange-500 text-white';
  }
  if (isSelected) {
    return 'bg-grayscale-100 text-grayscale-600';
  }
  if (isOutsideMonth) {
    return 'text-subtle';
  }
  return 'text-foreground';
};

interface CalendarCellProps extends DateState {
  dateKey: DateKey;
  todos: TodoDto[];
  onSelect: (dateKey: DateKey) => void;
}

const CalendarCell = ({
  dateKey,
  todos,
  isToday,
  isSelected,
  isOutsideMonth,
  onSelect,
}: CalendarCellProps) => {
  const t = useTranslations('Todo');
  const format = useFormatter();
  const date = format.dateTime(new Date(dateKey), {
    dateStyle: 'long',
    timeZone: 'UTC',
  });
  const hasTodos = todos.length > 0;
  const visibleTodos = todos.slice(0, MAX_VISIBLE_TODOS);
  const hiddenCount = todos.length - visibleTodos.length;
  const fadedClassName = isOutsideMonth && 'opacity-60';

  const handleSelect = () => onSelect(dateKey);

  return (
    <div
      className={cn(
        'relative isolate flex min-h-22 flex-col gap-1.5 border-r border-b border-subtle p-1.5 nth-[7n]:border-r-0 md:min-h-38 md:gap-1 md:p-2',
        isOutsideMonth ? 'bg-background' : 'bg-white-section',
      )}
    >
      {/* after로 셀 전체를 클릭 영역으로 넓힙니다. 칩·점은 표시 전용이라 그 아래에 둡니다. */}
      <button
        type="button"
        aria-label={
          hasTodos
            ? t('dateWithTodoCount', { date, count: todos.length })
            : date
        }
        aria-haspopup={hasTodos ? 'dialog' : undefined}
        aria-pressed={isSelected}
        aria-current={isToday ? 'date' : undefined}
        onClick={handleSelect}
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold after:absolute after:inset-0 after:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600',
          getDateClassName({ isToday, isSelected, isOutsideMonth }),
        )}
      >
        {getDayOfMonth(dateKey)}
      </button>

      <div
        aria-hidden
        className={cn('flex gap-1 pl-1 md:hidden', fadedClassName)}
      >
        {visibleTodos.map((todo) => (
          <span
            key={todo.id}
            className={cn(
              'size-2 rounded-full',
              todo.done ? 'bg-grayscale-400' : 'bg-orange-500',
            )}
          />
        ))}
      </div>
      <ul className={cn('hidden flex-col gap-1 md:flex', fadedClassName)}>
        {visibleTodos.map((todo) => (
          <li key={todo.id}>
            <CalendarTodoChip todo={todo} />
          </li>
        ))}
      </ul>

      {hiddenCount > 0 && (
        <span
          className={cn(
            'pl-1 text-xs font-semibold text-subtle md:pl-2',
            fadedClassName,
          )}
        >
          +{hiddenCount}
        </span>
      )}
    </div>
  );
};

export default CalendarCell;

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import type { TodoDto } from '@/types/api/todo';

interface CalendarTodoChipProps {
  todo: Pick<TodoDto, 'title' | 'done'>;
}

const CalendarTodoChip = ({ todo }: CalendarTodoChipProps) => {
  const t = useTranslations('Todo');

  return (
    <div
      className={cn(
        'flex items-center gap-0.5 rounded-md border px-2 py-1 text-xs font-semibold',
        todo.done
          ? 'border-grayscale-300 bg-grayscale-50 text-grayscale-400'
          : 'border-orange-300 bg-orange-100 text-orange-600',
      )}
    >
      {todo.done && (
        <>
          {/* TODO: [2026.10.01] globals.css의 아이콘 폰트 CSS가 레이어 밖이라 text-base를 덮어써서 !로 크기를 지정함. import에 layer(base)가 붙으면 ! 제거하기 */}
          <span
            aria-hidden
            className="material-symbols-rounded shrink-0 text-base! leading-none"
          >
            check
          </span>
          <span className="sr-only">{t('completed')}</span>
        </>
      )}
      <span className="min-w-0 truncate">{todo.title}</span>
    </div>
  );
};

export default CalendarTodoChip;

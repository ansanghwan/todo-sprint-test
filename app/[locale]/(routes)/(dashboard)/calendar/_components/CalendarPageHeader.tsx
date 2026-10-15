import { useTranslations } from 'next-intl';

import Button from '@/components/ui/button/Button';
import IcPlus from '@/components/ui/icons/IcPlus';
import useCurrentUser from '@/hooks/useCurrentUser';

interface CalendarPageHeaderProps {
  onAddTodo: () => void;
}

/** 페이지 제목과 할 일 추가 버튼. 모바일은 제목이 GNB에 있고 추가 버튼이 하단에 고정돼 있어 숨깁니다. */
const CalendarPageHeader = ({ onAddTodo }: CalendarPageHeaderProps) => {
  const t = useTranslations('Todo');
  const { userName } = useCurrentUser();

  return (
    <div className="mb-6 flex items-center justify-between gap-4 px-2 max-md:hidden lg:mb-4">
      <h1 className="truncate text-xl/7.5 font-semibold tracking-[-0.03em] text-heading lg:text-2xl/8">
        {userName ? t('calendarTitle', { name: userName }) : t('calendar')}
      </h1>
      <Button
        variant="outline"
        size="sm"
        className="w-auto min-w-30 gap-1 whitespace-nowrap"
        onClick={onAddTodo}
      >
        <IcPlus className="size-5 shrink-0" />
        {t('addTodo')}
      </Button>
    </div>
  );
};

export default CalendarPageHeader;

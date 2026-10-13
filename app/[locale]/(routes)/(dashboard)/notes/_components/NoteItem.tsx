import type { Note } from '@/types/api/note';
import Image from 'next/image';
import TodoStatusChip from '@/components/todo/TodoStatusChip';
import { formatUtcDateToYmd } from '@/lib/formatter';
import KebabMenu from '@/components/ui/kebab-menu/KebabMenu';
import { useTranslations } from 'next-intl';

interface NoteItemProps {
  noteProps: Note;
  onEdit: () => void;
  onDelete: () => void;
}

export default function NoteItem({
  noteProps,
  onEdit,
  onDelete,
}: NoteItemProps) {
  const t = useTranslations('Todo');
  const { title, updatedAt: date, todo } = noteProps;
  const isTodo = todo?.done;
  const todoTitle = todo?.title;
  return (
    <div
      className={
        'mt-4 box-border flex flex-col overflow-hidden rounded-3xl bg-white px-9.5 pt-7 pb-8'
      }
    >
      <div className={'flex flex-row items-center justify-between'}>
        <div className="mb-4 flex flex-row flex-nowrap items-center">
          <Image
            src="../icons/img_note.svg"
            width={40}
            height={40}
            alt="노트 아이콘"
            className="mr-4"
          />
          <p className={'truncate text-xl font-semibold'}>{title}</p>
        </div>

        <KebabMenu
          ariaLabel={t('moreActions')}
          items={[
            { label: t('edit'), onSelect: onEdit },
            { label: t('delete'), onSelect: onDelete },
          ]}
        />
      </div>

      <div className={'flex flex-row flex-nowrap items-center justify-between'}>
        <div className={'flex flex-row flex-nowrap items-center gap-x-2'}>
          <TodoStatusChip isTodo={isTodo} />
          <p className={'truncate text-sm'}>{todoTitle}</p>
        </div>
        <span className={'text-xs text-grayscale-400'}>
          {formatUtcDateToYmd(date)}
        </span>
      </div>
    </div>
  );
}

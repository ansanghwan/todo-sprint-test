import type { Note } from '@/types/api/note';
import Image from 'next/image';
import TodoStatusChip from '@/components/todo/TodoStatusChip';
import { formatUtcDateToYmd } from '@/lib/formatter';
import KebabMenu from '@/components/ui/kebab-menu/KebabMenu';
import { useTranslations } from 'next-intl';

interface NoteItemProps {
  noteProps: Note;
  /** 노트 상세 열기 (FN-NT-04). 카드 어디를 눌러도 열립니다. */
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function NoteItem({
  noteProps,
  onOpen,
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
        'relative mt-4 box-border flex flex-col overflow-hidden rounded-3xl bg-white-section px-9.5 pt-7 pb-8'
      }
    >
      <div className={'flex flex-row items-center justify-between'}>
        <div className="mb-4 flex flex-row flex-nowrap items-center">
          <Image
            src="../icons/img_note.svg"
            width={40}
            height={40}
            alt="작업 기록 아이콘"
            className="mr-4"
          />
          {/* 버튼의 클릭 영역(after)을 카드 전체로 넓혀 카드를 누르면 상세가 열립니다. */}
          <button
            type="button"
            onClick={onOpen}
            className={
              'truncate text-left text-xl font-semibold after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-orange-600'
            }
          >
            {title}
          </button>
        </div>

        {/* 카드 클릭 영역보다 위에 두어 케밥은 따로 동작합니다. */}
        <div className="relative z-10">
          <KebabMenu
            ariaLabel={t('moreActions')}
            items={[
              { label: t('edit'), onSelect: onEdit },
              { label: t('delete'), onSelect: onDelete },
            ]}
          />
        </div>
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

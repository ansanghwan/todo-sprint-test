'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { getNote } from '@/lib/api/notes';
import { noteKeys } from '@/queries/notes';

interface TodoDetailNoteProps {
  /** 연결된 노트 id (noteIds[0]) */
  noteId: number;
  onOpen: (noteId: number) => void;
}

/**
 * 할 일 상세의 작성된 노트 (FN-TD-43). Figma Task modal의 '작성된 노트' (4:9953)
 * GET /notes/{noteId}로 제목을 보여 주고, 누르면 노트 상세를 엽니다.
 * 제목을 받기 전이나 받지 못했을 때도 눌러서 상세에서 다시 시도할 수 있습니다.
 */
const TodoDetailNote = ({ noteId, onOpen }: TodoDetailNoteProps) => {
  const t = useTranslations('Todo');
  const { data: note } = useQuery({
    queryKey: noteKeys.detail(noteId),
    queryFn: ({ signal }) => getNote(noteId, signal),
  });

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm/5 font-semibold tracking-[-0.03em] text-grayscale-700 md:text-base/6">
        {t('writtenNotes')}
      </h3>
      <button
        type="button"
        onClick={() => onOpen(noteId)}
        className="flex items-center gap-2 rounded-2xl border border-grayscale-200 bg-white p-4 text-left focus-visible:outline-2 focus-visible:outline-orange-600"
      >
        <Image
          src="/icons/img_note.svg"
          alt=""
          width={32}
          height={32}
          className="size-8 shrink-0"
        />
        <span className="min-w-0 flex-1 truncate text-base/6 font-medium text-grayscale-700">
          {note?.title ?? t('viewNote')}
        </span>
        <span
          aria-hidden="true"
          className="material-symbols-outlined text-[1.5rem] text-grayscale-500"
        >
          chevron_right
        </span>
      </button>
    </section>
  );
};

export default TodoDetailNote;

'use client';

import Image from 'next/image';
import NoteItem from '@/components/note/NoteItem';
import { useNotesInfiniteQuery } from '@/queries/notes';
import { useTranslations } from 'next-intl';
import type { GetNotesParams, Note } from '@/types/api/note';
import { useRouter } from '@/i18n/navigation';
import { useState } from 'react';
import DeleteNoteModal from '@/components/note/DeleteNoteModal';

type NoteListProps = Omit<GetNotesParams, 'cursor'>;

export default function NoteList(params: NoteListProps) {
  const t = useTranslations('Todo');
  const router = useRouter();
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);
  const {
    data,
    isPending,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useNotesInfiniteQuery(params);

  if (isPending) {
    return (
      <p className={'py-10 text-center text-grayscale-400'}>불러오는 중…</p>
    );
  }

  if (isError) {
    return (
      <div className={'flex flex-col items-center gap-3 py-10'}>
        <p>노트를 불러오지 못했어요.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className={'rounded-xl bg-white px-4 py-2 text-sm'}
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 페이지별 응답을 하나의 배열로 합칩니다.
  const notes = data.pages.flatMap((page) => page.notes);

  if (notes.length === 0) {
    return (
      <div
        className={
          'flex size-full min-h-[40vh] flex-col items-center justify-center'
        }
      >
        <Image
          src="/images/no_note.svg"
          width={130}
          height={140}
          alt="노트 아이콘"
        />
        <p className={'mt-5'}>
          {params.search ? t('noSearchResults') : t('noNotes')}
        </p>
      </div>
    );
  }

  return (
    <>
      <ul
        className={
          'grid grid-cols-1 gap-2.5 gap-x-5 overflow-x-hidden lg:grid-cols-2'
        }
      >
        {notes.map((note) => (
          <li key={`note-${note.id}`}>
            <NoteItem
              noteProps={note}
              onEdit={() => router.push(`/notes/note/edit/${note.id}`)}
              onDelete={() => setDeletingNote(note)}
            />
          </li>
        ))}
      </ul>
      {hasNextPage && (
        <div className={'mt-6 flex justify-center'}>
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className={'rounded-xl bg-white px-4 py-2 text-sm'}
          >
            {isFetchingNextPage ? '불러오는 중…' : '더 보기'}
          </button>
        </div>
      )}
      <DeleteNoteModal
        note={deletingNote}
        onClose={() => setDeletingNote(null)}
      />
    </>
  );
}

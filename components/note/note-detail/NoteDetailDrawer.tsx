'use client';

import { useQuery } from '@tanstack/react-query';
import type { JSONContent } from '@tiptap/react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Dialog } from 'radix-ui';
import { useEffect } from 'react';

import MetaRow from '@/components/note/MetaRow';
import TodoStatusChip from '@/components/todo/TodoStatusChip';
import Button from '@/components/ui/button/Button';
import ModalHeader from '@/components/ui/ModalHeader';
import { toast } from '@/components/ui/toast/Toaster';
import { getNote } from '@/lib/api/notes';
import { formatUtcDateToYmd } from '@/lib/formatter';
import { noteKeys } from '@/queries/notes';
import NoteContentViewer from './NoteContentViewer';

export interface NoteDetailDrawerProps {
  /** 볼 노트 id. null이면 닫힌 상태입니다. */
  noteId: number | null;
  onClose: () => void;
}

/**
 * 노트 상세 (FN-NT-04·05, FN-TD-11). Figma 노트 상세보기 (4:5841 PC, 4:6143 태블릿, 4:6244 모바일)
 * PC는 오른쪽 Drawer, 태블릿·모바일은 화면 전체를 덮는 바텀시트입니다. 링크 미리보기는 포함하지 않습니다.
 * 열 때마다 GET /notes/{noteId}로 새로 받되, 캐시가 있으면 먼저 보여 줍니다.
 */
const NoteDetailDrawer = ({ noteId, onClose }: NoteDetailDrawerProps) => {
  if (noteId === null) {
    return null;
  }
  return <NoteDetailDialog key={noteId} noteId={noteId} onClose={onClose} />;
};

const NoteDetailDialog = ({
  noteId,
  onClose,
}: {
  noteId: number;
  onClose: () => void;
}) => {
  const t = useTranslations('Todo');
  const {
    data: note,
    isError,
    errorUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: noteKeys.detail(noteId),
    queryFn: ({ signal }) => getNote(noteId, signal),
    // 수정 후에도 앱 QueryClient의 staleTime(60초)과 상관없이 최신 내용을 받습니다.
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (isError) {
      toast.error(t('fetchNoteError'));
    }
  }, [isError, errorUpdatedAt, t]);

  return (
    <Dialog.Root
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex scrollbar-thin flex-col gap-6 overflow-y-auto overscroll-contain bg-white-section px-5 py-6 focus:outline-none md:p-10 lg:left-auto lg:w-200 lg:px-10 lg:py-12"
        >
          <ModalHeader className="items-start gap-2">
            {note ? (
              <span className="flex min-w-0 items-center gap-2 md:gap-3">
                <Image
                  src="/icons/img_note.svg"
                  alt=""
                  width={40}
                  height={40}
                  className="size-8 shrink-0 md:size-10"
                />
                <span className="text-xl/7.5 break-all md:text-2xl/8">
                  {note.title}
                </span>
              </span>
            ) : (
              t('viewNote')
            )}
          </ModalHeader>

          {note && (
            <>
              <dl className="grid grid-cols-1 gap-y-3 text-sm md:grid-cols-2">
                <MetaRow icon="flag_2" label={t('goal')}>
                  <span className="truncate">
                    {note.todo.goal?.title ?? '-'}
                  </span>
                </MetaRow>
                <MetaRow icon="calendar_today" label={t('createdAt')}>
                  {formatUtcDateToYmd(note.createdAt)}
                </MetaRow>
                <MetaRow icon="check_box" label={t('todo')}>
                  <span className="truncate">{note.todo.title}</span>
                  <TodoStatusChip
                    isTodo={note.todo.done}
                    className="ml-1 shrink-0"
                  />
                </MetaRow>
                <MetaRow icon="tag" label={t('tag')}>
                  {note.todo.tags?.map((tag) => tag.name).join(', ') || '-'}
                </MetaRow>
              </dl>

              {Boolean(note.content) && (
                <div className="border-t border-grayscale-200 pt-6">
                  <NoteContentViewer content={note.content as JSONContent} />
                </div>
              )}
            </>
          )}

          {!note && !isError && (
            <p
              role="status"
              className="py-10 text-center text-sm text-grayscale-400"
            >
              {t('loadingNote')}
            </p>
          )}

          {!note && isError && (
            <div className="flex flex-col items-center gap-4 py-10">
              <p className="text-sm text-muted">{t('fetchNoteError')}</p>
              <Button
                variant="neutral"
                size="sm"
                className="w-auto"
                onClick={() => void refetch()}
              >
                {t('retry')}
              </Button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default NoteDetailDrawer;

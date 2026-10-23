import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createNote,
  deleteNote,
  getNote,
  getNotes,
  updateNote,
} from '@/lib/api/notes';
import type { GetNotesParams, UpdateNoteBody } from '@/types/api/note';
import { todoKeys } from './todo';

// 캐시 키를 한곳에서 관리합니다. 노트 생성·수정·삭제 후
// queryClient.invalidateQueries({ queryKey: noteKeys.lists() })로 목록을 새로고침할 수 있습니다.
export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
  list: (params: Omit<GetNotesParams, 'cursor'>) =>
    [...noteKeys.lists(), params] as const,
  details: () => [...noteKeys.all, 'detail'] as const,
  detail: (noteId: number) => [...noteKeys.details(), noteId] as const,
};

// 커서 기반 페이지네이션: nextCursor가 null이면 마지막 페이지입니다.
export function useNotesInfiniteQuery(
  params: Omit<GetNotesParams, 'cursor'> = {},
) {
  return useInfiniteQuery({
    queryKey: noteKeys.list(params),
    queryFn: ({ pageParam, signal }) =>
      getNotes({ ...params, cursor: pageParam }, signal),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
  });
}

export function useNoteQuery(noteId: number) {
  return useQuery({
    queryKey: noteKeys.detail(noteId),
    queryFn: ({ signal }) => getNote(noteId, signal),
  });
}

/**
 * 노트를 만들거나 지우면 할 일의 noteIds가 바뀝니다.
 * 할 일 목록·찜 목록이 노트 아이콘을 다시 그리도록 표시만 하고, 재조회를 기다리지는 않습니다.
 * (할 일 상세는 열 때마다 다시 조회합니다.)
 */
const invalidateTodoNoteIds = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  void queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
  void queryClient.invalidateQueries({ queryKey: todoKeys.favorites() });
};

export function useCreateNoteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNote,
    onSuccess: () => {
      invalidateTodoNoteIds(queryClient);
      // 노트 목록 캐시를 "오래됨"으로 표시 → 목록 화면에 가면 새로 불러옴
      return queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
}

export function useUpdateNoteMutation(noteId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateNoteBody) => updateNote(noteId, body),
    onSuccess: (updatedNote) => {
      // 상세 캐시는 서버가 돌려준 최신 노트로 바로 교체
      queryClient.setQueryData(noteKeys.detail(noteId), updatedNote);
      // 목록은 제목 등이 바뀌었으니 다시 불러오도록 표시
      return queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
}

export function useDeleteNoteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteId: number) => deleteNote(noteId),
    onSuccess: (_data, noteId) => {
      // 지워진 노트의 상세 캐시는 더 이상 필요 없으니 제거
      queryClient.removeQueries({ queryKey: noteKeys.detail(noteId) });
    },
    // 재조회를 기다리지 않아야 mutate에 넘긴 onSuccess·onError가 바로 실행됩니다.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
      invalidateTodoNoteIds(queryClient);
    },
  });
}

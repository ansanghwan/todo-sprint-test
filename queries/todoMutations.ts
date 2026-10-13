import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

import { ApiError } from '@/lib/api/errors';
import {
  addTodoFavorite,
  deleteTodo,
  removeTodoFavorite,
  updateTodo,
} from '@/lib/api/todos';
import { todoKeys } from './todo';
import {
  removeTodoFromFavorites,
  removeTodoFromLists,
  restoreTodoLists,
  snapshotTodoLists,
  updateTodoInLists,
  type TodoListSnapshot,
} from './todoCache';

interface OptimisticContext {
  snapshot: TodoListSnapshot;
}

const isHttpStatus = (error: unknown, status: number) =>
  error instanceof ApiError && error.status === status;

/** 할 일을 바꾸는 요청이 영향을 주는 캐시: 일반 목록과 찜 목록 */
const affectedQueryKeys = [todoKeys.lists(), todoKeys.favorites()];

const cancelAffectedQueries = (queryClient: QueryClient) =>
  Promise.all(
    affectedQueryKeys.map((queryKey) =>
      queryClient.cancelQueries({ queryKey }),
    ),
  );

// 재조회를 기다리지 않아야 mutate에 넘긴 onError·onSuccess가 바로 실행됩니다.
const invalidateAffectedQueries = (queryClient: QueryClient) => {
  affectedQueryKeys.forEach((queryKey) => {
    void queryClient.invalidateQueries({ queryKey });
  });
};

/**
 * 화면을 먼저 바꾸고 요청합니다. 실패하면 이전 목록(찜 목록 포함)으로 되돌리고,
 * 끝나면 목록을 다시 받아 서버 상태에 맞춥니다.
 * 토스트는 호출하는 쪽에서 mutate의 onError로 띄웁니다.
 * applyExtra: 필드 변경 외에 캐시에 미리 반영할 일 (예: 찜 해제 시 찜 목록에서 빼기)
 */
const useOptimisticTodoMutation = <TVariables extends { todoId: number }>(
  mutationFn: (variables: TVariables) => Promise<void>,
  toPatch: (variables: TVariables) => Parameters<typeof updateTodoInLists>[2],
  applyExtra?: (queryClient: QueryClient, variables: TVariables) => void,
) => {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, TVariables, OptimisticContext>({
    mutationFn,
    onMutate: async (variables) => {
      await cancelAffectedQueries(queryClient);
      const snapshot = snapshotTodoLists(queryClient);
      updateTodoInLists(queryClient, variables.todoId, toPatch(variables));
      applyExtra?.(queryClient, variables);
      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      if (context) {
        restoreTodoLists(queryClient, context.snapshot);
      }
    },
    onSettled: () => invalidateAffectedQueries(queryClient),
  });
};

/** 완료 토글 (FN-TD-06) */
export const useToggleTodoDone = () =>
  useOptimisticTodoMutation(
    ({ todoId, done }: { todoId: number; done: boolean }) =>
      updateTodo(todoId, { done }),
    ({ done }) => ({ done }),
  );

/**
 * 찜 토글 (FN-TD-07).
 * 409(이미 찜함)와 찜 해제의 404(찜 없음)는 원하는 상태와 같으므로 성공으로 봅니다.
 * 찜하기의 404는 할 일이 없다는 뜻이라 실패입니다.
 */
export const useToggleTodoFavorite = () =>
  useOptimisticTodoMutation(
    async ({ todoId, isFavorite }: { todoId: number; isFavorite: boolean }) => {
      try {
        if (isFavorite) {
          await addTodoFavorite(todoId);
        } else {
          await removeTodoFavorite(todoId);
        }
      } catch (error) {
        const isAlreadyApplied = isFavorite
          ? isHttpStatus(error, 409)
          : isHttpStatus(error, 404);
        if (!isAlreadyApplied) {
          throw error;
        }
      }
    },
    ({ isFavorite }) => ({ isFavorite }),
    // 찜 해제는 찜 목록에서 바로 뺍니다. 찜하기는 끝난 뒤 찜 목록을 다시 받아 채웁니다.
    (queryClient, { todoId, isFavorite }) => {
      if (!isFavorite) {
        removeTodoFromFavorites(queryClient, todoId);
      }
    },
  );

/** 할 일 삭제 (FN-TD-10). 확인 모달에서 요청 중을 보여주므로 성공한 뒤에 목록에서 뺍니다. */
export const useDeleteTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (todoId: number) => deleteTodo(todoId),
    onSuccess: (_data, todoId) => {
      removeTodoFromLists(queryClient, todoId);
      removeTodoFromFavorites(queryClient, todoId);
    },
    onSettled: () => invalidateAffectedQueries(queryClient),
  });
};

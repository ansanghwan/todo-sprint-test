import { useMutation, useQueryClient } from '@tanstack/react-query';

import { uploadImage } from '@/lib/api/images';
import { updateTodo, type UpdateTodoBody } from '@/lib/api/todos';
import { todoKeys } from '@/queries/todo';

interface UpdateTodoVariables {
  todoId: number;
  /** 바뀐 필드만 담은 PATCH 본문 */
  body: UpdateTodoBody;
  /** 새로 고른 이미지. 있으면 먼저 올리고 받은 URL을 fileUrl로 보냅니다. */
  newImage?: File;
}

/**
 * 할 일 수정 요청 (FN-TD-31).
 * 새 이미지는 생성과 같은 순서로 올린 뒤(POST /images → PUT) PATCH /todos/{todoId}를 보냅니다.
 * 성공하면 할 일 목록과 해당 할 일 상세 query를 무효화합니다. 재조회가 끝나기를 기다리지는 않습니다.
 * 모달 닫기·onUpdated 같은 화면 제어는 호출하는 쪽이 맡습니다.
 */
const useUpdateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ todoId, body, newImage }: UpdateTodoVariables) => {
      const fileUrl = newImage ? await uploadImage(newImage) : undefined;

      await updateTodo(todoId, fileUrl ? { ...body, fileUrl } : body);
    },
    onSuccess: (_data, { todoId }) => {
      void queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: todoKeys.detail(todoId),
      });
    },
  });
};

export default useUpdateTodo;

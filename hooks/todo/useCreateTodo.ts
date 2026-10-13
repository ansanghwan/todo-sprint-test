import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { TodoFormOutput } from '@/components/todo/todo-form/todoFormSchema';
import { toCreateTodoRequest } from '@/components/todo/todo-form/todoFormValues';
import { uploadImage } from '@/lib/api/images';
import { createTodo } from '@/lib/api/todos';
import { todoKeys } from '@/queries/todo';

/**
 * 할 일 생성 요청 (FN-TD-28).
 * 이미지가 있으면 먼저 올리고(POST /images → PUT), 받은 URL을 fileUrl로 넣어 POST /todos를 보냅니다.
 * 성공하면 할 일 목록 query를 무효화합니다. 재조회가 끝나기를 기다리지는 않습니다.
 * 모달 닫기·폼 초기화·onCreated 같은 화면 제어는 호출하는 쪽이 맡습니다.
 */
const useCreateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: TodoFormOutput) => {
      // 생성 폼의 이미지는 새로 고른 파일뿐이라 File일 때만 올립니다.
      const fileUrl =
        values.image instanceof File
          ? await uploadImage(values.image)
          : undefined;

      return createTodo(toCreateTodoRequest(values, fileUrl));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
};

export default useCreateTodo;

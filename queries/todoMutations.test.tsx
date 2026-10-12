import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/errors';
import { addTodoFavorite, removeTodoFavorite } from '@/lib/api/todos';
import QueryTestProvider from '@/test/QueryTestProvider';
import { useToggleTodoFavorite } from './todoMutations';

vi.mock('@/lib/api/todos', () => ({
  addTodoFavorite: vi.fn(),
  removeTodoFavorite: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
}));

const httpError = (status: number) =>
  new ApiError('http', `HTTP ${status}`, { status });

afterEach(() => {
  vi.clearAllMocks();
});

const toggleFavorite = async (isFavorite: boolean) => {
  const { result } = renderHook(() => useToggleTodoFavorite(), {
    wrapper: QueryTestProvider,
  });
  act(() => result.current.mutate({ todoId: 7, isFavorite }));
  await waitFor(() => expect(result.current.isPending).toBe(false));
  return result.current;
};

describe('useToggleTodoFavorite', () => {
  it('찜하기는 POST, 해제는 DELETE를 보낸다', async () => {
    vi.mocked(addTodoFavorite).mockResolvedValue();
    vi.mocked(removeTodoFavorite).mockResolvedValue();

    expect((await toggleFavorite(true)).isSuccess).toBe(true);
    expect((await toggleFavorite(false)).isSuccess).toBe(true);
    expect(addTodoFavorite).toHaveBeenCalledWith(7);
    expect(removeTodoFavorite).toHaveBeenCalledWith(7);
  });

  it('찜하기의 409(이미 찜함)는 성공으로 본다', async () => {
    vi.mocked(addTodoFavorite).mockRejectedValue(httpError(409));

    expect((await toggleFavorite(true)).isSuccess).toBe(true);
  });

  it('찜 해제의 404(찜 없음)는 성공으로 본다', async () => {
    vi.mocked(removeTodoFavorite).mockRejectedValue(httpError(404));

    expect((await toggleFavorite(false)).isSuccess).toBe(true);
  });

  it('찜하기의 404(할 일 없음)와 그 밖의 오류는 실패로 본다', async () => {
    vi.mocked(addTodoFavorite).mockRejectedValue(httpError(404));
    expect((await toggleFavorite(true)).isError).toBe(true);

    vi.mocked(removeTodoFavorite).mockRejectedValue(httpError(500));
    expect((await toggleFavorite(false)).isError).toBe(true);
  });
});

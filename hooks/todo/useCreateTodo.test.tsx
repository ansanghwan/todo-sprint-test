import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  EMPTY_TODO_FORM,
  todoFormSchema,
} from '@/components/todo/todo-form/todoFormSchema';
import { uploadImage } from '@/lib/api/images';
import { createTodo } from '@/lib/api/todos';
import { todoKeys } from '@/queries/todo';
import { makeTodo } from '@/test/todoMocks';
import useCreateTodo from './useCreateTodo';

vi.mock('@/lib/api/todos', () => ({ createTodo: vi.fn() }));
vi.mock('@/lib/api/images', () => ({ uploadImage: vi.fn() }));

const mockedCreateTodo = vi.mocked(createTodo);
const mockedUploadImage = vi.mocked(uploadImage);

afterEach(() => {
  vi.clearAllMocks();
});

const image = new File(['x'], 'photo.png', { type: 'image/png' });
const values = (overrides: Partial<typeof EMPTY_TODO_FORM> = {}) =>
  todoFormSchema.parse({
    ...EMPTY_TODO_FORM,
    title: '보고서 작성',
    goalId: 3,
    dueDate: '2026-10-10',
    ...overrides,
  });

const setup = () => {
  const queryClient = new QueryClient();
  const invalidateQueries = vi
    .spyOn(queryClient, 'invalidateQueries')
    // 재조회가 끝나지 않는 상황: 생성 결과가 재조회를 기다리지 않는지 확인합니다.
    .mockReturnValue(new Promise(() => {}));
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useCreateTodo(), { wrapper });
  return { result, invalidateQueries };
};

describe('useCreateTodo', () => {
  it('이미지가 없으면 업로드 없이 할 일을 생성한다', async () => {
    const created = makeTodo(7);
    mockedCreateTodo.mockResolvedValueOnce(created);
    const { result } = setup();

    let todo;
    await act(async () => {
      todo = await result.current.mutateAsync(values());
    });

    expect(mockedUploadImage).not.toHaveBeenCalled();
    expect(mockedCreateTodo).toHaveBeenCalledWith({
      title: '보고서 작성',
      goalId: 3,
      dueDate: '2026-10-10T14:59:59.000Z',
    });
    expect(todo).toBe(created);
  });

  it('이미지가 있으면 먼저 올리고 받은 URL을 fileUrl로 넣어 생성한다', async () => {
    mockedUploadImage.mockResolvedValueOnce('https://cdn.example.com/a.png');
    mockedCreateTodo.mockResolvedValueOnce(makeTodo(7));
    const { result } = setup();

    await act(async () => {
      await result.current.mutateAsync(values({ image }));
    });

    expect(mockedUploadImage).toHaveBeenCalledWith(image);
    expect(mockedUploadImage.mock.invocationCallOrder[0]).toBeLessThan(
      mockedCreateTodo.mock.invocationCallOrder[0],
    );
    expect(mockedCreateTodo).toHaveBeenCalledWith(
      expect.objectContaining({ fileUrl: 'https://cdn.example.com/a.png' }),
    );
  });

  it('이미지 업로드가 실패하면 할 일을 생성하지 않고 실패를 알린다', async () => {
    mockedUploadImage.mockRejectedValueOnce(new Error('upload failed'));
    const { result, invalidateQueries } = setup();

    await act(async () => {
      await expect(
        result.current.mutateAsync(values({ image })),
      ).rejects.toThrow('upload failed');
    });

    expect(mockedCreateTodo).not.toHaveBeenCalled();
    expect(invalidateQueries).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('생성에 성공하면 할 일 목록 query를 무효화하고, 재조회를 기다리지 않는다', async () => {
    mockedCreateTodo.mockResolvedValueOnce(makeTodo(7));
    const { result, invalidateQueries } = setup();

    await act(async () => {
      await result.current.mutateAsync(values());
    });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: todoKeys.lists(),
    });
  });

  it('생성이 실패하면 목록을 무효화하지 않는다', async () => {
    mockedCreateTodo.mockRejectedValueOnce(new Error('server'));
    const { result, invalidateQueries } = setup();

    await act(async () => {
      await expect(result.current.mutateAsync(values())).rejects.toThrow(
        'server',
      );
    });

    expect(invalidateQueries).not.toHaveBeenCalled();
  });
});

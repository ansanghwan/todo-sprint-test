import { zodResolver } from '@hookform/resolvers/zod';
import { act, renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import * as values from './todoFormValues';
import {
  EMPTY_TODO_FORM,
  todoFormSchema,
  type TodoFormInput,
  type TodoFormOutput,
} from './todoFormSchema';

const renderTodoForm = (defaultValues: TodoFormInput) =>
  renderHook(() =>
    useForm<TodoFormInput, unknown, TodoFormOutput>({
      resolver: zodResolver(todoFormSchema),
      defaultValues,
    }),
  );

const FILLED: TodoFormInput = {
  ...EMPTY_TODO_FORM,
  title: '할 일',
  goalId: 1,
  dueDate: '2026-10-10',
};

describe('폼 제출 흐름', () => {
  it('링크가 잘못되면 요청 본문을 만들지 않고 linkInvalid를 표시한다', async () => {
    const toRequest = vi.spyOn(values, 'toCreateTodoRequest');
    const { result } = renderTodoForm({ ...FILLED, linkUrl: 'hello world' });

    await act(() =>
      result.current.handleSubmit((output) =>
        values.toCreateTodoRequest(output),
      )(),
    );

    expect(toRequest).not.toHaveBeenCalled();
    expect(result.current.getFieldState('linkUrl').error?.message).toBe(
      'linkInvalid',
    );
  });

  it('값이 올바르면 변환된 값으로 요청 본문을 만든다', async () => {
    const onValid = vi.fn((output: TodoFormOutput) =>
      values.toCreateTodoRequest(output),
    );
    const { result } = renderTodoForm({ ...FILLED, linkUrl: 'example.com' });

    await act(() => result.current.handleSubmit(onValid)());

    expect(onValid).toHaveReturnedWith({
      title: '할 일',
      goalId: 1,
      dueDate: '2026-10-10T14:59:59.000Z',
      linkUrl: 'https://example.com',
    });
  });
});

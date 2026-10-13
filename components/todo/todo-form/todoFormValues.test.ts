import { z } from 'zod';
import { describe, expect, it } from 'vitest';

import { makeTodo } from '@/test/todoMocks';
import {
  EMPTY_TODO_FORM,
  todoFormSchema,
  type TodoFormInput,
} from './todoFormSchema';
import {
  formatDueDateForDisplay,
  toCreateTodoRequest,
  toDueDateInput,
  toDueDateIso,
  toTodoEditFormValues,
  toUpdateTodoRequest,
} from './todoFormValues';

describe('formatDueDateForDisplay', () => {
  it("'YYYY-MM-DD'를 'YYYY. MM. DD'로 보여준다", () => {
    expect(formatDueDateForDisplay('2026-10-05')).toBe('2026. 10. 05');
  });

  it('선택 전이거나 형식이 다르면 빈 문자열이다', () => {
    expect(formatDueDateForDisplay('')).toBe('');
    expect(formatDueDateForDisplay('2026-10-05T00:00:00Z')).toBe('');
  });
});

describe('toDueDateIso', () => {
  it('서버의 오프셋 없는 ISO datetime 검증을 통과한다', () => {
    expect(z.iso.datetime().safeParse(toDueDateIso('2026-10-05')).success).toBe(
      true,
    );
  });
  it('선택한 날짜의 KST 23:59:59를 UTC 형식으로 보낸다', () => {
    expect(toDueDateIso('2026-10-10')).toBe('2026-10-10T14:59:59.000Z');
  });

  it('UTC로 바꾸면 같은 날 14:59:59라서 KST 날짜가 바뀌지 않는다', () => {
    expect(new Date(toDueDateIso('2026-12-31')).toISOString()).toBe(
      '2026-12-31T14:59:59.000Z',
    );
  });
});

describe('toCreateTodoRequest', () => {
  const parse = (values: Partial<typeof EMPTY_TODO_FORM>) =>
    todoFormSchema.parse({
      ...EMPTY_TODO_FORM,
      title: '  보고서 작성  ',
      goalId: 3,
      dueDate: '2026-10-10',
      ...values,
    });

  it('필수값만 있으면 선택 항목은 본문에서 뺀다', () => {
    expect(toCreateTodoRequest(parse({}))).toEqual({
      title: '보고서 작성',
      goalId: 3,
      dueDate: '2026-10-10T14:59:59.000Z',
    });
  });

  it('태그·링크·업로드한 파일 URL을 함께 보낸다', () => {
    const values = parse({
      tags: [' 업무 ', '문서'],
      linkUrl: ' docs.example.com ',
    });

    expect(
      toCreateTodoRequest(values, 'https://cdn.example.com/a.png'),
    ).toEqual({
      title: '보고서 작성',
      goalId: 3,
      dueDate: '2026-10-10T14:59:59.000Z',
      tags: ['업무', '문서'],
      linkUrl: 'https://docs.example.com',
      fileUrl: 'https://cdn.example.com/a.png',
    });
  });
});

describe('toDueDateInput', () => {
  it('서버 마감기한(UTC)을 KST 날짜로 바꾼다', () => {
    expect(toDueDateInput('2026-10-10T14:59:59.000Z')).toBe('2026-10-10');
    // UTC로는 9일이지만 KST로는 이미 10일입니다.
    expect(toDueDateInput('2026-10-09T15:30:00.000Z')).toBe('2026-10-10');
  });

  it('toDueDateIso로 보낸 값을 다시 읽으면 같은 날짜다', () => {
    expect(toDueDateInput(toDueDateIso('2026-12-31'))).toBe('2026-12-31');
  });

  it('값이 없거나 읽을 수 없으면 빈 문자열이다', () => {
    expect(toDueDateInput(null)).toBe('');
    expect(toDueDateInput('not-a-date')).toBe('');
  });
});

describe('toUpdateTodoRequest', () => {
  const todo = makeTodo(7, {
    title: '보고서 작성',
    done: false,
    goalId: 1,
    goal: { id: 1, title: '목표 1' },
    dueDate: '2026-10-10T14:59:59.000Z',
    tags: [{ id: 1, name: '공부' }],
    linkUrl: 'https://example.com',
    fileUrl: 'https://files.test/a.png',
  });
  const initial = toTodoEditFormValues(todo);

  /** 바꾼 입력값으로 PATCH 본문을 만듭니다. */
  const requestFor = (changes: Partial<TodoFormInput>, fileUrl?: string) => {
    const current = { ...initial, ...changes };
    return toUpdateTodoRequest(
      initial,
      current,
      todoFormSchema.parse(current),
      fileUrl,
    );
  };

  it('기존 값을 폼 값으로 그대로 옮긴다', () => {
    expect(initial).toEqual({
      title: '보고서 작성',
      goalId: 1,
      dueDate: '2026-10-10',
      tags: ['공부'],
      linkUrl: 'https://example.com',
      image: 'https://files.test/a.png',
      done: false,
    });
  });

  it('바뀐 것이 없으면 빈 본문이다', () => {
    expect(requestFor({})).toEqual({});
  });

  it('바뀐 필드만 담는다', () => {
    expect(requestFor({ title: '새 제목', done: true })).toEqual({
      title: '새 제목',
      done: true,
    });
  });

  it('제목 앞뒤 공백만 다르면 바뀌지 않은 것으로 본다', () => {
    expect(requestFor({ title: '  보고서 작성  ' })).toEqual({});
  });

  it('날짜를 바꾸면 KST 23:59:59를 UTC로 보낸다', () => {
    expect(requestFor({ dueDate: '2026-10-11' })).toEqual({
      dueDate: '2026-10-11T14:59:59.000Z',
    });
  });

  it('태그가 바뀌면 배열 전체를 보낸다', () => {
    expect(requestFor({ tags: ['공부', '운동'] })).toEqual({
      tags: ['공부', '운동'],
    });
    expect(requestFor({ tags: [] })).toEqual({ tags: [] });
  });

  it('링크를 지우면 null, 바꾸면 스킴을 보완한 값을 보낸다', () => {
    expect(requestFor({ linkUrl: '' })).toEqual({ linkUrl: null });
    expect(requestFor({ linkUrl: 'codeit.kr' })).toEqual({
      linkUrl: 'https://codeit.kr',
    });
  });

  it('이미지를 지우면 null, 새 파일이면 올린 URL을 보낸다', () => {
    expect(requestFor({ image: null })).toEqual({ fileUrl: null });
    const file = new File(['image'], 'new.png', { type: 'image/png' });
    expect(requestFor({ image: file }, 'https://files.test/new.png')).toEqual({
      fileUrl: 'https://files.test/new.png',
    });
  });
});

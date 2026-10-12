import { z } from 'zod';
import { describe, expect, it } from 'vitest';

import { EMPTY_TODO_FORM, todoFormSchema } from './todoFormSchema';
import {
  formatDueDateForDisplay,
  toCreateTodoRequest,
  toDueDateIso,
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

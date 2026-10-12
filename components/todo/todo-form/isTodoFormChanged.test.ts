import { describe, expect, it } from 'vitest';

import { isTodoFormChanged } from './isTodoFormChanged';
import { EMPTY_TODO_FORM, type TodoFormInput } from './todoFormSchema';

const image = new File(['x'], 'photo.png', { type: 'image/png' });

describe('isTodoFormChanged', () => {
  it('처음 값 그대로면 바뀌지 않은 것이다', () => {
    expect(isTodoFormChanged({ ...EMPTY_TODO_FORM }, EMPTY_TODO_FORM)).toBe(
      false,
    );
  });

  it('initialGoal이 미리 들어간 상태는 사용자가 바꾼 것이 아니다', () => {
    const initial: TodoFormInput = { ...EMPTY_TODO_FORM, goalId: 3 };

    expect(isTodoFormChanged({ ...initial }, initial)).toBe(false);
    expect(isTodoFormChanged({ ...initial, goalId: 4 }, initial)).toBe(true);
  });

  it.each<[string, Partial<TodoFormInput>]>([
    ['제목', { title: '할 일' }],
    ['목표', { goalId: 1 }],
    ['마감기한', { dueDate: '2026-10-10' }],
    ['태그', { tags: ['공부'] }],
    ['링크', { linkUrl: 'example.com' }],
    ['이미지', { image }],
  ])('%s만 달라져도 바뀐 것이다', (_, changed) => {
    expect(
      isTodoFormChanged({ ...EMPTY_TODO_FORM, ...changed }, EMPTY_TODO_FORM),
    ).toBe(true);
  });

  it('공백만 입력한 제목·링크는 바뀌지 않은 것으로 본다', () => {
    expect(
      isTodoFormChanged(
        { ...EMPTY_TODO_FORM, title: '   ', linkUrl: '  ' },
        EMPTY_TODO_FORM,
      ),
    ).toBe(false);
  });

  describe('Enter를 누르기 전의 태그 글자', () => {
    it('글자가 있으면 바뀐 것이다', () => {
      expect(
        isTodoFormChanged({ ...EMPTY_TODO_FORM }, EMPTY_TODO_FORM, '공부'),
      ).toBe(true);
    });

    it('비었거나 공백뿐이면 바뀌지 않은 것이다', () => {
      expect(
        isTodoFormChanged({ ...EMPTY_TODO_FORM }, EMPTY_TODO_FORM, ''),
      ).toBe(false);
      expect(
        isTodoFormChanged({ ...EMPTY_TODO_FORM }, EMPTY_TODO_FORM, '   '),
      ).toBe(false);
    });
  });

  it('태그는 순서와 개수까지 같아야 같은 값이다', () => {
    const initial: TodoFormInput = { ...EMPTY_TODO_FORM, tags: ['가', '나'] };

    expect(isTodoFormChanged({ ...initial, tags: ['가', '나'] }, initial)).toBe(
      false,
    );
    expect(isTodoFormChanged({ ...initial, tags: ['나', '가'] }, initial)).toBe(
      true,
    );
    expect(isTodoFormChanged({ ...initial, tags: ['가'] }, initial)).toBe(true);
  });
});

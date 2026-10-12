import { describe, expect, it } from 'vitest';

import {
  canSubmitRequiredFields,
  EMPTY_TODO_FORM,
  TAG_MAX_COUNT,
  TAG_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  todoFormSchema,
  type TodoFormInput,
} from './todoFormSchema';

const VALID: TodoFormInput = {
  ...EMPTY_TODO_FORM,
  title: '할 일',
  goalId: 1,
  dueDate: '2026-10-10',
};

/** 검증 결과에서 필드별 첫 에러 메시지만 모읍니다. */
const errorsOf = (values: Partial<TodoFormInput>) => {
  const result = todoFormSchema.safeParse({ ...VALID, ...values });
  if (result.success) {
    return {};
  }
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path[0], issue.message]),
  );
};

describe('canSubmitRequiredFields (FN-TD-27)', () => {
  const required = { title: '할 일', goalId: 1, dueDate: '2026-10-10' };

  it('제목·목표·마감기한이 모두 유효하면 true다', () => {
    expect(canSubmitRequiredFields(required)).toBe(true);
  });

  it.each([
    ['제목이 공백뿐', { title: '   ' }],
    ['제목이 31자', { title: '가'.repeat(31) }],
    ['목표 미선택', { goalId: null }],
    ['마감기한 미선택', { dueDate: '' }],
  ])('%s이면 false다', (_, changed) => {
    expect(canSubmitRequiredFields({ ...required, ...changed })).toBe(false);
  });

  it('선택 항목이 잘못돼도 필수값만 본다', () => {
    const values = {
      ...EMPTY_TODO_FORM,
      ...required,
      linkUrl: 'hello world',
      tags: ['공부', '공부'],
    };

    expect(canSubmitRequiredFields(values)).toBe(true);
  });
});

describe('todoFormSchema', () => {
  it('제목·목표·마감기한이 있으면 통과한다', () => {
    expect(todoFormSchema.safeParse(VALID).success).toBe(true);
  });

  it('빈 폼은 제목·목표·마감기한이 필수라서 막힌다', () => {
    expect(errorsOf(EMPTY_TODO_FORM)).toEqual({
      title: 'titleRequired',
      goalId: 'goalRequired',
      dueDate: 'dueDateRequired',
    });
  });

  describe('제목 (FN-TD-21)', () => {
    it('공백만 입력하면 필수 에러다', () => {
      expect(errorsOf({ title: '   ' })).toEqual({ title: 'titleRequired' });
    });

    it('trim 후 30자까지 통과하고 31자부터 막힌다', () => {
      const max = '가'.repeat(TITLE_MAX_LENGTH);
      expect(errorsOf({ title: max })).toEqual({});
      expect(errorsOf({ title: `  ${max}  ` })).toEqual({});
      expect(errorsOf({ title: `${max}가` })).toEqual({
        title: 'titleTooLong',
      });
    });

    it('통과한 값은 앞뒤 공백이 제거된다', () => {
      const result = todoFormSchema.parse({ ...VALID, title: '  할 일  ' });
      expect(result.title).toBe('할 일');
    });
  });

  describe('마감기한 (FN-TD-23)', () => {
    it.each(['', '2026-1-5', '2026/10/10', '2026-02-30', '2026-13-01'])(
      '"%s"는 유효한 날짜가 아니라 막힌다',
      (dueDate) => {
        expect(errorsOf({ dueDate })).toEqual({ dueDate: 'dueDateRequired' });
      },
    );

    it('윤년 2월 29일은 통과한다', () => {
      expect(errorsOf({ dueDate: '2028-02-29' })).toEqual({});
    });
  });

  describe('태그 (FN-TD-24)', () => {
    it('10개까지 통과하고 11개부터 막힌다', () => {
      const tags = Array.from({ length: TAG_MAX_COUNT }, (_, i) => `태그${i}`);
      expect(errorsOf({ tags })).toEqual({});
      expect(errorsOf({ tags: [...tags, '하나 더'] })).toEqual({
        tags: 'tooManyTags',
      });
    });

    it('trim 후 50자까지 통과하고 51자부터 막힌다', () => {
      const max = 'a'.repeat(TAG_MAX_LENGTH);
      expect(errorsOf({ tags: [` ${max} `] })).toEqual({});
      expect(errorsOf({ tags: [`${max}a`] })).toEqual({ tags: 'tagTooLong' });
    });

    it('trim한 값이 같은 태그가 두 개면 막힌다', () => {
      expect(errorsOf({ tags: [' 공부 ', '공부'] })).toEqual({
        tags: 'duplicateTag',
      });
    });

    it('대소문자가 다르면 다른 태그로 본다', () => {
      expect(errorsOf({ tags: ['React', 'react'] })).toEqual({});
    });

    it('빈 태그는 번역 키로 막힌다', () => {
      expect(errorsOf({ tags: ['   '] })).toEqual({ tags: 'tagRequired' });
    });

    it('통과한 태그는 앞뒤 공백이 제거된다', () => {
      const result = todoFormSchema.parse({ ...VALID, tags: [' 공부 '] });
      expect(result.tags).toEqual(['공부']);
    });
  });

  describe('링크 (FN-TD-25)', () => {
    it.each([
      ['example.com', 'https://example.com'],
      ['  example.com/a?b=1  ', 'https://example.com/a?b=1'],
      ['http://example.com', 'http://example.com'],
      ['https://example.com', 'https://example.com'],
    ])('"%s"는 "%s"로 통과한다', (linkUrl, expected) => {
      expect(todoFormSchema.parse({ ...VALID, linkUrl }).linkUrl).toBe(
        expected,
      );
    });

    it.each([
      'hello world',
      'https://exa mple.com',
      'ftp://x',
      'mailto:x@example.com',
      'javascript:alert(1)',
    ])('"%s"는 linkInvalid로 막힌다', (linkUrl) => {
      expect(errorsOf({ linkUrl })).toEqual({ linkUrl: 'linkInvalid' });
    });
  });

  describe('이미지 (FN-TD-26)', () => {
    it('허용 확장자는 통과한다', () => {
      const image = new File(['x'], 'photo.PNG', { type: 'image/png' });
      expect(errorsOf({ image })).toEqual({});
    });

    it('허용하지 않는 확장자는 imageExtensionInvalid로 막힌다', () => {
      const image = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
      expect(errorsOf({ image })).toEqual({ image: 'imageExtensionInvalid' });
    });
  });

  it('링크·이미지는 비워 둬도 통과한다', () => {
    expect(errorsOf({ linkUrl: '', image: null })).toEqual({});
  });
});

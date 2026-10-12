import { describe, expect, it } from 'vitest';

import { addTag } from './tagRules';
import { TAG_MAX_COUNT, TAG_MAX_LENGTH } from './todoFormSchema';

describe('addTag (FN-TD-24)', () => {
  it('trim한 값을 뒤에 추가한다', () => {
    expect(addTag(['업무'], '  공부 ')).toEqual({
      success: true,
      tags: ['업무', '공부'],
    });
  });

  it('공백뿐이면 에러 없이 추가하지 않는다', () => {
    expect(addTag(['업무'], '   ')).toEqual({ success: true, tags: ['업무'] });
  });

  it('trim한 값이 이미 있으면 duplicateTag다', () => {
    expect(addTag(['공부'], ' 공부 ')).toEqual({
      success: false,
      error: 'duplicateTag',
    });
  });

  it('대소문자가 다르면 추가한다', () => {
    expect(addTag(['React'], 'react')).toEqual({
      success: true,
      tags: ['React', 'react'],
    });
  });

  it('50자까지 추가하고 51자면 tagTooLong이다', () => {
    const max = 'a'.repeat(TAG_MAX_LENGTH);
    expect(addTag([], max)).toEqual({ success: true, tags: [max] });
    expect(addTag([], `${max}a`)).toEqual({
      success: false,
      error: 'tagTooLong',
    });
  });

  it('이미 10개면 tooManyTags다', () => {
    const tags = Array.from({ length: TAG_MAX_COUNT }, (_, i) => `태그${i}`);
    expect(addTag(tags, '하나 더')).toEqual({
      success: false,
      error: 'tooManyTags',
    });
  });
});

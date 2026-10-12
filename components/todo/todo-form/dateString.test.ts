import { describe, expect, it } from 'vitest';

import { parseDateString, toDateString } from './dateString';

describe('toDateString', () => {
  it('로컬 연·월·일로 YYYY-MM-DD를 만든다', () => {
    expect(toDateString(new Date(2026, 9, 5))).toBe('2026-10-05');
  });

  it('로컬 자정·하루의 끝에서도 날짜가 밀리지 않는다', () => {
    expect(toDateString(new Date(2026, 0, 1, 0, 0, 0))).toBe('2026-01-01');
    expect(toDateString(new Date(2026, 11, 31, 23, 59, 59))).toBe('2026-12-31');
  });
});

describe('parseDateString', () => {
  it('YYYY-MM-DD를 로컬 자정의 Date로 바꾼다', () => {
    const date = parseDateString('2026-10-05');

    expect(date).toEqual(new Date(2026, 9, 5));
    expect(date?.getHours()).toBe(0);
  });

  it('다시 문자열로 바꾸면 같은 값이다', () => {
    expect(toDateString(parseDateString('2028-02-29')!)).toBe('2028-02-29');
  });

  it('선택 전이거나 형식이 다르면 undefined다', () => {
    expect(parseDateString('')).toBeUndefined();
    expect(parseDateString('2026. 10. 05')).toBeUndefined();
  });
});

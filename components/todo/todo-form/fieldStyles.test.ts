import { describe, expect, it } from 'vitest';

import { fieldBoxVariants } from './fieldStyles';

const classesOf = (options?: Parameters<typeof fieldBoxVariants>[0]) =>
  fieldBoxVariants(options).split(' ');

describe('fieldBoxVariants', () => {
  it('모바일은 높이 44·패딩 12·모서리 12·글자 14/20이다', () => {
    expect(classesOf()).toEqual(
      expect.arrayContaining(['min-h-11', 'px-3', 'rounded-xl', 'text-sm/5']),
    );
  });

  it('PC(md 이상)는 높이 56·패딩 16·모서리 16·글자 16/24다', () => {
    expect(classesOf()).toEqual(
      expect.arrayContaining([
        'md:min-h-14',
        'md:px-4',
        'md:rounded-2xl',
        'md:text-base/6',
      ]),
    );
  });

  it('기본 상태는 회색 테두리이고 포커스·열림 상태에서 주황 테두리가 된다', () => {
    expect(classesOf()).toEqual(
      expect.arrayContaining([
        'bg-white',
        'border-grayscale-300',
        'focus:border-orange-500',
        'focus-within:border-orange-500',
        'data-[state=open]:border-orange-500',
      ]),
    );
  });

  it('오류 상태는 danger 테두리만 쓰고 포커스 색으로 바뀌지 않는다', () => {
    const classes = classesOf({ isError: true });

    expect(classes).toContain('border-danger');
    expect(classes).not.toContain('border-grayscale-300');
    expect(classes).not.toContain('focus:border-orange-500');
  });

  it('upload 톤은 회색 배경에 점선 테두리다', () => {
    const classes = classesOf({ tone: 'upload' });

    expect(classes).toEqual(
      expect.arrayContaining(['bg-grayscale-50', 'border-dashed']),
    );
    expect(classes).not.toContain('bg-white');
  });
});

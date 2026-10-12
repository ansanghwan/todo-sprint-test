import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import TestProviders from '@/test/TestProviders';
import useTodoItemActions from './useTodoItemActions';

describe('useTodoItemActions', () => {
  it('완료·찜 토글과 링크 복사만 돌려주고 상세·노트 콜백은 포함하지 않는다', () => {
    const { result } = renderHook(() => useTodoItemActions(), {
      wrapper: TestProviders,
    });

    expect(Object.keys(result.current).sort()).toEqual([
      'onCopyLink',
      'onToggleDone',
      'onToggleFavorite',
    ]);
  });
});

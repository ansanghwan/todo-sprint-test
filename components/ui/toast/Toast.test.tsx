import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Toast from './Toast';

describe('Toast 오류 색', () => {
  it('오류 토스트 글자는 danger 토큰을 쓴다', () => {
    render(<Toast variant="error">저장에 실패했습니다</Toast>);

    const toast = screen.getByText('저장에 실패했습니다').closest('div');
    expect(toast).toHaveClass('text-danger', 'bg-[#FFF0F0]');
  });
});

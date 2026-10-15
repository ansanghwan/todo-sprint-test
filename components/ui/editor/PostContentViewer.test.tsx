import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PostContentViewer from '@/components/ui/editor/PostContentViewer';

// immediatelyRender: false라 에디터가 마운트된 뒤에 본문이 그려지므로 findBy로 기다립니다.
describe('PostContentViewer', () => {
  it('HTML 본문의 서식(굵게·기울임)을 그대로 보여 준다', async () => {
    render(
      <PostContentViewer html="<p><strong>굵게</strong> 그리고 <em>기울임</em></p>" />,
    );

    expect((await screen.findByText('굵게')).tagName).toBe('STRONG');
    expect(screen.getByText('기울임').tagName).toBe('EM');
  });

  it('가운데 정렬을 유지한다', async () => {
    render(
      <PostContentViewer html='<p style="text-align: center">가운데</p>' />,
    );

    expect(await screen.findByText('가운데')).toHaveStyle({
      textAlign: 'center',
    });
  });

  it('목록을 목록으로 보여 준다', async () => {
    render(
      <PostContentViewer html="<ul><li><p>사과</p></li><li><p>배</p></li></ul>" />,
    );

    expect(await screen.findByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('읽기 전용이라 수정할 수 없다', async () => {
    const { container } = render(<PostContentViewer html="<p>본문</p>" />);

    await screen.findByText('본문');
    expect(container.querySelector('[contenteditable]')).toHaveAttribute(
      'contenteditable',
      'false',
    );
  });

  it('스크립트 태그와 이벤트 속성은 버린다', async () => {
    const { container } = render(
      <PostContentViewer html='<p>안전</p><script>alert(1)</script><p><img src="x" onerror="alert(1)">끝</p>' />,
    );

    await screen.findByText('안전');
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('[onerror]')).toBeNull();
  });

  it('예전 일반 텍스트 게시글은 줄마다 문단으로 보여 준다', async () => {
    const { container } = render(<PostContentViewer html={'첫 줄\n둘째 줄'} />);

    await screen.findByText('첫 줄');
    expect(screen.getByText('둘째 줄')).toBeInTheDocument();
    expect(container.querySelectorAll('p')).toHaveLength(2);
  });

  it('예전 일반 텍스트의 <, & 는 태그가 아니라 글자로 보여 준다', async () => {
    render(<PostContentViewer html="a <b> & c" />);

    expect(await screen.findByText('a <b> & c')).toBeInTheDocument();
  });
});

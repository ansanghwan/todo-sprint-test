import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import IntlTestProvider from '@/test/IntlTestProvider';
import BestPostCard, { type BestPostCardData } from './BestPostCard';

afterEach(cleanup);

const post: BestPostCardData = {
  title: '집중 잘 되는 환경 세팅 꿀팁 공유!',
  image: null,
  writer: { id: 1, name: '체다치즈', image: null },
  viewCount: 353,
  commentCount: 28,
};

const thumbnail = () => screen.queryByAltText(`${post.title} 첨부 이미지`);

describe('BestPostCard', () => {
  it('이미지가 없으면 썸네일 영역을 표시하지 않는다', () => {
    render(
      <IntlTestProvider>
        <BestPostCard post={post} />
      </IntlTestProvider>,
    );
    expect(thumbnail()).toBeNull();
  });

  it('이미지가 있으면 썸네일 1장을 표시한다', () => {
    render(
      <IntlTestProvider>
        <BestPostCard post={{ ...post, image: 'https://cdn.test/a.png' }} />
      </IntlTestProvider>,
    );
    expect(thumbnail()).toBeInTheDocument();
  });
});

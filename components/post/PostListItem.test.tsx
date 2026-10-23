import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import IntlTestProvider from '@/test/IntlTestProvider';
import PostListItem, { type PostListItemData } from './PostListItem';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const post: PostListItemData = {
  title: '디지털 정리의 날',
  content: '오래된 할 일들을 정리했어요.',
  image: null,
  writer: { id: 1, name: '체다치즈', image: null },
  createdAt: '2026-02-16T09:00:00.000Z',
  viewCount: 6,
  commentCount: 28,
};

const thumbnail = () => screen.queryByAltText(`${post.title} 첨부 이미지`);

describe('PostListItem', () => {
  it('이미지가 없으면 썸네일을 표시하지 않는다', () => {
    render(
      <IntlTestProvider>
        <PostListItem post={post} />
      </IntlTestProvider>,
    );
    expect(thumbnail()).toBeNull();
  });

  it('이미지가 있으면 썸네일을 표시한다', () => {
    render(
      <IntlTestProvider>
        <PostListItem post={{ ...post, image: 'https://cdn.test/a.png' }} />
      </IntlTestProvider>,
    );
    expect(thumbnail()).toBeInTheDocument();
  });

  it.each([
    ['ko', '3시간'],
    ['en', '3h'],
  ] as const)('%s: 작성 후 지난 시간을 표시한다', (locale, expected) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-02-16T12:00:00.000Z'));
    render(
      <IntlTestProvider locale={locale}>
        <PostListItem post={post} />
      </IntlTestProvider>,
    );
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});

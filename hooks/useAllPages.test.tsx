import { infiniteQueryOptions, useQueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import QueryTestProvider from '@/test/QueryTestProvider';
import useAllPages from './useAllPages';

interface Page {
  items: number[];
  nextCursor: number | null;
}

const PAGES: Page[] = [
  { items: [1, 2], nextCursor: 3 },
  { items: [3], nextCursor: null },
];

const getPage = (cursor?: number) =>
  Promise.resolve(cursor ? PAGES[1] : PAGES[0]);

const renderAllPages = (fetchPage: (cursor?: number) => Promise<Page>) =>
  renderHook(
    () => ({
      ...useAllPages(listOptions(fetchPage)),
      client: useQueryClient(),
    }),
    { wrapper: QueryTestProvider },
  );

const listOptions = (fetchPage: (cursor?: number) => Promise<Page>) =>
  infiniteQueryOptions({
    queryKey: ['items'],
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

describe('useAllPages', () => {
  it('nextCursor가 null이 될 때까지 이어 받고, 그 전에는 pages를 주지 않는다', async () => {
    const fetchPage = vi.fn(getPage);
    const { result } = renderHook(() => useAllPages(listOptions(fetchPage)), {
      wrapper: QueryTestProvider,
    });

    expect(result.current.pages).toBeUndefined();
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.pages).toEqual(PAGES));
    expect(fetchPage.mock.calls).toEqual([[undefined], [3]]);
    expect(result.current.isLoading).toBe(false);
  });

  it('enabled가 false면 요청하지 않고 로딩도 아니다', () => {
    const fetchPage = vi.fn(getPage);
    const { result } = renderHook(
      () => useAllPages({ ...listOptions(fetchPage), enabled: false }),
      { wrapper: QueryTestProvider },
    );

    expect(fetchPage).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('이어 받기에 실패하면 멈추고, retry하면 끝까지 받는다', async () => {
    const fetchPage = vi.fn((cursor?: number) =>
      cursor ? Promise.reject(new Error('mock network error')) : getPage(),
    );
    const { result } = renderHook(() => useAllPages(listOptions(fetchPage)), {
      wrapper: QueryTestProvider,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.pages).toBeUndefined();
    expect(fetchPage).toHaveBeenCalledTimes(2);

    fetchPage.mockImplementation(getPage);
    act(() => result.current.retry());

    await waitFor(() => expect(result.current.pages).toEqual(PAGES));
    expect(result.current.isError).toBe(false);
  });
  it('이어 받는 중에 무효화돼 재조회가 겹쳐도 끝까지 받는다', async () => {
    // 첫 2페이지 요청은 응답하지 않아, 무효화가 이어 받기 도중에 일어나게 합니다.
    let isFirstNextPageRequest = true;
    const fetchPage = vi.fn((cursor?: number) => {
      if (cursor && isFirstNextPageRequest) {
        isFirstNextPageRequest = false;
        return new Promise<Page>(() => {});
      }
      return getPage(cursor);
    });
    const { result } = renderAllPages(fetchPage);
    await waitFor(() => expect(fetchPage).toHaveBeenLastCalledWith(3));

    // 생성·완료 토글처럼 이어 받는 도중에 목록 query가 무효화되는 경우입니다.
    await act(() =>
      result.current.client.invalidateQueries({ queryKey: ['items'] }),
    );

    await waitFor(() => expect(result.current.pages).toEqual(PAGES));
    expect(result.current.isError).toBe(false);
  });

  it('다 받은 뒤 무효화되면 이전 pages를 유지한 채 전체를 다시 받는다', async () => {
    const fetchPage = vi.fn(getPage);
    const { result } = renderAllPages(fetchPage);
    await waitFor(() => expect(result.current.pages).toEqual(PAGES));

    const updatedPages: Page[] = [
      { items: [1, 2], nextCursor: 3 },
      { items: [3, 4], nextCursor: null },
    ];
    fetchPage.mockImplementation((cursor?: number) =>
      Promise.resolve(cursor ? updatedPages[1] : updatedPages[0]),
    );
    act(() => {
      void result.current.client.invalidateQueries({ queryKey: ['items'] });
    });

    // 재조회 중에도 달력이 비지 않도록 이전 pages를 그대로 둡니다.
    expect(result.current.pages).toEqual(PAGES);
    await waitFor(() => expect(result.current.pages).toEqual(updatedPages));
  });
});

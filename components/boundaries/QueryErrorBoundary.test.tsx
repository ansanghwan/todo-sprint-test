import {
  QueryClient,
  QueryClientProvider,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import IntlTestProvider from '@/test/IntlTestProvider';
import QueryErrorBoundary from './QueryErrorBoundary';

afterEach(cleanup);

const fetchGreeting = vi
  .fn<() => Promise<string>>()
  .mockRejectedValueOnce(new Error('boom'))
  .mockResolvedValue('안녕하세요');

const Greeting = () => {
  const { data } = useSuspenseQuery({
    queryKey: ['greeting'],
    queryFn: fetchGreeting,
    retry: false,
  });
  return <p>{data}</p>;
};

describe('QueryErrorBoundary', () => {
  it('실패하면 메시지를 보여주고, 다시 시도하면 재요청한다', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <IntlTestProvider>
        <QueryClientProvider client={new QueryClient()}>
          <QueryErrorBoundary message="불러오지 못했어요.">
            <Suspense fallback={null}>
              <Greeting />
            </Suspense>
          </QueryErrorBoundary>
        </QueryClientProvider>
      </IntlTestProvider>,
    );

    expect(await screen.findByText('불러오지 못했어요.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByText('안녕하세요')).toBeInTheDocument();
    expect(fetchGreeting).toHaveBeenCalledTimes(2);
  });
});

'use client';

import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { catchError, type ErrorInfo } from 'next/error';
import ErrorRetry from '@/components/common/ErrorRetry';

interface QueryErrorFallbackProps {
  message: string;
  onReset: () => void;
}

export const QueryErrorFallback = ({
  message,
  onReset,
}: QueryErrorFallbackProps) => {
  const { reset: resetQueryErrors } = useQueryErrorResetBoundary();

  // 실패한 쿼리의 에러 상태를 지워야 다시 렌더링할 때 재요청합니다.
  const handleRetry = () => {
    resetQueryErrors();
    onReset();
  };

  return <ErrorRetry message={message} onRetry={handleRetry} />;
};

const QueryErrorBoundary = catchError(
  ({ message }: { message: string }, { reset }: ErrorInfo) => (
    <QueryErrorFallback message={message} onReset={reset} />
  ),
);

export default QueryErrorBoundary;

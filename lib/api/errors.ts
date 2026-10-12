import axios from 'axios';
import z from 'zod';

export type ApiErrorKind =
  'http' | 'timeout' | 'network' | 'canceled' | 'unknown';

/**
 * 화면이 분기하는 실패 의미. 백엔드 code 대신 표준 HTTP status에서 파생하므로
 * kind가 'http'가 아니면 항상 'other'입니다.
 */
export type ApiHttpCategory = 'forbidden' | 'notFound' | 'other';

const HTTP_CATEGORY_BY_STATUS: Partial<Record<number, ApiHttpCategory>> = {
  403: 'forbidden',
  404: 'notFound',
};

// kind는 요청이 어떻게 실패했는지(전송 계층), httpCategory는 HTTP 실패가 무엇을 뜻하는지입니다.
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly code?: string;
  readonly httpCategory: ApiHttpCategory;

  constructor(
    kind: ApiErrorKind,
    message: string,
    options: { status?: number; code?: string; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'ApiError';
    this.kind = kind;
    this.status = options.status;
    this.code = options.code;
    this.httpCategory = HTTP_CATEGORY_BY_STATUS[options.status ?? 0] ?? 'other';
  }
}

const ErrorBody = z.object({ message: z.string(), code: z.string() });

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (!axios.isAxiosError(error))
    return new ApiError('unknown', 'Unknown error', { cause: error });
  if (axios.isCancel(error))
    return new ApiError('canceled', error.message, { cause: error });
  if (error.response) {
    const body = ErrorBody.safeParse(error.response.data);
    return new ApiError(
      'http',
      body.success ? body.data.message : error.message,
      {
        status: error.response.status,
        code: body.success ? body.data.code : undefined,
        cause: error,
      },
    );
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT')
    return new ApiError('timeout', error.message, { cause: error });
  if (error.request)
    return new ApiError('network', error.message, { cause: error });
  return new ApiError('unknown', error.message, { cause: error });
}

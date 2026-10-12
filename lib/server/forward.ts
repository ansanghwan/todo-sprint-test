import 'server-only';
import type { NextRequest } from 'next/server';
import { backend, bearer, passthrough } from './backend';
import { withRouteErrorHandler } from './route-handler';
import { readAccessToken } from './session';

// 요청 경로에서 /api만 떼어 백엔드로 그대로 전달. 허용 경로·메서드는 route 파일의 존재와 export로 결정된다
export const forward = withRouteErrorHandler(async (request: NextRequest) => {
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const res = await backend.request({
    url: `${request.nextUrl.pathname.replace(/^\/api/, '')}${request.nextUrl.search}`,
    method: request.method,
    headers: {
      'Content-Type': 'application/json',
      ...bearer(await readAccessToken()),
    },
    data: hasBody ? await request.text() : undefined,
    signal: request.signal,
  });
  // 클라이언트 interceptor에서 refresh + API 재요청을 위해 401 에러는 그대로 전달
  return passthrough(res);
});

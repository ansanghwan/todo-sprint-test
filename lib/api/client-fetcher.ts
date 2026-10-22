import axios, { AxiosRequestConfig } from 'axios';
import { toApiError } from './errors';

const API_BASE_URL = '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

//
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
    _sessionVersion?: number;
  }
}

// Single-flight: 동시에 발생한 401들이 하나의 refresh를 공유한다.
// 백엔드가 refresh 토큰을 rotate하므로, 이미 쓴 토큰을 재사용하면 모든 세션이 만료된다.
// 같은 탭에서 요청들은 refreshing을 공유하여 한 곳에서 refresh 요청 진행 중이면 다른 요청들은 추가 refresh 요청하지 않고 대기한다
let refreshing: Promise<unknown> | null = null;
// refresh가 성공할 때마다 1씩 오른다. 요청이 어느 토큰으로 나갔는지 구분하는 데 쓴다
let sessionVersion = 0;

function refreshSession() {
  refreshing ??= api
    .post('/auth/refresh')
    .then(() => {
      sessionVersion += 1;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

api.interceptors.request.use((config) => {
  config._sessionVersion = sessionVersion;
  return config;
});

api.interceptors.response.use(undefined, async (error) => {
  if (!axios.isAxiosError(error)) return Promise.reject(error);
  const config = error.config;
  // /auth/* 401은 retry하지 않는다
  const isAuthCall = config?.url?.startsWith('/auth/') ?? false;
  const isNotUnauthorized = error.response?.status !== 401;
  const hasRetried = config?._retry;

  if (isNotUnauthorized || !config || hasRetried || isAuthCall) {
    return Promise.reject(error);
  }
  config._retry = true;
  // 뒤늦은 401: 요청이 나간 뒤 refresh가 이미 끝났다면 토큰은 교체됐으므로 재요청만 한다.
  // 여기서 refresh를 또 하면 한 번의 만료에 회전이 두 번 일어난다. 연달아 발급하면 백엔드가 409를 반환하는 것을 확인했고(원인 미확인), 그러면 로그아웃된다
  const isRotatedSinceSent = config._sessionVersion !== sessionVersion;
  if (!isRotatedSinceSent || refreshing) {
    await refreshSession();
  }
  return api.request(config);
});

api.interceptors.response.use(undefined, (error) =>
  Promise.reject(toApiError(error)),
);

// 응답 형태는 런타임 검증하지 않는다(타입 단언). DTO는 types/api/에 TS interface로 정의한다
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await api.request<T>(config);
  return response.data;
}

export async function requestVoid(config: AxiosRequestConfig) {
  await api.request(config);
}

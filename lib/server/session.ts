import 'server-only';
import { cookies } from 'next/headers';
import type { SessionCookies } from './auth-schemas';

const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

const ACCESS_TOKEN_MAX_AGE = 30 * 60; // 30 분
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 일

const options = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
} as const;

export async function readAccessToken() {
  return (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function readRefreshToken() {
  return (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value;
}

export async function setSession({
  accessToken,
  refreshToken,
}: SessionCookies) {
  const store = await cookies();
  store.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...options,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
  if (refreshToken !== undefined) {
    store.set(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...options,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  }
}

export async function clearSession() {
  const store = await cookies();
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
}

import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { REFRESH_TOKEN_COOKIE } from './lib/server/session';

const handleI18nRouting = createMiddleware(routing);

const AUTH_PATHS = ['/login', '/signup'];
const PUBLIC_PATHS = ['/', ...AUTH_PATHS];

const splitLocale = (pathname: string) => {
  const [, locale, ...rest] = pathname.split('/');
  if (!routing.locales.some((supported) => supported === locale)) return null;
  return { locale, path: `/${rest.join('/')}` };
};

// 쿠키 유무만 보는 낙관적 검사입니다. 실제 보호는 API의 401이 맡습니다.
// access token은 30분이면 만료되고 refresh로 다시 발급되므로 refresh token으로 판단합니다.
// refresh가 실패하면 BFF가 쿠키를 지우므로 다음 이동부터 비로그인으로 처리됩니다.
export default function proxy(request: NextRequest) {
  const localized = splitLocale(request.nextUrl.pathname);
  // 언어가 없는 경로는 next-intl이 언어를 붙여 다시 요청하게 하고, 그때 검사합니다.
  if (!localized) return handleI18nRouting(request);

  const { locale, path } = localized;
  const isLoggedIn = request.cookies.has(REFRESH_TOKEN_COOKIE);
  const redirectTo = (target: string) =>
    NextResponse.redirect(new URL(`/${locale}${target}`, request.url));

  if (!isLoggedIn && !PUBLIC_PATHS.includes(path)) return redirectTo('/login');
  if (isLoggedIn && AUTH_PATHS.includes(path)) return redirectTo('/dashboard');
  return handleI18nRouting(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};

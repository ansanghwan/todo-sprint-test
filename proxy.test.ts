// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import proxy from './proxy';

const request = (path: string, { loggedIn = false } = {}) =>
  new NextRequest(new URL(path, 'http://localhost'), {
    headers: loggedIn ? { cookie: 'refresh_token=token' } : {},
  });

const redirectedPath = (path: string, options?: { loggedIn?: boolean }) => {
  const location = proxy(request(path, options)).headers.get('location');
  return location && new URL(location).pathname;
};

describe('proxy 라우트 가드', () => {
  it.each(['/ko/dashboard', '/ko/todos', '/ko/posts/3', '/ko/mypage'])(
    '비로그인으로 %s에 들어가면 로그인으로 보낸다',
    (path) => {
      expect(redirectedPath(path)).toBe('/ko/login');
    },
  );

  it('리다이렉트할 때 언어를 유지한다', () => {
    expect(redirectedPath('/en/goals')).toBe('/en/login');
  });

  it.each(['/ko', '/ko/login', '/ko/signup'])(
    '비로그인이어도 공개 경로 %s는 그대로 둔다',
    (path) => {
      expect(redirectedPath(path)).toBeNull();
    },
  );

  it.each([
    ['/ko/login', '/ko/dashboard'],
    ['/en/signup', '/en/dashboard'],
  ])('로그인 상태로 %s에 들어가면 %s로 보낸다', (path, expected) => {
    expect(redirectedPath(path, { loggedIn: true })).toBe(expected);
  });

  it.each(['/ko', '/ko/dashboard', '/ko/posts/3'])(
    '로그인 상태면 %s를 그대로 둔다',
    (path) => {
      expect(redirectedPath(path, { loggedIn: true })).toBeNull();
    },
  );

  it('언어가 없는 경로는 next-intl이 먼저 언어를 붙인다', () => {
    expect(redirectedPath('/dashboard')).toBe('/ko/dashboard');
  });
});

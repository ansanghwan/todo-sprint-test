import type {
  AuthResponseDto,
  LoginBodyDto,
  SignupBodyDto,
} from '@/types/api/auth';
import { request, requestVoid } from './client-fetcher';

export const login = (body: LoginBodyDto) =>
  request<AuthResponseDto>({ url: '/auth/login', method: 'POST', data: body });

export const signup = (body: SignupBodyDto) =>
  request<AuthResponseDto>({
    url: '/auth/signup',
    method: 'POST',
    data: body,
  });

/** 기존 BFF 로그아웃 API가 세션 쿠키를 삭제합니다. */
export const logout = () =>
  requestVoid({ url: '/auth/logout', method: 'POST' });

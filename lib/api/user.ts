import type { UserDto } from '@/types/api/user';
import { request } from './client-fetcher';

export const getMe = (signal?: AbortSignal) =>
  request<UserDto>({ url: '/users/me', signal });

import type {
  ChangePasswordBodyDto,
  NicknameAvailabilityDto,
  UpdateMeBodyDto,
  UserDto,
} from '@/types/api/user';
import { request, requestVoid } from './client-fetcher';

export const getMe = (signal?: AbortSignal) =>
  request<UserDto>({ url: '/users/me', signal });

export const updateMe = (body: UpdateMeBodyDto) =>
  request<UserDto>({ url: '/users/me', method: 'PATCH', data: body });

export const changePassword = (body: ChangePasswordBodyDto) =>
  requestVoid({ url: '/users/me/password', method: 'PATCH', data: body });

export const checkNickname = (name: string) =>
  request<NicknameAvailabilityDto>({
    url: '/users/check-nickname',
    params: { name },
  });

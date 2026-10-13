export interface UserDto {
  id: number;
  teamId: string;
  email: string;
  name: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 내 프로필 수정(PATCH /{teamId}/users/me) 요청 DTO입니다. 생략한 키는 바뀌지 않습니다. */
export interface UpdateMeBodyDto {
  name?: string;
  image?: string | null;
}

export interface ChangePasswordBodyDto {
  currentPassword: string;
  newPassword: string;
}

export interface NicknameAvailabilityDto {
  available: boolean;
}

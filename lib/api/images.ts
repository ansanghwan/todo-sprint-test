import axios from 'axios';

import type { ImageUploadUrlDto } from '@/types/api/image';
import { request } from './client-fetcher';
import { toApiError } from './errors';

export const createImageUploadUrl = (fileName: string) =>
  request<ImageUploadUrlDto>({
    url: '/images',
    method: 'POST',
    data: { fileName },
  });

/**
 * 이미지를 올리고 다른 API에 넣을 파일 URL을 돌려줍니다 (FN-TD-28).
 * 발급받은 presigned URL은 외부 저장소 주소라 BFF(api 인스턴스)를 거치지 않고 바로 PUT합니다.
 */
export const uploadImage = async (file: File) => {
  const { uploadUrl, url } = await createImageUploadUrl(file.name);

  try {
    await axios.put(uploadUrl, file, {
      headers: { 'Content-Type': file.type },
    });
  } catch (error) {
    throw toApiError(error);
  }

  return url;
};

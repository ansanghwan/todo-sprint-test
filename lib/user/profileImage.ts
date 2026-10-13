import {
  UPLOADED_IMAGE_HOSTNAME,
  UPLOADED_IMAGE_PATH,
} from '@/lib/uploadedImageLocation';

const DEFAULT_PROFILE_IMAGE = '/images/gnb/img_profile.jpg';
const UPLOADED_IMAGE_PREFIX = `https://${UPLOADED_IMAGE_HOSTNAME}${UPLOADED_IMAGE_PATH}`;

/**
 * next/image에 펼쳐 넣는 프로필 이미지 props. 이미지가 없으면 기본 이미지를 씁니다.
 * 소셜 로그인 프로필처럼 remotePatterns에 없는 호스트는 최적화하면 오류가 나므로 원본 그대로 보여 줍니다.
 */
export const getProfileImageProps = (image: string | null | undefined) => ({
  src: image ?? DEFAULT_PROFILE_IMAGE,
  unoptimized: Boolean(image) && !image?.startsWith(UPLOADED_IMAGE_PREFIX),
});

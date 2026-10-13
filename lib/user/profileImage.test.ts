import { expect, it } from 'vitest';
import {
  UPLOADED_IMAGE_HOSTNAME,
  UPLOADED_IMAGE_PATH,
} from '@/lib/uploadedImageLocation';
import { getProfileImageProps } from './profileImage';

// 허용되지 않은 호스트를 최적화하면 next/image가 런타임에 오류를 냅니다.
it('업로드한 이미지는 최적화하고, 다른 호스트의 이미지는 원본 그대로 보여 준다', () => {
  const uploaded = `https://${UPLOADED_IMAGE_HOSTNAME}${UPLOADED_IMAGE_PATH}me.png`;

  expect(getProfileImageProps(uploaded).unoptimized).toBe(false);
  expect(getProfileImageProps('https://example.com/me.png').unoptimized).toBe(
    true,
  );
});

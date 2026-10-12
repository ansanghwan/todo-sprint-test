import { useEffect, useRef } from 'react';

/**
 * 고른 파일을 img 요소에 미리 보여 줍니다. 돌려주는 ref를 img에 연결합니다.
 * 임시 URL은 파일이 바뀌거나 없어질 때, 컴포넌트가 사라질 때 해제합니다.
 */
const useImagePreview = (file: Blob | null) => {
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const image = imageRef.current;
    if (!file || !image) {
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    image.src = objectUrl;

    return () => {
      URL.revokeObjectURL(objectUrl);
      image.removeAttribute('src');
    };
  }, [file]);

  return imageRef;
};

export default useImagePreview;

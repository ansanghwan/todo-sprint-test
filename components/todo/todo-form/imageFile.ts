/** FN-TD-26: 첨부할 수 있는 이미지 확장자 */
export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

/** 파일 선택 창에서 허용 확장자만 보이도록 input accept에 넣는 값 */
export const IMAGE_ACCEPT = IMAGE_EXTENSIONS.map((ext) => `.${ext}`).join(',');

/** 파일 이름의 확장자로 첨부 가능 여부를 판단합니다. 대소문자는 구분하지 않습니다. */
export const hasImageExtension = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return fileName.includes('.') && IMAGE_EXTENSIONS.includes(extension ?? '');
};

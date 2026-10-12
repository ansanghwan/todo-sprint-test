import {
  TAG_MAX_COUNT,
  TAG_MAX_LENGTH,
  type TodoFormErrorKey,
} from './todoFormSchema';

type AddTagResult =
  | { success: true; tags: string[] }
  | { success: false; error: TodoFormErrorKey };

/**
 * 태그 입력에서 Enter를 눌렀을 때 추가할지 판단합니다 (FN-TD-24).
 * 스키마와 같은 기준을 쓰고, 공백뿐인 입력은 에러 없이 무시합니다.
 */
export const addTag = (tags: string[], input: string): AddTagResult => {
  const tag = input.trim();
  if (!tag) {
    return { success: true, tags };
  }
  if (tag.length > TAG_MAX_LENGTH) {
    return { success: false, error: 'tagTooLong' };
  }
  if (tags.includes(tag)) {
    return { success: false, error: 'duplicateTag' };
  }
  if (tags.length >= TAG_MAX_COUNT) {
    return { success: false, error: 'tooManyTags' };
  }
  return { success: true, tags: [...tags, tag] };
};

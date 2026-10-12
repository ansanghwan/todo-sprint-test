import { useTranslations } from 'next-intl';

import {
  TAG_MAX_COUNT,
  TAG_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  type TodoFormErrorKey,
} from '@/components/todo/todo-form/todoFormSchema';

/** 문구에 들어가는 제한 값. 스키마의 상수와 같은 값을 보여 줍니다. */
const ERROR_LIMITS: Partial<Record<TodoFormErrorKey, number>> = {
  titleTooLong: TITLE_MAX_LENGTH,
  tagTooLong: TAG_MAX_LENGTH,
  tooManyTags: TAG_MAX_COUNT,
};

/** 폼 검증 에러 key를 현재 언어의 문구로 바꾸는 함수를 돌려줍니다. */
const useTodoFormErrorMessage = () => {
  const t = useTranslations('Todo.form.errors');

  return (error?: TodoFormErrorKey) =>
    error ? t(error, { max: ERROR_LIMITS[error] ?? 0 }) : undefined;
};

export default useTodoFormErrorMessage;

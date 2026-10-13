import z from 'zod';

import { hasImageExtension } from './imageFile';
import { parseLinkUrl } from './linkUrl';

/** FN-TD-21: 제목 최대 글자 수 */
export const TITLE_MAX_LENGTH = 30;
/** FN-TD-24: 태그 최대 개수와 태그 하나의 최대 글자 수 */
export const TAG_MAX_COUNT = 10;
export const TAG_MAX_LENGTH = 50;

/**
 * 검증 실패 시 필드에 표시할 메시지 key입니다. 문구는 화면에서 번역(Todo.form.errors)합니다.
 */
export const TODO_FORM_ERRORS = {
  titleRequired: 'titleRequired',
  titleTooLong: 'titleTooLong',
  goalRequired: 'goalRequired',
  dueDateRequired: 'dueDateRequired',
  tagRequired: 'tagRequired',
  tagTooLong: 'tagTooLong',
  tooManyTags: 'tooManyTags',
  duplicateTag: 'duplicateTag',
  linkInvalid: 'linkInvalid',
  imageExtensionInvalid: 'imageExtensionInvalid',
} as const;

export type TodoFormErrorKey = keyof typeof TODO_FORM_ERRORS;

/** RHF가 넘겨주는 에러 메시지(string)가 폼 에러 key일 때만 돌려줍니다. */
export const toTodoFormErrorKey = (message?: string) =>
  message !== undefined && message in TODO_FORM_ERRORS
    ? (message as TodoFormErrorKey)
    : undefined;

export const todoFormSchema = z.object({
  // FN-TD-21: 필수, trim 후 최대 30자
  title: z
    .string()
    .trim()
    .min(1, { error: TODO_FORM_ERRORS.titleRequired })
    .max(TITLE_MAX_LENGTH, { error: TODO_FORM_ERRORS.titleTooLong }),
  // FN-TD-22: 필수. 선택 전에는 null로 두고, 검증을 통과하면 number만 남깁니다.
  goalId: z
    .number()
    .nullable()
    .transform((goalId, ctx) => {
      if (goalId === null) {
        ctx.addIssue({
          code: 'custom',
          message: TODO_FORM_ERRORS.goalRequired,
        });
        return z.NEVER;
      }
      return goalId;
    }),
  // FN-TD-23: 필수. 폼에서는 시간대 없는 YYYY-MM-DD로 다룹니다.
  dueDate: z.iso.date({ error: TODO_FORM_ERRORS.dueDateRequired }),
  // FN-TD-24: 선택, 최대 10개·각 50자, trim
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1, { error: TODO_FORM_ERRORS.tagRequired })
        .max(TAG_MAX_LENGTH, { error: TODO_FORM_ERRORS.tagTooLong }),
    )
    .max(TAG_MAX_COUNT, { error: TODO_FORM_ERRORS.tooManyTags })
    // 명세에 없는 규칙: trim한 값이 정확히 같은 태그만 중복으로 막습니다. 대소문자는 구분합니다.
    .refine((tags) => new Set(tags).size === tags.length, {
      error: TODO_FORM_ERRORS.duplicateTag,
    }),
  // FN-TD-25: 선택. 통과하면 스킴까지 보완된 전송값(없으면 undefined)만 남깁니다.
  linkUrl: z.string().transform((link, ctx) => {
    const parsed = parseLinkUrl(link);
    if (!parsed.success) {
      ctx.addIssue({ code: 'custom', message: TODO_FORM_ERRORS.linkInvalid });
      return z.NEVER;
    }
    return parsed.url;
  }),
  // FN-TD-26: 선택, 1개. 허용 확장자가 아니면 에러
  // 새로 고른 파일(File), 수정할 때 그대로 둔 기존 이미지 URL(string), 없음(null) 중 하나입니다.
  image: z
    .union([z.instanceof(File), z.string()])
    .nullable()
    .refine(
      (image) => !(image instanceof File) || hasImageExtension(image.name),
      { error: TODO_FORM_ERRORS.imageExtensionInvalid },
    ),
  // FN-TD-30: 수정 모달의 상태 필드. 생성할 때는 false로 두고 전송하지 않습니다.
  done: z.boolean(),
});

const requiredFieldsSchema = todoFormSchema.pick({
  title: true,
  goalId: true,
  dueDate: true,
});

/**
 * FN-TD-27: 제목·목표·마감기한이 모두 유효하면 확인 버튼을 누를 수 있습니다.
 * 선택 항목(태그·링크·이미지)의 오류는 버튼을 막지 않고, 제출할 때 전체 검증에서 걸러집니다.
 */
export const canSubmitRequiredFields = (
  values: Pick<TodoFormInput, 'title' | 'goalId' | 'dueDate'>,
) => requiredFieldsSchema.safeParse(values).success;

/** 입력 중인 폼 값 (RHF defaultValues·필드 값) */
export type TodoFormInput = z.input<typeof todoFormSchema>;
/** 검증을 통과한 폼 값 (제출 시 전달) */
export type TodoFormOutput = z.output<typeof todoFormSchema>;

export const EMPTY_TODO_FORM: TodoFormInput = {
  title: '',
  goalId: null,
  dueDate: '',
  tags: [],
  linkUrl: '',
  image: null,
  done: false,
};

import type { UpdateTodoBody } from '@/lib/api/todos';
import type { CreateTodoRequestDto, TodoDto } from '@/types/api/todo';
import type { TodoFormInput, TodoFormOutput } from './todoFormSchema';

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** 'YYYY-MM-DD' → 'YYYY. MM. DD' (마감기한 필드 표시용) */
export const formatDueDateForDisplay = (date: string) => {
  const match = DATE_PATTERN.exec(date);
  if (!match) {
    return '';
  }
  const [, year, month, day] = match;
  return `${year}. ${month}. ${day}`;
};

/**
 * FN-TD-23: 사용자는 날짜만 선택하고, 전송은 ISO 8601입니다.
 * 서버의 할 일 날짜 필터가 KST 날짜를 기준으로 하므로,
 * 선택한 날짜의 KST 23:59:59를 유지하되, 서버 검증에 맞춰 UTC(Z)로 전송합니다.
 * 캘린더 연동 전에 다시 검토할 임시 계약입니다. 바꿀 때는 이 함수만 수정합니다.
 */
export const toDueDateIso = (date: string) =>
  new Date(`${date}T23:59:59+09:00`).toISOString();

/**
 * 검증을 통과한 폼 값으로 POST /todos 본문을 만듭니다.
 * 이미지는 먼저 업로드한 뒤 받은 URL을 fileUrl로 넘깁니다 (FN-TD-28).
 * 값이 없는 선택 항목은 본문에서 뺍니다. 링크는 스키마에서 이미 전송값으로 바뀌어 있습니다.
 */
export const toCreateTodoRequest = (
  values: TodoFormOutput,
  fileUrl?: string,
): CreateTodoRequestDto => ({
  title: values.title,
  goalId: values.goalId,
  dueDate: toDueDateIso(values.dueDate),
  ...(values.tags.length > 0 && { tags: values.tags }),
  ...(values.linkUrl && { linkUrl: values.linkUrl }),
  ...(fileUrl && { fileUrl }),
});

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * 서버 마감기한(ISO 8601) → 폼의 'YYYY-MM-DD' (KST 기준 날짜).
 * 브라우저 시간대와 상관없이 KST 날짜를 돌려줍니다. 값이 없거나 읽을 수 없으면 빈 문자열입니다.
 */
export const toDueDateInput = (dueDate: string | null) => {
  if (!dueDate) {
    return '';
  }
  const time = Date.parse(dueDate);
  if (Number.isNaN(time)) {
    return '';
  }
  return new Date(time + KST_OFFSET_MS).toISOString().slice(0, 10);
};

/**
 * 수정 모달의 처음 폼 값 (FN-TD-29). 서버 값을 그대로 옮기고, 규격에 맞지 않는 값도 고치지 않습니다.
 * 이미지는 기존 URL(string)로 두어 유지·삭제(null)·새 파일(File)을 구분합니다.
 */
export const toTodoEditFormValues = (todo: TodoDto): TodoFormInput => ({
  title: todo.title,
  goalId: todo.goalId,
  dueDate: toDueDateInput(todo.dueDate),
  tags: todo.tags.map((tag) => tag.name),
  linkUrl: todo.linkUrl ?? '',
  image: todo.fileUrl,
  done: todo.done,
});

const isSameTags = (a: string[], b: string[]) =>
  a.length === b.length && a.every((tag, index) => tag === b[index]);

/**
 * FN-TD-31: 처음 값과 달라진 필드만 PATCH 본문에 담습니다.
 * - 지운 링크·이미지는 null을 보냅니다.
 * - 태그가 달라졌으면 배열 전체를 보냅니다 (서버가 전체 교체).
 * - 날짜를 바꾸지 않았으면 마감기한을 보내지 않아, 서버의 기존 시각이 그대로 남습니다.
 * 빈 객체면 바뀐 것이 없다는 뜻입니다.
 *
 * @param initial 모달을 열 때의 폼 값
 * @param current 제출 시점의 폼 입력값 (링크 원문 비교용)
 * @param values 검증을 통과한 폼 값
 * @param uploadedFileUrl 새 이미지 파일을 올리고 받은 URL
 */
export const toUpdateTodoRequest = (
  initial: TodoFormInput,
  current: TodoFormInput,
  values: TodoFormOutput,
  uploadedFileUrl?: string,
): UpdateTodoBody => {
  const initialTags = initial.tags.map((tag) => tag.trim());
  const body: UpdateTodoBody = {};

  if (values.title !== initial.title.trim()) {
    body.title = values.title;
  }
  if (values.done !== initial.done) {
    body.done = values.done;
  }
  if (values.goalId !== initial.goalId) {
    body.goalId = values.goalId;
  }
  if (values.dueDate !== initial.dueDate) {
    body.dueDate = toDueDateIso(values.dueDate);
  }
  if (!isSameTags(values.tags, initialTags)) {
    body.tags = values.tags;
  }
  if (current.linkUrl.trim() !== initial.linkUrl.trim()) {
    body.linkUrl = values.linkUrl ?? null;
  }
  if (current.image !== initial.image) {
    if (current.image instanceof File) {
      body.fileUrl = uploadedFileUrl;
    } else if (current.image === null) {
      body.fileUrl = null;
    }
  }
  return body;
};

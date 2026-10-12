import type { CreateTodoRequestDto } from '@/types/api/todo';
import type { TodoFormOutput } from './todoFormSchema';

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

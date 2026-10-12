/** 노트 API(GET /{teamId}/notes) 요청·응답 DTO입니다. 서버 스펙을 그대로 따릅니다. */

// ── 요청 ──

/** POST /{teamId}/notes 요청 body */
export interface CreateNoteBody {
  todoId: number;
  title: string;
  /** Tiptap 에디터 JSON (editor.getJSON()) */
  content?: Record<string, unknown>;
  linkUrl?: string;
}

export type NoteSort = 'latest' | 'oldest';

export interface GetNotesParams {
  cursor?: number;
  limit?: number;
  todoId?: number;
  goalId?: number;
  search?: string;
  sort?: NoteSort;
}

// ── 응답 ──
export interface NoteGoal {
  id: number;
  title: string;
}

export interface NoteTag {
  id: number;
  name: string;
}

export interface NoteTodo {
  id: number;
  title: string;
  done: boolean;
  createdAt?: string;
  goal?: NoteGoal | null;
  tags?: NoteTag[];
}

export interface Note {
  id: number;
  teamId: string;
  userId: number;
  todoId: number;
  title: string;
  // 에디터 JSON이라 형태가 다양하므로 unknown으로 둡니다.
  content?: unknown;
  linkUrl: string | null;
  createdAt: string;
  updatedAt: string;
  todo: NoteTodo;
}

export interface NoteList {
  notes: Note[];
  nextCursor: number | null;
  totalCount: number;
}
/** PATCH /{teamId}/notes/{noteId} 요청 body. 보낸 필드만 수정됩니다. */
export interface UpdateNoteBody {
  title?: string;
  /** null: 본문 삭제 / 생략: 기존 값 유지 */
  content?: Record<string, unknown> | null;
  /** null: 링크 삭제 / 생략: 기존 값 유지 */
  linkUrl?: string | null;
}

import { request, requestVoid } from './client-fetcher';
import type {
  CreateNoteBody,
  GetNotesParams,
  Note,
  NoteList,
  UpdateNoteBody,
} from '@/types/api/note';

// 브라우저 → /api/notes (Next BFF) → 백엔드 /{teamId}/notes
export async function getNotes(
  params: GetNotesParams = {},
  signal?: AbortSignal,
) {
  return request<NoteList>({ method: 'GET', url: '/notes', params, signal });
}

export function getNote(noteId: number, signal?: AbortSignal) {
  return request<Note>({ method: 'GET', url: `/notes/${noteId}`, signal });
}

export function createNote(body: CreateNoteBody) {
  return request<Note>({ method: 'POST', url: '/notes', data: body });
}

export function updateNote(noteId: number, body: UpdateNoteBody) {
  return request<Note>({
    method: 'PATCH',
    url: `/notes/${noteId}`,
    data: body,
  });
}

export function deleteNote(noteId: number) {
  return requestVoid({ method: 'DELETE', url: `/notes/${noteId}` });
}

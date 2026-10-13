import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Note } from '@/types/api/note';
import NoteItem from './NoteItem';
import IntlTestProvider from '@/test/IntlTestProvider';

function renderNoteItem(note: Note) {
  return render(
    <IntlTestProvider>
      <NoteItem noteProps={note} onEdit={vi.fn()} onDelete={vi.fn()} />
    </IntlTestProvider>,
  );
}

const note: Note = {
  id: 7,
  teamId: 'team-abc',
  userId: 1,
  todoId: 12,
  title: 'API 설계 메모',
  content: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'RESTful 원칙에 따라 설계할 것',
          },
        ],
      },
    ],
  },
  linkUrl: 'https://docs.example.com',
  createdAt: '2026-02-16T09:00:00.000Z',
  updatedAt: '2026-02-16T09:00:00.000Z',
  todo: {
    id: 12,
    title: 'API 문서 작성',
    done: false,
  },
};

describe('NoteItem', () => {
  it('노트 제목, 연결된 할 일, 수정일을 렌더링한다', () => {
    renderNoteItem(note);

    expect(screen.getByText('API 설계 메모')).toBeInTheDocument();
    expect(screen.getByText('API 문서 작성')).toBeInTheDocument();
    expect(screen.getByText('2026.02.16')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: '노트 아이콘' }),
    ).toBeInTheDocument();
  });

  it('미완료 할 일은 TO DO 상태를 표시한다', () => {
    renderNoteItem(note);

    expect(screen.getByText('TO DO')).toBeInTheDocument();
  });

  it('완료된 할 일은 DONE 상태를 표시한다', () => {
    renderNoteItem({ ...note, todo: { ...note.todo, done: true } });

    expect(screen.getByText('DONE')).toBeInTheDocument();
  });
});

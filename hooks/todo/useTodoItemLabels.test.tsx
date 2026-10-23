import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import IntlTestProvider, { type TestLocale } from '@/test/IntlTestProvider';
import TodoItem, { type TodoItemData } from '@/components/todo/TodoItem';
import useTodoItemLabels from './useTodoItemLabels';

const noop = () => {};

const LabeledTodoItem = ({ todo }: { todo: TodoItemData }) => {
  const labels = useTodoItemLabels();
  return (
    <ul>
      <TodoItem
        todo={todo}
        labels={labels}
        onToggleDone={noop}
        onToggleFavorite={noop}
        onOpenDetail={noop}
        onCopyLink={noop}
        onViewNote={noop}
        onCreateNote={noop}
      />
    </ul>
  );
};

const renderItem = (locale: TestLocale, todo: Partial<TodoItemData> = {}) =>
  render(
    <IntlTestProvider locale={locale}>
      <LabeledTodoItem
        todo={{
          id: 1,
          title: '할 일',
          done: false,
          isFavorite: false,
          linkUrl: 'https://example.com',
          noteIds: [7],
          ...todo,
        }}
      />
    </IntlTestProvider>,
  );

describe.each([
  {
    locale: 'ko' as const,
    names: {
      done: '완료',
      favorite: '대표 기록',
      viewNote: '작업 기록 보기',
      writeNote: '작업 기록 작성',
      copyLink: '링크 복사',
      moreActions: '더보기',
    },
  },
  {
    locale: 'en' as const,
    names: {
      done: 'Completed',
      favorite: 'Featured Work',
      viewNote: 'View Work Log',
      writeNote: 'Write a Work Log',
      copyLink: 'Copy Link',
      moreActions: 'More',
    },
  },
])('TodoItem 접근성 이름 ($locale)', ({ locale, names }) => {
  it('아이콘 버튼마다 현재 언어의 이름을 가진다', () => {
    renderItem(locale);

    expect(
      screen.getByRole('checkbox', { name: names.done }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: names.favorite }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: names.viewNote }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: names.copyLink }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: names.moreActions }),
    ).toBeInTheDocument();
  });

  it('노트가 없으면 노트 작성 이름을 쓴다', () => {
    renderItem(locale, { noteIds: [] });

    expect(
      screen.getByRole('button', { name: names.writeNote }),
    ).toBeInTheDocument();
  });

  it('완료·찜 상태가 바뀌어도 이름은 그대로이고 상태만 aria로 전달한다', () => {
    const { unmount } = renderItem(locale, { done: false, isFavorite: false });
    expect(screen.getByRole('checkbox', { name: names.done })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(
      screen.getByRole('button', { name: names.favorite }),
    ).toHaveAttribute('aria-pressed', 'false');
    unmount();

    renderItem(locale, { done: true, isFavorite: true });
    expect(screen.getByRole('checkbox', { name: names.done })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(
      screen.getByRole('button', { name: names.favorite }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
});

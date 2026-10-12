'use client';

import { useState } from 'react';
import useTodoItemLabels from '@/hooks/todo/useTodoItemLabels';
import TodoItem, {
  type TodoItemData,
  type TodoItemStyle,
} from '@/components/todo/TodoItem';

const initialTodos: TodoItemData[] = [
  {
    id: 1,
    title: '디자인 시스템 정복하기',
    done: false,
    noteIds: [101],
    linkUrl: 'https://example.com',
    isFavorite: false,
  },
  {
    id: 2,
    title: '완료한 할 일과 찜 상태 확인하기',
    done: true,
    noteIds: [102],
    linkUrl: null,
    isFavorite: true,
  },
  {
    id: 3,
    title: '노트가 없는 할 일에서 작성 아이콘 확인하기',
    done: false,
    noteIds: [],
    linkUrl: null,
    isFavorite: false,
  },
  {
    id: 4,
    title:
      '아주 긴 할 일 제목이 화면 너비에 맞춰 한 줄로 말줄임되는지 확인하기 위한 샘플입니다',
    done: false,
    noteIds: [104],
    linkUrl: 'https://example.com/todo',
    isFavorite: true,
  },
];

const previews: {
  label: string;
  size: 'large' | 'small';
  style: TodoItemStyle;
}[] = [
  { label: '기본 · Large', size: 'large', style: 'todo' },
  { label: '기본 · Small', size: 'small', style: 'todo' },
  { label: '밝은 아이콘 · Large', size: 'large', style: 'white' },
  { label: '밝은 아이콘 · Small', size: 'small', style: 'white' },
];

// 개발 확인용 페이지입니다. TodoItem 원본을 수정하지 않고 샘플 데이터와 콜백만 전달합니다.
export default function TodoItemSamplePage() {
  const labels = useTodoItemLabels();
  const [todos, setTodos] = useState(initialTodos);
  const [message, setMessage] = useState(
    '완료·찜 버튼을 눌러 상태 변화를 확인하세요.',
  );

  function updateTodo(
    id: number,
    patch: Partial<Pick<TodoItemData, 'done' | 'isFavorite'>>,
  ) {
    setTodos((previous) =>
      previous.map((todo) => (todo.id === id ? { ...todo, ...patch } : todo)),
    );
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setMessage(`샘플 링크 복사: ${url}`);
    } catch {
      setMessage('클립보드 권한을 확인해주세요. 링크를 복사하지 못했습니다.');
    }
  }

  return (
    <main className="min-h-dvh bg-background px-4 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-2xl font-bold text-heading">TodoItem 미리보기</h1>
          <p>크기 2종과 배경 스타일 2종을 비교하는 임시 페이지입니다.</p>
          <p className="text-sm text-muted">
            완료·찜 상태는 네 미리보기에 함께 반영되며 새로고침하면
            초기화됩니다. 상세·노트 기능은 아래에 클릭 결과만 표시합니다.
            더보기는 원본의 기본 버튼으로, 메뉴는 연결하지 않았습니다.
          </p>
          <button
            type="button"
            className="rounded-lg border border-default px-4 py-2 text-sm"
            onClick={() => {
              setTodos(initialTodos);
              setMessage('샘플 상태를 초기화했습니다.');
            }}
          >
            샘플 초기화
          </button>
          <p role="status" className="rounded-lg bg-white-section p-4 text-sm">
            {message}
          </p>
        </header>
        <div className="grid gap-6 lg:grid-cols-2">
          {previews.map((preview) => (
            <section
              key={`${preview.size}-${preview.style}`}
              className="min-w-0 space-y-3"
            >
              <h2 className="text-lg font-semibold">{preview.label}</h2>
              <code className="block text-sm text-muted">{`size="${preview.size}" style="${preview.style}"`}</code>
              <div
                className={`${preview.size === 'small' ? 'max-w-93.75' : ''} ${preview.style === 'white' ? 'bg-orange-500' : 'bg-orange-100'} w-full rounded-2xl p-3`}
              >
                <ul>
                  {todos.map((todo) => (
                    <TodoItem
                      labels={labels}
                      key={todo.id}
                      todo={todo}
                      size={preview.size}
                      style={preview.style}
                      onToggleDone={(id, done) => updateTodo(id, { done })}
                      onToggleFavorite={(id, isFavorite) =>
                        updateTodo(id, { isFavorite })
                      }
                      onOpenDetail={(id) =>
                        setMessage(`할 일 ${id}: 상세 열기 클릭`)
                      }
                      onCopyLink={(url) => void copyLink(url)}
                      onViewNote={(id) =>
                        setMessage(`노트 ${id}: 노트 보기 클릭`)
                      }
                      onCreateNote={(id) =>
                        setMessage(`할 일 ${id}: 노트 작성 클릭`)
                      }
                    />
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

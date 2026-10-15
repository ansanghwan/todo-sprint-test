import TodoItem from '@/components/todo/TodoItem';
import TodoItemKebab from '@/components/todo/TodoItemKebab';
import Modal from '@/components/ui/Modal';
import ModalHeader from '@/components/ui/ModalHeader';
import useTodoItemActions from '@/hooks/todo/useTodoItemActions';
import useTodoItemLabels from '@/hooks/todo/useTodoItemLabels';
import type { TodoDto } from '@/types/api/todo';
import { formatDateKey, type DateKey } from '../_lib/calendarDates';

interface DayTodosModalProps {
  dateKey: DateKey;
  todos: TodoDto[];
  onClose: () => void;
  onOpenTodo: (todoId: number) => void;
  onViewNote: (noteId: number) => void;
  onCreateNote: (todoId: number) => void;
  onEditTodo: (todoId: number) => void;
  onDeleteTodo: (todo: Pick<TodoDto, 'id' | 'title'>) => void;
}

const DayTodosModal = ({
  dateKey,
  todos,
  onClose,
  onOpenTodo,
  onViewNote,
  onCreateNote,
  onEditTodo,
  onDeleteTodo,
}: DayTodosModalProps) => {
  const labels = useTodoItemLabels();
  // 완료·찜·링크 복사는 공용 액션으로 동작합니다.
  const actions = useTodoItemActions();

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen
      onOpenChange={handleOpenChange}
      size="md"
      className="min-h-80 gap-4 overflow-hidden"
    >
      <ModalHeader>
        {formatDateKey(dateKey)}
        <span className="text-orange-600">{todos.length}</span>
      </ModalHeader>
      <ul className="flex min-h-0 flex-1 scrollbar-thin flex-col gap-1 overflow-y-auto overscroll-contain">
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            labels={labels}
            size="small"
            {...actions}
            onOpenDetail={onOpenTodo}
            onViewNote={onViewNote}
            onCreateNote={onCreateNote}
            kebabSlot={
              <TodoItemKebab
                onEdit={() => onEditTodo(todo.id)}
                onDelete={() =>
                  onDeleteTodo({ id: todo.id, title: todo.title })
                }
              />
            }
          />
        ))}
      </ul>
    </Modal>
  );
};

export default DayTodosModal;

import { Link } from '@/i18n/navigation';
import TodoItemKebab from '@/components/todo/TodoItemKebab';
import Image from 'next/image';
import TodoItem, {
  type TodoItemData,
  type TodoItemProps,
} from '@/components/todo/TodoItem';
import DashboardLoading from '@/components/dashboard/DashboardLoading';

type RecentTodosCardProps = {
  todos: TodoItemData[];
  labels: TodoItemProps['labels'];
  isLoading: boolean;
  error: boolean;
  onToggleDone: TodoItemProps['onToggleDone'];
  onToggleFavorite: TodoItemProps['onToggleFavorite'];
  onCopyLink: TodoItemProps['onCopyLink'];
  onDelete: (todo: TodoItemData) => void;
};

/** 최근 할 일의 표시만 담당합니다. 조회와 상태 변경은 페이지에서 전달합니다. */
export default function RecentTodosCard({
  todos,
  labels,
  isLoading,
  error,
  onToggleDone,
  onToggleFavorite,
  onCopyLink,
  onDelete,
}: RecentTodosCardProps) {
  return (
    <div className="min-w-0 md:flex-1 lg:flex-[1_1_28rem]">
      <div className="mb-2.5 flex flex-wrap px-2">
        <h2 className="mr-auto inline-flex items-center text-base font-medium text-heading md:text-lg">
          <span className="mr-2 inline-flex size-8 items-center justify-center rounded-lg bg-[#ffd0aa]">
            <Image src="/icons/icon_memo.svg" width={16} height={21} alt="" />
          </span>
          최근 등록한 할일
        </h2>
        <Link
          href="/todos"
          className="ml-auto flex items-center text-sm font-semibold text-orange-600"
        >
          모두 보기
          <span>
            <svg
              className="size-5"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M7.5 15L12.5 10L7.5 5"
                stroke="#FF8442"
                strokeWidth="1.67"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </Link>
      </div>
      <div className="aspect-343/186 w-full rounded-[1.75rem] bg-orange-500 px-4.5 py-4 shadow-[0_0.625rem_2.5rem_0_#FF9E594D] md:aspect-auto md:h-46.5 lg:h-64 lg:rounded-[2.5rem] lg:px-8 lg:py-7.5">
        {isLoading ? (
          <DashboardLoading message="할 일을 불러오는 중입니다." />
        ) : error ? (
          <div
            role="alert"
            className="flex h-full items-center justify-center text-base font-semibold text-white"
          >
            <p>할 일을 불러오지 못했어요</p>
          </div>
        ) : todos.length > 0 ? (
          <div className="size-full max-md:flex max-md:flex-col max-md:justify-center">
            <ul className="flex h-full flex-col justify-between max-md:max-h-56">
              {todos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  labels={labels}
                  size="small"
                  style="white"
                  kebabSlot={
                    <TodoItemKebab isWhite onDelete={() => onDelete(todo)} />
                  }
                  showCreateNote={false}
                  onToggleDone={onToggleDone}
                  onToggleFavorite={onToggleFavorite}
                  // 상세·노트 화면은 해당 기능 구현 후 연결합니다.
                  onOpenDetail={() => undefined}
                  onCopyLink={onCopyLink}
                  onViewNote={() => undefined}
                  onCreateNote={() => undefined}
                />
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-base font-semibold text-white">
            <p>최근에 등록한 할 일이 없어요</p>
          </div>
        )}
      </div>
    </div>
  );
}

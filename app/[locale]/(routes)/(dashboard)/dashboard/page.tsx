'use client';

import useCurrentUser from '@/hooks/useCurrentUser';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import TodoCreateModal from '@/components/todo/todo-create/TodoCreateModal';
import DeleteTodoModal from '@/components/todo/DeleteTodoModal';
import TodoItemKebab from '@/components/todo/TodoItemKebab';
import { toast } from '@/components/ui/toast/Toaster';
import {
  useToggleTodoDone,
  useToggleTodoFavorite,
} from '@/queries/todoMutations';
import useTodoItemActions from '@/hooks/todo/useTodoItemActions';
import { useCallback, useEffect, useRef, useState } from 'react';
import RecentTodosCard from '@/components/dashboard/RecentTodosCard';
import TodoProgressCard from '@/components/dashboard/TodoProgressCard';
import GoalProgressBar from '@/components/dashboard/GoalProgressBar';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardEmptyState from '@/components/dashboard/DashboardEmptyState';
import TodoItem, { type TodoItemData } from '@/components/todo/TodoItem';
import useTodoItemLabels from '@/hooks/todo/useTodoItemLabels';
import SearchInput from '@/components/ui/SearchInput';
import type { GoalDto as Goal } from '@/types/api/goal';
import { getGoalTodos, getRecentTodos, getTodoProgress } from '@/lib/api/todos';
import { getGoals } from '@/lib/api/goals';

// TO DO·DONE에 같은 스크롤 높이를 적용합니다. 모바일 276px / 태블릿 248px / PC 324px.
const goalTodoScrollClass =
  'mt-3 max-h-69 overflow-y-auto scrollbar-thin md:max-h-62 lg:max-h-81';
// 대시보드 목표 카드에만 hover를 적용합니다. 키보드로 버튼에 접근할 때도 강조합니다.
const goalTodoItemClass =
  'group/dashboard-todo rounded-lg transition-colors hover:bg-orange-alpha-20 focus-within:bg-orange-alpha-20 md:px-2 lg:h-11 lg:gap-2 lg:py-0 hover:[&>button:nth-of-type(2)]:text-orange-600 focus-within:[&>button:nth-of-type(2)]:text-orange-600';

// 작은 주황색 점의 공용 아이콘을 사용합니다. SVG의 흰 원 대신 행 hover·포커스 배경으로 표시합니다.
const goalTodoKebabClass =
  'flex shrink-0 rounded-full transition-colors group-hover/dashboard-todo:bg-white group-focus-within/dashboard-todo:bg-white [&>button]:size-6 [&>button]:rounded-full [&>button[data-state=open]]:bg-white [&_svg>circle:first-child]:fill-transparent';

// 목표 ID와 완료 여부별로 목록·커서·조회 상태를 따로 보관합니다.
type GoalTodosState = {
  todos: TodoItemData[];
  // 입력 중인 값이 아닌, 마지막으로 실행한 검색어입니다. 더보기에도 사용합니다.
  keyword?: string;
  error: boolean;
  // 서버가 알려준 다음 조회 위치입니다. null이면 마지막 페이지입니다.
  nextCursor: number | null;
  // 첫 조회와 구분해, 추가 조회 중에도 기존 목록을 유지합니다.
  isLoadingMore?: boolean;
  loadMoreError?: boolean;
};

export default function Dashboard() {
  // 헤더와 같은 쿼리 키를 사용하므로 사용자 데이터와 진행 중인 요청을 공유합니다.
  const { userName } = useCurrentUser();
  const todoLabels = useTodoItemLabels();
  const t = useTranslations('Todo');
  const [createGoal, setCreateGoal] = useState<Pick<
    Goal,
    'id' | 'title'
  > | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TodoItemData | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const loadedGoalCount = useRef(2);
  const pendingTodoIds = useRef(new Set<number>());
  const doneMutation = useToggleTodoDone();
  const favoriteMutation = useToggleTodoFavorite();
  const { onCopyLink } = useTodoItemActions();
  // 상단 주황색 카드에 표시할 최근 할 일 목록입니다.
  const [recentTodos, setRecentTodos] = useState<TodoItemData[]>([]);
  // API에서 받아온 목표 목록을 저장합니다.
  const [goals, setGoals] = useState<Goal[]>([]);
  // 목표 목록의 첫 조회 상태입니다. 추가 조회 상태와 분리합니다.
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [goalsError, setGoalsError] = useState(false);
  // 목표 카드 자체를 2개씩 추가할 때 사용하는 커서입니다.
  const [nextGoalCursor, setNextGoalCursor] = useState<number | null>(null);
  const [isLoadingMoreGoals, setIsLoadingMoreGoals] = useState(false);
  // 추가 조회 실패 시 자동 요청을 멈추고 재시도 버튼을 표시합니다.
  const [moreGoalsError, setMoreGoalsError] = useState(false);
  // 목록 끝의 감지용 DOM입니다. 화면에 들어오면 다음 목표를 조회합니다.
  const goalSentinel = useRef<HTMLDivElement>(null);
  // 진행 중인 요청을 보관해 중복 호출을 막고, 화면을 떠날 때 취소합니다.
  const moreGoalsRequest = useRef<AbortController | null>(null);
  // 할 일 첫 조회를 시작한 목표를 기록해 기존 목표의 검색 결과를 보존합니다.
  const loadedGoalIds = useRef(new Set<number>());
  const goalKeywords = useRef(new Map<number, string | undefined>());
  const refreshingGoals = useRef(false);
  // 키 예: "678-false"는 678번 목표의 TO DO, "678-true"는 DONE입니다.
  // 해당 키가 없으면 아직 조회가 끝나지 않은 상태로 처리합니다.
  const [todosByGoal, setTodosByGoal] = useState<
    Record<string, GoalTodosState>
  >({});

  // 같은 목표의 중복 요청을 막고, 페이지를 떠날 때 추가 조회도 취소합니다.
  const goalRequests = useRef(new Map<string, AbortController>());

  // 처음에는 로딩을 표시하고, 요청이 끝나면 false로 변경합니다.
  const [isLoadingRecentTodos, setIsLoadingRecentTodos] = useState(true);
  // 조회에 실패하면 true로 변경해 오류 안내를 표시합니다.
  const [recentTodosError, setRecentTodosError] = useState(false);

  // 전체 할 일의 완료 진행률(0~100)입니다. null은 진행률 데이터가 아직 없는 상태를 뜻합니다.
  const [progress, setProgress] = useState<number | null>(null);

  // 진행률 조회 실패 여부와 로딩 상태는 최근 할 일 목록과 별도로 관리합니다.
  const [progressError, setProgressError] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  // 진행률 데이터가 있는지 확인합니다. 0%도 유효한 값이므로 null인 경우만 데이터가 없다고 판단합니다.
  const hasProgress = progress !== null;
  // 원형 차트와 퍼센트 텍스트에 표시할 값입니다. 진행률 데이터가 없으면 0%로 표시합니다.
  const displayProgress = hasProgress ? progress : 0;

  // 처음에는 목표를 최대 2개 조회하고, 응답의 goals 배열을 화면 상태에 저장합니다.
  useEffect(() => {
    const controller = new AbortController();

    // 갱신할 때도 표시 중인 목표 수를 유지하도록 필요한 페이지까지 조회합니다.
    const fetchVisibleGoals = async () => {
      const visibleGoals: Goal[] = [];
      let cursor: number | undefined;
      let nextCursor: number | null = null;
      do {
        const page = await getGoals({ limit: 2, cursor }, controller.signal);
        visibleGoals.push(...page.goals);
        nextCursor = page.nextCursor;
        if (
          nextCursor === null ||
          nextCursor === cursor ||
          page.goals.length === 0
        )
          break;
        cursor = nextCursor;
      } while (visibleGoals.length < loadedGoalCount.current);
      return { goals: visibleGoals, nextCursor };
    };
    fetchVisibleGoals()
      .then((data) => {
        if (controller.signal.aborted) return;
        setGoalsError(false);
        setGoals(data.goals);
        setNextGoalCursor(data.nextCursor ?? null);
      })
      .catch(() => {
        if (!controller.signal.aborted) setGoalsError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          refreshingGoals.current = false;
          setIsLoadingGoals(false);
        }
      });

    return () => controller.abort();
  }, [refreshVersion]);

  // 첫 조회와 검색은 같은 함수를 사용합니다. 같은 영역의 이전 요청은 취소합니다.
  const loadGoalFirstPage = useCallback((goalId: number, keyword?: string) => {
    goalKeywords.current.set(goalId, keyword);
    // 영역별 더보기를 위해 미완료(false)와 완료(true)를 각각 조회합니다.
    [false, true].forEach((done) => {
      const key = `${goalId}-${done}`;
      goalRequests.current.get(key)?.abort();
      const controller = new AbortController();
      goalRequests.current.set(key, controller);
      getGoalTodos(goalId, controller.signal, undefined, done, keyword)
        .then((data) => {
          if (controller.signal.aborted) return;
          setTodosByGoal((previous) => ({
            ...previous,
            [key]: {
              todos: data.todos,
              keyword,
              error: false,
              nextCursor: data.nextCursor,
            },
          }));
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setTodosByGoal((previous) => ({
            ...previous,
            [key]: { todos: [], keyword, error: true, nextCursor: null },
          }));
        })
        .finally(() => {
          // 이전 요청의 정리가 새 검색의 요청 정보를 지우지 않도록 확인합니다.
          if (goalRequests.current.get(key) === controller)
            goalRequests.current.delete(key);
        });
    });
  }, []);

  // 새로 추가된 목표만 조회하여 기존 목표의 검색 결과와 더보기 상태를 유지합니다.
  useEffect(() => {
    loadedGoalCount.current = Math.max(2, goals.length);
    goals.forEach((goal) => {
      if (loadedGoalIds.current.has(goal.id)) return;
      loadedGoalIds.current.add(goal.id);
      loadGoalFirstPage(goal.id);
    });
  }, [goals, loadGoalFirstPage]);

  // 페이지를 떠날 때 진행 중인 할 일·목표 추가 요청을 모두 정리합니다.
  useEffect(() => {
    const requests = goalRequests.current;
    const loadedIds = loadedGoalIds.current;
    return () => {
      requests.forEach((request) => request.abort());
      requests.clear();
      loadedIds.clear();
      moreGoalsRequest.current?.abort();
      moreGoalsRequest.current = null;
    };
  }, []);

  // 목표 카드를 2개 추가합니다. 실패해도 기존 카드와 커서를 유지합니다.
  const loadMoreGoals = useCallback(async () => {
    if (
      nextGoalCursor === null ||
      moreGoalsRequest.current ||
      refreshingGoals.current
    )
      return;
    const controller = new AbortController();
    moreGoalsRequest.current = controller;
    setIsLoadingMoreGoals(true);
    setMoreGoalsError(false);
    try {
      const data = await getGoals(
        { limit: 2, cursor: nextGoalCursor },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setGoals((previous) => {
        // 같은 목표가 응답에 다시 포함되더라도 카드는 중복으로 추가하지 않습니다.
        const ids = new Set(previous.map((goal) => goal.id));
        return [...previous, ...data.goals.filter((goal) => !ids.has(goal.id))];
      });
      setNextGoalCursor(data.nextCursor ?? null);
    } catch {
      if (!controller.signal.aborted) setMoreGoalsError(true);
    } finally {
      if (!controller.signal.aborted) setIsLoadingMoreGoals(false);
      if (moreGoalsRequest.current === controller)
        moreGoalsRequest.current = null;
    }
  }, [nextGoalCursor]);

  // 스크롤 동작이 아니라 목록 끝이 화면 안에 보이는지를 감지합니다.
  // 추가 후에도 끝이 보이면 감지를 다시 시작하면서 다음 2개를 불러옵니다.
  useEffect(() => {
    const sentinel = goalSentinel.current;
    if (
      !sentinel ||
      nextGoalCursor === null ||
      isLoadingGoals ||
      isLoadingMoreGoals ||
      moreGoalsError
    )
      return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void loadMoreGoals();
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    nextGoalCursor,
    isLoadingGoals,
    isLoadingMoreGoals,
    moreGoalsError,
    loadMoreGoals,
  ]);

  // 검색은 Enter 또는 돋보기 클릭 시 실행하며, 다른 목표의 목록은 유지합니다.
  const searchGoalTodos = (goalId: number, query: string) => {
    // 이 목표의 목록과 커서만 비우면 양쪽에 로딩 안내가 표시됩니다.
    setTodosByGoal((previous) => {
      const next = { ...previous };
      delete next[`${goalId}-false`];
      delete next[`${goalId}-true`];
      return next;
    });
    // 공백뿐인 검색어는 필터를 생략하여 기본 목록으로 돌아갑니다.
    loadGoalFirstPage(goalId, query.trim() || undefined);
  };

  // 마지막으로 받은 nextCursor부터 다음 10개를 조회해 기존 목록에 이어 붙입니다.
  const loadMoreGoalTodos = async (goalId: number, done: boolean) => {
    const key = `${goalId}-${done}`;
    const current = todosByGoal[key];
    if (
      !current ||
      current.nextCursor === null ||
      goalRequests.current.has(key)
    )
      return;

    const controller = new AbortController();
    goalRequests.current.set(key, controller);
    setTodosByGoal((previous) => ({
      ...previous,
      [key]: {
        ...previous[key],
        isLoadingMore: true,
        loadMoreError: false,
      },
    }));

    try {
      const data = await getGoalTodos(
        goalId,
        controller.signal,
        current.nextCursor,
        done,
        current.keyword,
      );
      if (controller.signal.aborted) return;
      setTodosByGoal((previous) => {
        const existing = previous[key];
        const existingIds = new Set(existing.todos.map((todo) => todo.id));
        return {
          ...previous,
          [key]: {
            ...existing,
            // 조회 사이에 같은 항목이 다시 오더라도 중복으로 표시하지 않습니다.
            todos: [
              ...existing.todos,
              ...data.todos.filter((todo) => !existingIds.has(todo.id)),
            ],
            nextCursor: data.nextCursor,
            isLoadingMore: false,
          },
        };
      });
    } catch {
      if (controller.signal.aborted) return;
      // 추가 조회에 실패해도 이미 표시한 목록과 다음 커서는 유지합니다.
      setTodosByGoal((previous) => ({
        ...previous,
        [key]: {
          ...previous[key],
          isLoadingMore: false,
          loadMoreError: true,
        },
      }));
    } finally {
      if (goalRequests.current.get(key) === controller) {
        goalRequests.current.delete(key);
      }
    }
  };

  // 대시보드가 화면에 나타나면 최근 등록한 할 일을 조회합니다.
  useEffect(() => {
    const controller = new AbortController();

    getRecentTodos(controller.signal)
      .then((todos) => {
        // 성공: 받은 목록을 저장하면 TodoItem 또는 빈 목록 안내가 표시됩니다.
        if (!controller.signal.aborted) {
          setRecentTodos(todos);
          setRecentTodosError(false);
        }
      })
      .catch(() => {
        // 실패: 요청 취소를 제외한 조회 오류는 동일한 안내로 처리합니다.
        if (!controller.signal.aborted) setRecentTodosError(true);
      })
      .finally(() => {
        // 성공·실패와 관계없이 요청이 끝나면 로딩을 종료합니다.
        if (!controller.signal.aborted) setIsLoadingRecentTodos(false);
      });

    // 페이지를 벗어날 때 요청을 취소하고, 이전 요청이 화면 상태를 바꾸지 않게 합니다.
    return () => controller.abort();
  }, [refreshVersion]);

  // 전체·완료 할 일 수로 계산한 진행률을 차트와 퍼센트 텍스트에 전달합니다.
  useEffect(() => {
    const controller = new AbortController();

    getTodoProgress(controller.signal)
      .then((percentage) => {
        if (!controller.signal.aborted) {
          setProgress(percentage);
          setProgressError(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setProgressError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingProgress(false);
      });

    return () => controller.abort();
  }, [refreshVersion]);

  // 공용 mutation은 Query 캐시를 갱신합니다. 대시보드의 자체 상태도 다시 조회합니다.
  // 검색어는 유지하고 각 할 일 목록은 첫 페이지로 갱신해 오래된 커서를 재사용하지 않습니다.
  const refreshDashboard = useCallback(() => {
    refreshingGoals.current = true;
    moreGoalsRequest.current?.abort();
    moreGoalsRequest.current = null;
    setIsLoadingMoreGoals(false);
    setMoreGoalsError(false);
    setRefreshVersion((version) => version + 1);
    goals.forEach((goal) => {
      const keyword = goalKeywords.current.get(goal.id);
      loadGoalFirstPage(goal.id, keyword);
    });
  }, [goals, loadGoalFirstPage]);

  // GNB 모달은 레이아웃에 있으므로 생성 완료 알림을 받아 자체 목록도 갱신합니다.
  useEffect(() => {
    window.addEventListener('gnb:todo-created', refreshDashboard);
    window.addEventListener('gnb:goal-created', refreshDashboard);
    return () => {
      window.removeEventListener('gnb:todo-created', refreshDashboard);
      window.removeEventListener('gnb:goal-created', refreshDashboard);
    };
  }, [refreshDashboard]);

  // 같은 할 일이 최근 목록·목표 카드에 중복 표시되어도 두 위치를 함께 갱신합니다.
  const patchTodo = (id: number, patch: Partial<TodoItemData>) => {
    setRecentTodos((previous) =>
      previous.map((todo) => (todo.id === id ? { ...todo, ...patch } : todo)),
    );
    setTodosByGoal((previous) =>
      Object.fromEntries(
        Object.entries(previous).map(([key, state]) => [
          key,
          {
            ...state,
            todos: state.todos.map((todo) =>
              todo.id === id ? { ...todo, ...patch } : todo,
            ),
          },
        ]),
      ),
    );
  };

  const toggleTodo = async (
    id: number,
    field: 'done' | 'isFavorite',
    value: boolean,
  ) => {
    // 동일 항목의 연속 클릭으로 요청 순서가 뒤집히지 않도록 직전 요청을 기다립니다.
    if (pendingTodoIds.current.has(id)) return;
    pendingTodoIds.current.add(id);
    try {
      if (field === 'done')
        await doneMutation.mutateAsync({ todoId: id, done: value });
      else
        await favoriteMutation.mutateAsync({ todoId: id, isFavorite: value });
      patchTodo(id, { [field]: value });
      refreshDashboard();
    } catch {
      // 서버 성공 전까지 목록을 변경하지 않으므로 실패 시 기존 상태를 유지합니다.
      toast.error(
        t(field === 'done' ? 'toggleTodoDoneError' : 'toggleFavoriteError'),
      );
    } finally {
      pendingTodoIds.current.delete(id);
    }
  };
  const onToggleDone = (id: number, done: boolean) => {
    void toggleTodo(id, 'done', done);
  };
  const onToggleFavorite = (id: number, isFavorite: boolean) => {
    void toggleTodo(id, 'isFavorite', isFavorite);
  };

  const onDeleted = (id: number) => {
    setRecentTodos((previous) => previous.filter((todo) => todo.id !== id));
    setTodosByGoal((previous) =>
      Object.fromEntries(
        Object.entries(previous).map(([key, state]) => [
          key,
          {
            ...state,
            todos: state.todos.filter((todo) => todo.id !== id),
          },
        ]),
      ),
    );
    refreshDashboard();
  };

  return (
    // 이곳에 꼭 해당 컨텐츠 영역의 width를 추가해주세요
    <div className="lg:mx-auto lg:w-full lg:max-w-328">
      {/* 컨텐츠 마크업은 여기서 부터 */}
      <div>
        <h1 className="mb-7.5 text-xl font-semibold text-heading max-md:hidden lg:mb-8.5 lg:text-2xl">
          {userName ? `${userName}님의 대시보드` : '대시보드'}
        </h1>
      </div>

      <div className="md:flex md:flex-wrap md:gap-3 lg:gap-6">
        {/* 최근 등록한일 */}
        <RecentTodosCard
          labels={todoLabels}
          todos={recentTodos}
          isLoading={isLoadingRecentTodos}
          error={recentTodosError}
          onToggleDone={onToggleDone}
          onToggleFavorite={onToggleFavorite}
          onCopyLink={onCopyLink}
          onDelete={setDeleteTarget}
        />

        {/* 내 진행 상황 */}
        <TodoProgressCard
          userName={userName ?? ''}
          progress={displayProgress}
          isLoading={isLoadingProgress}
          error={progressError}
        />
      </div>

      <div className="mt-10 lg:mt-8.5">
        <h2 className="mr-auto inline-flex items-center text-base font-medium text-heading md:text-lg">
          <span className="mr-2 size-10">
            <Image src="/icons/icon_goal.svg" width={40} height={40} alt="" />
          </span>
          목표별 할일
        </h2>
        {isLoadingGoals ? (
          <DashboardLoading
            message="목표를 불러오는 중입니다."
            size="md"
            color="muted"
            className="mt-4 py-6"
          />
        ) : goalsError ? (
          <p role="alert" className="mt-4 text-center text-muted">
            목표를 불러오지 못했어요
          </p>
        ) : goals.length === 0 ? (
          <div className="mt-2.5 flex min-h-60 items-center justify-center rounded-[1.75rem] bg-white-section p-6 md:min-h-100 lg:rounded-[2.5rem]">
            <DashboardEmptyState message="최근에 등록한 목표가 없어요" />
          </div>
        ) : (
          <div className="mt-2.5">
            <ul className="space-y-6 lg:space-y-8">
              {goals.map((goal) => {
                // 아직 조회 결과가 없는 목표는 로딩 안내를 표시합니다.
                const pendingState = todosByGoal[`${goal.id}-false`];
                const completedState = todosByGoal[`${goal.id}-true`];
                const pendingTodos = pendingState?.todos ?? [];
                const completedTodos = completedState?.todos ?? [];
                // 양쪽 조회가 모두 성공한 뒤에만 통합 빈 상태를 표시합니다.
                const isGoalTodosEmpty =
                  pendingState &&
                  completedState &&
                  !pendingState.error &&
                  !completedState.error &&
                  pendingTodos.length === 0 &&
                  completedTodos.length === 0;
                // 검색·더보기로 표시된 개수가 아니라 목표 전체 개수로 진행률을 계산합니다.
                const goalProgress =
                  goal.todoCount === 0
                    ? 0
                    : Math.round((goal.completedCount / goal.todoCount) * 100);

                return (
                  <li key={goal.id}>
                    <div className="relative rounded-[1.75rem] bg-white-section p-4 after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:opacity-0 after:shadow-lg after:transition-opacity after:duration-300 after:ease-out after:content-[''] hover:after:opacity-100 motion-reduce:after:transition-none md:p-6 lg:rounded-[2.5rem] lg:p-8">
                      <div className="min-w-0">
                        {/* S: 목표 아이템 헤더 */}
                        <div className="relative flex flex-wrap items-center gap-3 md:flex-nowrap lg:grid lg:grid-cols-2 lg:gap-8">
                          <div className="w-[calc(100%-3.25rem)] min-w-0 md:w-auto md:flex-1 lg:flex lg:items-center lg:gap-4">
                            <h3 className="text-base font-semibold text-foreground lg:min-w-0 lg:basis-2/5">
                              {/* TODO: 담당자에게 목표 상세 경로를 확인한 뒤 goal.id로 연결합니다. */}
                              <Link
                                href="/"
                                className="rounded-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                              >
                                {goal.title}
                              </Link>
                            </h3>

                            <div className="mt-0.5 flex min-w-0 items-center gap-2 lg:mt-0 lg:flex-1">
                              {/* 프로그래스바 */}
                              <div className="min-w-0 flex-1">
                                <GoalProgressBar progress={goalProgress} />
                              </div>
                              <span
                                className={`w-[4ch] shrink-0 text-left text-sm font-bold whitespace-nowrap tabular-nums lg:text-base ${goalProgress === 0 ? 'text-grayscale-400' : 'text-orange-600'}`}
                              >
                                {goalProgress}%
                              </span>
                            </div>
                          </div>

                          <div className="flex w-full items-center gap-3 md:w-auto md:shrink-0 lg:min-w-0 lg:justify-end">
                            <SearchInput
                              size="sm"
                              onSearch={(query) =>
                                searchGoalTodos(goal.id, query)
                              }
                              onKeyDown={(event) => {
                                // 한글 조합을 확정하는 Enter는 검색으로 처리하지 않습니다.
                                if (event.nativeEvent.isComposing)
                                  event.preventDefault();
                              }}
                              aria-label={`${goal.title} 할 일 검색`}
                              placeholder="할 일을 검색해주세요"
                              className="md:w-52.5 xl:w-60"
                            />
                            <button
                              type="button"
                              aria-label="할 일 추가"
                              onClick={() =>
                                setCreateGoal({
                                  id: goal.id,
                                  title: goal.title,
                                })
                              }
                              className="absolute top-0 right-0 inline-flex size-10 shrink-0 items-center justify-center gap-1 rounded-full border border-solid border-orange-500 bg-transparent text-sm leading-none font-semibold text-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 md:static md:w-auto md:px-4"
                            >
                              <span
                                aria-hidden="true"
                                className="inline-flex size-5 shrink-0 items-center justify-center"
                              >
                                <Image
                                  src="/icons/icon_plus_orange.svg"
                                  width={20}
                                  height={20}
                                  alt=""
                                />
                              </span>
                              <span className="hidden md:inline">
                                할 일 추가
                              </span>
                            </button>
                          </div>
                        </div>
                        {/* E: 목표 아이템 헤더 */}

                        {!pendingState || !completedState ? (
                          <div
                            role="status"
                            className="mt-2.5 flex min-h-48 flex-col items-center justify-center gap-3 py-6 text-center text-muted md:min-h-64 lg:mt-6"
                          >
                            <span
                              aria-hidden="true"
                              className="size-6 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
                            />
                            <p className="text-sm font-medium md:text-base">
                              할 일을 불러오는 중입니다.
                            </p>
                          </div>
                        ) : isGoalTodosEmpty ? (
                          <div className="mt-2.5 flex min-h-48 items-center justify-center py-6 md:min-h-64 lg:mt-6">
                            <DashboardEmptyState
                              message={
                                pendingState.keyword || completedState.keyword
                                  ? '검색 결과가 없습니다.'
                                  : '등록된 할 일이 없어요'
                              }
                            />
                          </div>
                        ) : (
                          <div className="mt-2.5 grid gap-4 lg:mt-6 lg:grid-cols-2 lg:gap-8">
                            <div className="relative min-h-34 rounded-2xl bg-[#fff6df] p-4 lg:min-h-48 lg:p-6">
                              <p className="text-sm font-semibold tracking-[-0.03em] text-orange-600 lg:text-base">
                                TO DO
                              </p>
                              {pendingState.error ? (
                                <p
                                  role="alert"
                                  className="mt-4 text-center text-xs text-muted"
                                >
                                  할 일을 불러오지 못했어요
                                </p>
                              ) : pendingTodos.length > 0 ? (
                                <div className={goalTodoScrollClass}>
                                  <ul className="lg:space-y-1">
                                    {pendingTodos.map((todo) => (
                                      <TodoItem
                                        key={todo.id}
                                        todo={todo}
                                        labels={todoLabels}
                                        size="small"
                                        style="todo"
                                        className={goalTodoItemClass}
                                        kebabSlot={
                                          <span className={goalTodoKebabClass}>
                                            <TodoItemKebab
                                              isWhite
                                              onDelete={() =>
                                                setDeleteTarget(todo)
                                              }
                                            />
                                          </span>
                                        }
                                        showCreateNote={false}
                                        // 상세·노트 화면은 해당 기능 구현 후 연결합니다.
                                        onToggleDone={onToggleDone}
                                        onToggleFavorite={onToggleFavorite}
                                        onOpenDetail={() => undefined}
                                        onCopyLink={onCopyLink}
                                        onViewNote={() => undefined}
                                        onCreateNote={() => undefined}
                                      />
                                    ))}
                                  </ul>
                                </div>
                              ) : (
                                <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm font-medium text-muted md:text-base">
                                  {pendingState.keyword
                                    ? '검색 결과가 없습니다.'
                                    : '남은 할 일이 없어요'}
                                </p>
                              )}
                              {pendingState &&
                                !pendingState.error &&
                                pendingState.nextCursor !== null && (
                                  <div className="mt-4 text-center">
                                    {pendingState.loadMoreError && (
                                      <p
                                        role="alert"
                                        className="mb-2 text-sm text-muted"
                                      >
                                        추가 할 일을 불러오지 못했어요. 다시
                                        눌러주세요.
                                      </p>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        loadMoreGoalTodos(goal.id, false)
                                      }
                                      disabled={pendingState.isLoadingMore}
                                      aria-label={`${goal.title} TO DO 더보기`}
                                      aria-busy={pendingState.isLoadingMore}
                                      className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg px-4 text-sm font-medium text-orange-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-wait disabled:opacity-60"
                                    >
                                      {pendingState.isLoadingMore
                                        ? '불러오는 중입니다.'
                                        : '더보기'}
                                      <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        aria-hidden="true"
                                        className="size-6 shrink-0"
                                      >
                                        <path
                                          d="M17.293 9.29289C17.6835 8.90237 18.3165 8.90237 18.707 9.29289C19.0975 9.68342 19.0975 10.3164 18.707 10.707L12.707 16.707C12.3165 17.0975 11.6835 17.0975 11.293 16.707L5.29295 10.707C4.90243 10.3164 4.90243 9.68342 5.29295 9.29289C5.68348 8.90237 6.31649 8.90237 6.70702 9.29289L12 14.5859L17.293 9.29289Z"
                                          fill="currentColor"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                )}
                            </div>
                            <div className="flex min-h-20 flex-col p-4 lg:min-h-48 lg:p-6">
                              <p className="text-sm font-semibold tracking-[-0.03em] text-muted lg:text-base">
                                DONE
                              </p>
                              {completedState.error ? (
                                <p
                                  role="alert"
                                  className="mt-4 text-center text-xs text-muted"
                                >
                                  할 일을 불러오지 못했어요
                                </p>
                              ) : completedTodos.length > 0 ? (
                                <div className={goalTodoScrollClass}>
                                  <ul className="lg:space-y-1">
                                    {completedTodos.map((todo) => (
                                      <TodoItem
                                        key={todo.id}
                                        todo={todo}
                                        labels={todoLabels}
                                        size="small"
                                        style="todo"
                                        className={goalTodoItemClass}
                                        kebabSlot={
                                          <span className={goalTodoKebabClass}>
                                            <TodoItemKebab
                                              isWhite
                                              onDelete={() =>
                                                setDeleteTarget(todo)
                                              }
                                            />
                                          </span>
                                        }
                                        showCreateNote={false}
                                        // 상세·노트 화면은 해당 기능 구현 후 연결합니다.
                                        onToggleDone={onToggleDone}
                                        onToggleFavorite={onToggleFavorite}
                                        onOpenDetail={() => undefined}
                                        onCopyLink={onCopyLink}
                                        onViewNote={() => undefined}
                                        onCreateNote={() => undefined}
                                      />
                                    ))}
                                  </ul>
                                </div>
                              ) : (
                                <p className="mt-4 text-center text-sm font-medium text-muted md:text-base">
                                  {completedState.keyword
                                    ? '검색 결과가 없습니다.'
                                    : '완료한 할 일이 없어요'}
                                </p>
                              )}
                              {completedState &&
                                !completedState.error &&
                                completedState.nextCursor !== null && (
                                  <div className="mt-4 text-center">
                                    {completedState.loadMoreError && (
                                      <p
                                        role="alert"
                                        className="mb-2 text-sm text-muted"
                                      >
                                        추가 할 일을 불러오지 못했어요. 다시
                                        눌러주세요.
                                      </p>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        loadMoreGoalTodos(goal.id, true)
                                      }
                                      disabled={completedState.isLoadingMore}
                                      aria-label={`${goal.title} DONE 더보기`}
                                      aria-busy={completedState.isLoadingMore}
                                      className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg px-4 text-sm font-medium text-orange-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-wait disabled:opacity-60"
                                    >
                                      {completedState.isLoadingMore
                                        ? '불러오는 중입니다.'
                                        : '더보기'}
                                      <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        aria-hidden="true"
                                        className="size-6 shrink-0"
                                      >
                                        <path
                                          d="M17.293 9.29289C17.6835 8.90237 18.3165 8.90237 18.707 9.29289C19.0975 9.68342 19.0975 10.3164 18.707 10.707L12.707 16.707C12.3165 17.0975 11.6835 17.0975 11.293 16.707L5.29295 10.707C4.90243 10.3164 4.90243 9.68342 5.29295 9.29289C5.68348 8.90237 6.31649 8.90237 6.70702 9.29289L12 14.5859L17.293 9.29289Z"
                                          fill="currentColor"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            {nextGoalCursor !== null && (
              <div
                ref={goalSentinel}
                className="flex min-h-12 items-center justify-center py-4"
              >
                {isLoadingMoreGoals ? (
                  <p role="status" className="text-sm font-medium text-muted">
                    목표를 더 불러오는 중입니다.
                  </p>
                ) : moreGoalsError ? (
                  <div className="text-center">
                    <p role="alert" className="text-sm text-muted">
                      목표를 더 불러오지 못했어요.
                    </p>
                    <button
                      type="button"
                      onClick={loadMoreGoals}
                      className="mt-2 rounded-lg px-4 py-2 text-sm font-medium text-orange-600 focus-visible:outline-2 focus-visible:outline-orange-600"
                    >
                      다시 시도
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
      <TodoCreateModal
        isOpen={createGoal !== null}
        initialGoal={createGoal ?? undefined}
        onOpenChange={(open) => {
          if (!open) setCreateGoal(null);
        }}
        onCreated={refreshDashboard}
      />
      <DeleteTodoModal
        todo={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={onDeleted}
      />
    </div>
  );
}

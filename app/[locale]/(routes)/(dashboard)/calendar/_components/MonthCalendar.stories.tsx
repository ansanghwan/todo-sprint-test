import type { Decorator, Meta, StoryObj } from '@storybook/nextjs';
import type { AxiosAdapter } from 'axios';
import { fn } from 'storybook/test';

import { api } from '@/lib/api/client-fetcher';
import TestProviders from '@/test/TestProviders';
import { makeTodo } from '@/test/todoMocks';
import type { GoalPageDto } from '@/types/api/goal';
import type { TodoDto, TodoPageDto } from '@/types/api/todo';
import { toKstDateKey, type DateKey } from '../_lib/calendarDates';
import MonthCalendar from './MonthCalendar';

/** 대시보드 레이아웃 배경 위에 테스트용 Provider(번역·Query)를 붙입니다. */
const withCalendarPage: Decorator = (Story) => (
  <TestProviders>
    <div className="min-h-dvh bg-background px-4 pt-8 pb-4 md:p-6">
      <Story />
    </div>
  </TestProviders>
);

const dueOn = (dateKey: DateKey) => `${dateKey}T00:00:00.000Z`;

const GOALS = ['자바스크립트로 웹서비스 만들기', '디자인 시스템 정복하기'].map(
  (title, index) => ({
    id: index + 1,
    teamId: 'team',
    userId: 1,
    title,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    todoCount: 0,
    completedCount: 0,
  }),
);
const GOAL_PAGE: GoalPageDto = {
  goals: GOALS,
  nextCursor: null,
  totalCount: GOALS.length,
};

// Figma 2025년 1월 시안과 같은 배치: [마감일, 제목, 완료]
const FIGMA_TODOS = (
  [
    ['2024-12-31', '사용자 데이터 렌더링 구현', true],
    ['2025-01-03', '자바스크립트 기초 챕터1 듣기', true],
    ['2025-01-06', '개발 폴더 구조 세팅 (src, public, components)', false],
    ['2025-01-08', '자바스크립트 기초 챕터2 듣기', true],
    ['2025-01-08', 'JavaScript로 동적 인터랙션 추가', true],
    ['2025-01-08', '로그인/회원가입 폼 만들기', true],
    ['2025-01-08', '오류/로딩 상태 처리하기', false],
    ['2025-01-10', '자바스크립트 기초 챕터4 듣기', true],
    ['2025-01-10', '사용자 데이터 렌더링 구현', false],
    ['2025-01-10', '개발 폴더 구조 세팅 (src, public, components)', false],
    ['2025-01-11', '오류/로딩 상태 처리하기', true],
    ['2025-01-13', 'JSON 서버 또는 mock API 연동', false],
    ['2025-01-16', '반응형 레이아웃을 설계하고 미디어쿼리를 적용', false],
    ['2025-01-17', '자바스크립트 기초 챕터3 듣기', false],
    ['2025-01-21', '사용자 데이터 렌더링 구현', true],
    ['2025-01-22', '자바스크립트 기초 챕터6 듣기', false],
    ['2025-01-24', '자바스크립트 기초 챕터7 듣기', false],
    ['2025-01-27', '자바스크립트 기초 챕터8 듣기', false],
    ['2025-02-02', '오류/로딩 상태 처리하기', true],
  ] as const
).map(([dateKey, title, done], index) =>
  makeTodo(index + 1, {
    title,
    done,
    dueDate: dueOn(dateKey),
    goalId: GOALS[index % GOALS.length].id,
  }),
);

const JANUARY_DAY_COUNT = 31;
const MANY_TODO_COUNT = 130;
const MANY_TODOS = Array.from({ length: MANY_TODO_COUNT }, (_, index) => {
  const day = String((index % JANUARY_DAY_COUNT) + 1).padStart(2, '0');
  return makeTodo(index + 1, { dueDate: dueOn(`2025-01-${day}`) });
});

interface MockCalendarTodosApiOptions {
  todos: TodoDto[];
  /** 몇 번째 요청(0부터)을 실패시킬지 */
  failAt?: number;
  /** 응답을 보내지 않고 로딩 상태로 둡니다. */
  isPending?: boolean;
  delay?: number;
}

/**
 * axios adapter를 바꿔 GET /todos를 흉내 냅니다. from·to(KST)와 goalId로 거르고, cursor는 다음에 줄 할 일의 순번입니다.
 * GET /goals는 목표 필터용으로 항상 같은 목록을 줍니다.
 * 되돌리는 함수를 반환합니다.
 */
const mockCalendarTodosApi = ({
  todos,
  failAt,
  isPending = false,
  delay = 400,
}: MockCalendarTodosApiOptions) => {
  const originalAdapter = api.defaults.adapter;
  let requestCount = 0;

  const adapter: AxiosAdapter = async (config) => {
    if (config.url === '/goals') {
      const response = { status: 200, statusText: '', headers: {}, config };
      return { ...response, data: GOAL_PAGE };
    }

    const requestIndex = requestCount;
    requestCount += 1;

    if (isPending) {
      return new Promise(() => {});
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
    if (requestIndex === failAt) {
      return Promise.reject(new Error('mock network error'));
    }

    const { from, to, goalId, limit, cursor = 0 } = config.params;
    const todosInRange = todos.filter((todo) => {
      if (todo.dueDate === null) {
        return false;
      }
      if (goalId !== undefined && todo.goalId !== goalId) {
        return false;
      }
      const dateKey = toKstDateKey(todo.dueDate);
      return from <= dateKey && dateKey <= to;
    });
    const nextCursor = cursor + limit;
    const data: TodoPageDto = {
      todos: todosInRange.slice(cursor, nextCursor),
      nextCursor: nextCursor < todosInRange.length ? nextCursor : null,
      totalCount: todosInRange.length,
    };
    return { data, status: 200, statusText: '', headers: {}, config };
  };

  api.defaults.adapter = adapter;
  return () => {
    api.defaults.adapter = originalAdapter;
  };
};

const meta = {
  title: 'Calendar/MonthCalendar',
  component: MonthCalendar,
  parameters: { layout: 'fullscreen' },
  decorators: [withCalendarPage],
  args: { today: '2025-01-10', onAddTodo: fn(), onOpenTodo: fn() },
  // beforeEach가 돌려준 함수로 스토리를 떠날 때 mock API를 되돌립니다.
  beforeEach: () => mockCalendarTodosApi({ todos: FIGMA_TODOS }),
} satisfies Meta<typeof MonthCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  name: '기본 (데스크톱)',
};

export const Tablet: Story = {
  name: '태블릿 (칩)',
  globals: { viewport: { value: 'tablet' } },
};

export const Mobile: Story = {
  name: '모바일 (점 + 바텀시트)',
  globals: { viewport: { value: 'mobile2' } },
};

export const MoreThanOnePage: Story = {
  name: '100개 초과 (이어 받기)',
  beforeEach: () => mockCalendarTodosApi({ todos: MANY_TODOS, delay: 1000 }),
};

export const Loading: Story = {
  name: '불러오는 중',
  beforeEach: () =>
    mockCalendarTodosApi({ todos: FIGMA_TODOS, isPending: true }),
};

export const FirstPageError: Story = {
  name: '첫 요청 실패',
  beforeEach: () => mockCalendarTodosApi({ todos: FIGMA_TODOS, failAt: 0 }),
};

export const NextPageError: Story = {
  name: '이어 받기 실패',
  beforeEach: () => mockCalendarTodosApi({ todos: MANY_TODOS, failAt: 1 }),
};

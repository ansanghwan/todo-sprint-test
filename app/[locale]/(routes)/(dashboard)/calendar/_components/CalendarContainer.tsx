'use client';

import { useSyncExternalStore } from 'react';

import useGoalFilter from '../_hooks/useGoalFilter';
import { toKstDateKey } from '../_lib/calendarDates';
import MonthCalendar from './MonthCalendar';

const notConnected = () => {};
const subscribeToNothing = () => () => {};
const getToday = () => toKstDateKey(new Date());
const getServerToday = () => null;

interface CalendarContainerProps {
  // TODO: [2026.10.01] onAddTodo, onOpenTodo 콜백 주입하기
  /** 할 일 생성 모달 열기 (FN-CL-12). 생성 모달이 생기면 연결합니다. */
  onAddTodo?: () => void;
  /** 할 일 상세 모달 열기 (FN-CL-11). 상세 모달이 생기면 연결합니다. */
  onOpenTodo?: (todoId: number) => void;
}

const CalendarContainer = ({
  onAddTodo = notConnected,
  onOpenTodo = notConnected,
}: CalendarContainerProps) => {
  // 정적으로 프리렌더되는 페이지라 서버에서 오늘을 구하면 빌드 날짜가 HTML에 남습니다.
  // 오늘(KST)은 브라우저에서만 구하고, 그 전에는 달력을 그리지 않습니다.
  const today = useSyncExternalStore(
    subscribeToNothing,
    getToday,
    getServerToday,
  );
  const { selectedGoalId, selectGoal } = useGoalFilter();

  if (today === null) {
    return null;
  }

  return (
    <MonthCalendar
      today={today}
      selectedGoalId={selectedGoalId}
      onSelectGoal={selectGoal}
      onAddTodo={onAddTodo}
      onOpenTodo={onOpenTodo}
    />
  );
};

export default CalendarContainer;

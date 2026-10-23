'use client';

import { useSyncExternalStore } from 'react';

import useGoalFilter from '../_hooks/useGoalFilter';
import { toKstDateKey } from '../_lib/calendarDates';
import MonthCalendar from './MonthCalendar';

const subscribeToNothing = () => () => {};
const getToday = () => toKstDateKey(new Date());
const getServerToday = () => null;

const CalendarContainer = () => {
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
    />
  );
};

export default CalendarContainer;

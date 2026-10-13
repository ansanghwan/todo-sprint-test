'use client';

import { Tabs } from 'radix-ui';
import { useState } from 'react';

import TodoStatusTabs from '../../todos/_components/TodoStatusTabs';
import type { TodoStatus } from '../../todos/_components/todoListParams';
import FavoriteGoalFilter from './FavoriteGoalFilter';
import FavoritesHeader from './FavoritesHeader';
import FavoriteTodoList from './FavoriteTodoList';
import type { FavoriteGoalFilterValue } from './filterFavoriteTodos';

/**
 * 찜한 할 일 화면 (FN-FV-01~06). Figma 4:11196(PC), 4:11279(태블릿), 4:11359(모바일)
 * 찜 목록은 한 번 전부 받아 두고, 탭과 목표 필터는 화면에서 거릅니다.
 */
const FavoritesView = () => {
  const [status, setStatus] = useState<TodoStatus>('all');
  const [goalId, setGoalId] = useState<FavoriteGoalFilterValue>('all');

  return (
    <div className="mx-auto flex w-full max-w-180 flex-col gap-6">
      <FavoritesHeader />
      <Tabs.Root
        value={status}
        onValueChange={(value) => setStatus(value as TodoStatus)}
        className="flex flex-col gap-3"
      >
        <div className="flex items-center px-2">
          <TodoStatusTabs />
        </div>
        <Tabs.Content
          value={status}
          className="flex min-h-160 flex-col gap-4 rounded-3xl bg-white p-4 focus-visible:outline-2 focus-visible:outline-orange-600 md:gap-5 md:rounded-4xl md:p-8"
        >
          <FavoriteGoalFilter value={goalId} onChange={setGoalId} />
          <FavoriteTodoList status={status} goalId={goalId} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};

export default FavoritesView;

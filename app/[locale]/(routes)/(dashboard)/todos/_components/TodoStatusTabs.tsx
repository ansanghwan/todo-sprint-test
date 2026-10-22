'use client';

import { useTranslations } from 'next-intl';
import { Tabs } from 'radix-ui';

import { TODO_STATUS_TABS } from './todoListParams';

/**
 * ALL / TO DO / DONE 탭 버튼. Tabs.Root 안에서만 씁니다.
 * 좌우 방향키 이동은 Radix Tabs가 처리합니다.
 */
const TodoStatusTabs = () => {
  const t = useTranslations('Todo');

  return (
    <Tabs.List aria-label={t('todoStatusTabs')} className="flex md:gap-2">
      {TODO_STATUS_TABS.map(({ value, labelKey }) => (
        <Tabs.Trigger
          key={value}
          value={value}
          className="cursor-pointer rounded-2xl px-4 py-2 text-base/6 font-bold tracking-[-0.03em] text-grayscale-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-300"
        >
          {t(labelKey)}
        </Tabs.Trigger>
      ))}
    </Tabs.List>
  );
};

export default TodoStatusTabs;

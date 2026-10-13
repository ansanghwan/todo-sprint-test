'use client';

import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { goalQueries } from '@/queries/goal';

interface NoteGoalBannerProps {
  goalId: number;
}

/** 목표별 노트 모아보기 상단의 목표 이름 배너 */
export default function NoteGoalBanner({ goalId }: NoteGoalBannerProps) {
  const { data: goal, isError } = useQuery(goalQueries.detail(goalId));

  return (
    <div className="mb-2.5 flex w-full flex-row flex-nowrap items-center rounded-[1.75rem] bg-orange-100 p-10">
      <Image
        src="/icons/img_goal.svg"
        width={40}
        height={40}
        alt=""
        className="mr-6"
      />
      <h3 className="text-2xl font-semibold">
        {isError ? '목표를 찾을 수 없어요' : (goal?.title ?? '')}
      </h3>
    </div>
  );
}

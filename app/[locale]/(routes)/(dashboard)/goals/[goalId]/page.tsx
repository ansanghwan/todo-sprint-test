'use client';

import useCurrentUser from '@/hooks/useCurrentUser';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { goalQueries } from '@/queries/goal';
import ProgressChart from '@/components/dashboard/ProgressChart';
import { Link } from '@/i18n/navigation';
import GoalTitleCard from '@/components/goal/GoalTitleCard';
import Image from 'next/image';
import Button from '@/components/ui/button/Button';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardEmptyState from '@/components/dashboard/DashboardEmptyState';
export default function GoalDetailPage() {
  const goalSecTitle = 'text-base font-semibold text-heading md:text-lg';
  const { userName } = useCurrentUser();

  const { goalId } = useParams<{ goalId: string }>();
  const id = Number(goalId);

  const {
    data: goal,
    isPending,
    isError,
  } = useQuery({
    ...goalQueries.detail(id),
    enabled: Number.isInteger(id) && id > 0,
  });

  if (!Number.isInteger(id) || id <= 0) {
    return <p role="alert">올바르지 않은 목표 주소입니다.</p>;
  }

  if (isPending) {
    return (
      <DashboardLoading
        message="목표를 불러오는 중입니다."
        color="foreground"
        className="min-h-48"
      />
    );
  }

  if (isError || !goal) {
    return <DashboardEmptyState message="목표를 불러오지 못했습니다." />;
  }
  return (
    // 이곳에 꼭 해당 컨텐츠 영역의 width를 추가해주세요
    <div className="lg:mx-auto lg:w-full lg:max-w-328">
      {/* 컨텐츠 마크업은 여기서 부터 */}
      <div>
        <h1 className="mb-7.5 text-xl font-semibold text-heading max-md:hidden lg:mb-8.5 lg:text-2xl">
          {userName ? `${userName}님의 목표` : '목표'}
        </h1>
      </div>
      {/* 사이드바가 펼쳐진 중간 PC 폭에서는 제목과 카드 묶음을 각각 한 줄로 배치합니다. */}
      <div className="max-md:space-y-4 md:grid md:gap-6 lg:gap-8 xl:grid-cols-2 lg:max-[93.75rem]:[aside[data-open=false]~main_&]:grid-cols-1">
        <GoalTitleCard key={goal.id} goal={goal} />
        <div className="min-w-0">
          <div className="gap-6 md:grid md:grid-cols-2 md:gap-5">
            <div className="relative isolate flex aspect-[343/160] min-w-0 items-end overflow-hidden rounded-[1.75rem] bg-orange-500 text-white shadow-[0_0.625rem_2.5rem_0_#FF9E594D] max-md:mb-4 md:aspect-auto md:h-40 md:rounded-[2rem] md:pb-[2.1875rem]">
              <div className="absolute top-1/2 left-0 z-10 flex w-full -translate-y-1/2 items-center gap-7.5 px-6">
                <ProgressChart
                  progress={10}
                  trackColor="var(--color-orange-400)"
                  strokeWidth={16}
                  className="aspect-square w-[calc((100%+2.5rem)*0.268222)] shrink-0 md:size-23"
                />
                <div className="min-w-0 text-white">
                  <p className="text-lg font-bold">목표진행도</p>
                  <p className="flex items-baseline">
                    <span className="text-display-lg leading-none font-bold">
                      10
                    </span>
                    <span className="ml-1 text-xl leading-none font-semibold">
                      %
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/notes"
              className="relative isolate flex aspect-[343/160] min-w-0 items-end overflow-hidden rounded-[1.75rem] bg-blue-200 pb-8 pl-10 text-white shadow-[0_0.625rem_2.5rem_0_#00D4BE3D] before:pointer-events-none before:absolute before:top-1/2 before:right-4.5 before:aspect-square before:w-[30%] before:-translate-y-1/2 before:bg-[url('/images/goal/img_note.png')] before:bg-contain before:bg-center before:bg-no-repeat before:opacity-45 before:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 md:aspect-auto md:h-40 md:rounded-[2rem] md:pb-[2.1875rem] md:before:size-[6.0625rem]"
            >
              <span className="relative z-10 inline-flex items-center gap-1.5 text-2xl font-bold">
                노트 모아보기
                <Image
                  src="/icons/icon_arrow_right.svg"
                  width={8}
                  height={14}
                  alt=""
                  className="h-3.5 w-2 shrink-0"
                />
              </span>
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-12 md:mt-16 lg:flex lg:flex-wrap lg:gap-8">
        <div className="flex-1">
          <div className="mb-2.5 flex flex-wrap items-center">
            <div className="mr-auto flex-1">
              <h3 className={goalSecTitle}>TO DO</h3>
            </div>
            <div className="ml-auto">
              <Button
                variant="neutral"
                size="sm"
                className="w-30 gap-1 tracking-[-0.03em]"
              >
                <Image
                  src="/icons/icon_calendar.svg"
                  width={20}
                  height={20}
                  alt=""
                />
                캘린더 보기
              </Button>
              <Button size="sm" className="ml-2 w-30 gap-1 tracking-[-0.03em]">
                <Image
                  src="/icons/icon_plus_white.svg"
                  width={20}
                  height={20}
                  alt=""
                />
                할일 추가
              </Button>
            </div>
          </div>

          <div className="relative min-h-34 rounded-2xl bg-[#fff6df] p-4 lg:min-h-48 lg:p-6">
            <ul>
              <li></li>
            </ul>
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-2.5">
            <h3 className={goalSecTitle}>DONE</h3>
          </div>
          <div className="relative min-h-34 rounded-2xl bg-white-section p-4 lg:min-h-48 lg:p-6">
            <ul>
              <li>ddd</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

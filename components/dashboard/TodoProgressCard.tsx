import Image from 'next/image';
import ProgressChart from '@/components/dashboard/ProgressChart';
import DashboardLoading from '@/components/dashboard/DashboardLoading';

type TodoProgressCardProps = {
  userName: string;
  progress: number;
  isLoading: boolean;
  error: boolean;
};

/** 조회 상태와 계산된 진행률을 받아 차트와 안내를 표시합니다. */
export default function TodoProgressCard({
  userName,
  progress,
  isLoading,
  error,
}: TodoProgressCardProps) {
  return (
    <div className="min-w-0 max-md:mt-10 md:flex-1 lg:flex-[1_1_28rem]">
      <div className="mb-2.5 flex flex-wrap px-2">
        <h2 className="mr-auto inline-flex items-center text-base font-medium text-heading md:text-lg">
          <span className="mr-2 inline-flex size-8 items-center justify-center rounded-lg bg-blue-100">
            <Image src="/icons/icon_chart.svg" width={16} height={21} alt="" />
          </span>{' '}
          내 진행 상황
        </h2>{' '}
      </div>

      <div className="relative isolate aspect-[343/186] w-full overflow-hidden rounded-[1.75rem] bg-blue-200 shadow-[0_0.625rem_2.5rem_0_#00D4BE3D] before:pointer-events-none before:absolute before:top-[55%] before:right-0 before:z-0 before:block before:aspect-[218/154] before:w-[44%] before:bg-[url('/images/dashboard/bg-chart.svg')] before:bg-cover before:opacity-45 before:content-[''] md:aspect-auto md:h-[11.625rem] md:before:top-[41%] md:before:right-[0] lg:h-64 lg:rounded-[2.5rem] lg:before:top-[6.2rem] lg:before:w-[13.875rem]">
        {/* 장식용 문어 일러스트는 ::before 배경 레이어로 처리합니다. */}

        {isLoading ? (
          <DashboardLoading message="진행률을 불러 오는 중입니다" />
        ) : error ? (
          <div
            role="alert"
            className="relative z-10 flex h-full items-center justify-center text-base font-semibold text-white"
          >
            <p>진행 상황을 불러오지 못했어요</p>
          </div>
        ) : (
          <div className="absolute top-1/2 left-0 z-10 flex w-full -translate-y-1/2 items-center gap-5 px-6 lg:gap-8 lg:px-10">
            <ProgressChart
              progress={progress}
              className="aspect-square w-[31.2%] shrink-0 lg:size-40 lg:w-40"
            />

            <div className="min-w-0 text-white">
              <p className="text-sm font-semibold lg:text-xl">
                {userName ? `${userName}님의 진행도는` : '내 진행 상황'}
              </p>
              <p className="flex items-baseline">
                <span className="text-display-lg leading-none font-bold lg:text-display-xl">
                  {progress}
                </span>
                <span className="ml-1 text-xl leading-none font-medium lg:text-3xl">
                  %
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import Image from 'next/image';

type DashboardEmptyStateProps = {
  /** 목표 없음, 할 일 없음, 검색 결과 없음 등 상황에 맞는 문구입니다. */
  message: string;
};

/** 배경과 영역 높이는 사용하는 페이지에서 정합니다. */
export default function DashboardEmptyState({
  message,
}: DashboardEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <Image
        src="/images/dashboard/img_result_none.svg"
        width={131}
        height={140}
        alt=""
        className="h-auto w-[79px] md:w-32.5"
      />
      <p className="text-sm font-medium text-muted md:text-base">{message}</p>
    </div>
  );
}

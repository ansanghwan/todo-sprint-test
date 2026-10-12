'use client';

import { useEffect, useState } from 'react';

/** 목표 카드가 처음 나타날 때 0%부터 채웁니다. 검색 재렌더링에는 반복하지 않습니다. */
export default function GoalProgressBar({ progress }: { progress: number }) {
  // 막대가 영역 밖으로 늘어나지 않도록 표시 범위를 0~100으로 제한합니다.
  const percentage = Math.min(100, Math.max(0, progress));
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    let nextFrame = 0;
    // 0% 상태가 먼저 그려진 다음 실제 너비로 전환합니다.
    const firstFrame = requestAnimationFrame(() => {
      nextFrame = requestAnimationFrame(() => setDisplayProgress(percentage));
    });
    // 카드가 사라지거나 진행률이 바뀌면 예약된 이전 프레임을 취소합니다.
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(nextFrame);
    };
  }, [percentage]);

  return (
    <div
      role="progressbar"
      aria-label={`목표 진행률 ${percentage}%`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percentage}
      className="relative h-2 w-full overflow-hidden rounded-full bg-grayscale-200"
    >
      <span
        className="absolute top-0 left-0 h-full rounded-full bg-orange-500 transition-[width] duration-700 ease-out motion-reduce:transition-none"
        style={{ width: `${displayProgress}%` }}
      />
    </div>
  );
}

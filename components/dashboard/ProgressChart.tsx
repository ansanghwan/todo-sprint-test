'use client';

import { useEffect, useState } from 'react';

// 선을 조정해도 바깥 지름은 기존 92px을 유지합니다.
const RADIUS = 39.9142;
const BACKGROUND_STROKE_WIDTH = 12.1716;
const PROGRESS_STROKE_WIDTH = 12.1716;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type ProgressChartProps = {
  progress: number;
  className?: string;
};

/**
 * 진행률 값에 따라 흰색 원호를 애니메이션합니다.
 * 실제 데이터 연동 시 progress에 0~100 사이의 숫자를 전달합니다.
 */
export default function ProgressChart({
  progress,
  className,
}: ProgressChartProps) {
  const safeProgress = Math.min(Math.max(progress, 0), 100);
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      setDisplayProgress(safeProgress);
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [safeProgress]);

  const strokeDashoffset = CIRCUMFERENCE * (1 - displayProgress / 100);

  return (
    <svg
      viewBox="0 0 92 92"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* 12시 시작점은 유지하고, 시안과 같이 반시계 방향으로 진행합니다. */}
      <g transform="translate(92 0) scale(-1 1)">
        <circle
          cx="46"
          cy="46"
          r={RADIUS}
          stroke="#009D97"
          strokeWidth={BACKGROUND_STROKE_WIDTH}
        />
        <circle
          cx="46"
          cy="46"
          r={RADIUS}
          stroke="white"
          strokeWidth={PROGRESS_STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 46 46)"
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </g>
    </svg>
  );
}

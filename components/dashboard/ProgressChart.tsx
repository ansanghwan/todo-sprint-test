'use client';

import { useEffect, useState } from 'react';

// 선을 조정해도 바깥 지름은 기존 92px을 유지합니다.
const DEFAULT_STROKE_WIDTH = 12.1716;

type ProgressChartProps = {
  progress: number;
  className?: string;
  /** 카드 색에 맞는 원의 바탕색. 기본값은 대시보드 청록색입니다. */
  trackColor?: string;
  /** 92px viewBox 기준 선 두께. 바깥 지름은 유지합니다. */
  strokeWidth?: number;
};

/**
 * 진행률 값에 따라 흰색 원호를 애니메이션합니다.
 * 실제 데이터 연동 시 progress에 0~100 사이의 숫자를 전달합니다.
 */
export default function ProgressChart({
  progress,
  className,
  trackColor = '#009D97',
  strokeWidth = DEFAULT_STROKE_WIDTH,
}: ProgressChartProps) {
  const radius = (92 - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeProgress = Math.min(Math.max(progress, 0), 100);
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      setDisplayProgress(safeProgress);
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [safeProgress]);

  const strokeDashoffset = circumference * (1 - displayProgress / 100);

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
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx="46"
          cy="46"
          r={radius}
          stroke="white"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 46 46)"
          className="transition-[stroke-dashoffset] duration-300 ease-out"
        />
      </g>
    </svg>
  );
}

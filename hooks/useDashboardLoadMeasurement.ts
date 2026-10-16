'use client';

import { useEffect, useRef } from 'react';

const RESULT = 'dashboard:initial-data-visible';
const INVALID = 'dashboard:measurement-invalid';

/**
 * ?dashboardPerf=1로 직접 연 대시보드를 새로고침했을 때만 측정합니다.
 * 시간 원점은 문서 navigation 시작(0)입니다. React 반영 뒤 두 프레임을
 * 기다리는 표시 시점의 근사치이며, 픽셀이 실제 출력된 시각을 보장하지 않습니다.
 * 이미지·폰트·진행률 장식 애니메이션 종료는 측정 범위에 포함하지 않습니다.
 */
export default function useDashboardLoadMeasurement(
  ready: boolean,
  failed: boolean,
) {
  const active = useRef(false);

  useEffect(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as
      PerformanceNavigationTiming | undefined;
    if (
      new URLSearchParams(window.location.search).get('dashboardPerf') !==
        '1' ||
      navigation?.type !== 'reload' ||
      new URL(navigation.name).pathname !== window.location.pathname ||
      performance.getEntriesByName(RESULT).length > 0 ||
      performance.getEntriesByName(INVALID).length > 0
    )
      return;

    active.current = true;
    const invalidate = () => {
      if (!active.current) return;
      active.current = false;
      performance.mark(INVALID);
      console.warn(
        '[Dashboard 측정 제외] 탭 전환·사용자 조작 또는 데이터 조회 실패. 화면을 유지한 채 새로고침해 주세요.',
      );
    };
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') invalidate();
    };
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pointerdown', invalidate, { passive: true });
    window.addEventListener('keydown', invalidate);
    window.addEventListener('wheel', invalidate, { passive: true });
    window.addEventListener('touchstart', invalidate, { passive: true });
    return () => {
      active.current = false;
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointerdown', invalidate);
      window.removeEventListener('keydown', invalidate);
      window.removeEventListener('wheel', invalidate);
      window.removeEventListener('touchstart', invalidate);
    };
  }, []);

  useEffect(() => {
    if (!active.current) return;
    if (failed) {
      active.current = false;
      performance.mark(INVALID);
      console.warn(
        '[Dashboard 측정 제외] 데이터 조회 실패. 새로고침해 주세요.',
      );
      return;
    }
    if (!ready) return;

    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        if (!active.current) return;
        active.current = false;
        performance.mark(`${RESULT}:end`);
        const result = performance.measure(RESULT, {
          start: 0,
          end: `${RESULT}:end`,
        });
        console.info(
          `[Dashboard 측정] 초기 데이터 표시 시간: ${result.duration.toFixed(1)} ms`,
        );
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [ready, failed]);
}

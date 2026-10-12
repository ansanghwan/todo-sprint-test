'use client';

import useInfiniteScroll from '@/hooks/useInfiniteScroll';

interface GoalListSentinelProps {
  onIntersect: () => void;
}

/**
 * 목표 목록 맨 끝에 두는 감시 요소. 보이면 다음 페이지를 요청합니다.
 * 드롭다운이 열릴 때마다 요소가 새로 만들어지므로, 감시도 이 컴포넌트와 함께 시작하고 끝나게 분리했습니다.
 * 다음 페이지가 있고 요청 중이 아닐 때만 렌더링합니다.
 */
const GoalListSentinel = ({ onIntersect }: GoalListSentinelProps) => {
  const sentinelRef = useInfiniteScroll<HTMLDivElement>({
    enabled: true,
    onIntersect,
    // 드롭다운 안쪽 스크롤이라 화면 기준 여유는 두지 않습니다.
    rootMargin: '0px',
  });

  return <div ref={sentinelRef} aria-hidden="true" className="h-px" />;
};

export default GoalListSentinel;

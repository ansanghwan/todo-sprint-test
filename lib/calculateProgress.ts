/**
 * 전체 개수와 완료 개수로 정수 진행률을 계산합니다. API 요청 없이 받은 숫자만 사용합니다.
 * 항목이 없으면 0%, 조회 시점 차이로 개수가 어긋나더라도 결과는 0~100%로 제한합니다.
 */
export const calculateProgress = (
  totalCount: number,
  completedCount: number,
): number => {
  if (totalCount === 0) return 0;

  return Math.min(
    100,
    Math.max(0, Math.round((completedCount / totalCount) * 100)),
  );
};

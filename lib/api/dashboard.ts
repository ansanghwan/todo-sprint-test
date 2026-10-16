import { getTodos } from './todos';

/**
 * 최근 목록과 완료 개수를 동시에 조회합니다. 최근 목록의 totalCount를
 * 진행률 계산에도 사용하여 전체 개수 전용 요청을 생략합니다.
 * 두 영역은 각각 성공/실패를 표시할 수 있도록 별도 Promise를 반환합니다.
 */
export function getDashboardTodoData(signal?: AbortSignal) {
  const recentPage = getTodos({ sort: 'latest', limit: 4 }, signal);
  const donePage = getTodos({ limit: 1, done: 'true' }, signal);

  const recentTodos = recentPage.then((page) => page.todos);
  const progress = Promise.all([
    // 최근 목록만 실패한 경우에도 진행률 영역은 기존처럼 독립적으로 조회합니다.
    recentPage.catch((error: unknown) => {
      if (signal?.aborted) throw error;
      return getTodos({ limit: 1 }, signal);
    }),
    donePage,
  ]).then(([all, done]) => {
    if (all.totalCount === 0) return 0;
    return Math.min(
      100,
      Math.max(0, Math.round((done.totalCount / all.totalCount) * 100)),
    );
  });

  return { recentTodos, progress };
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { userQueries } from '@/queries/user';

/**
 * 로그인 사용자 표시용 공통 훅입니다. 앱의 QueryProvider 안에서 사용합니다.
 * 예: const { userName } = useCurrentUser();
 *
 * GNB·대시보드·목표 상세가 기존 사용자 쿼리의 캐시와 진행 중인 요청을 공유합니다.
 * 조회 전/실패 시 이름과 이메일은 undefined이므로 기본 문구는 각 화면에서 정합니다.
 * 페이지 접근 권한을 검사하거나 로그인 화면으로 이동시키는 훅은 아닙니다.
 */
export default function useCurrentUser() {
  const { data, isPending, isError } = useQuery(userQueries.me());

  return {
    userName: !isError ? data?.name.trim() : undefined,
    userEmail: !isError ? data?.email : undefined,
    isPending,
    isError,
  };
}

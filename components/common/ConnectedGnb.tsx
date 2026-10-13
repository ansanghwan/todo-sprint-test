'use client';

import GoalCreateModal from '@/components/goal/goal-create/GoalCreateModal';
import useCreateGoal from '@/hooks/goal/useCreateGoal';
import TodoCreateModal from '@/components/todo/todo-create/TodoCreateModal';
import Gnb, { type MenuId } from '@/components/common/Gnb';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { logout } from '@/lib/api/auth';
import { toast } from '@/components/ui/toast/Toaster';
import useCurrentUser from '@/hooks/useCurrentUser';

/**
 * 공통 Gnb에 로그인 사용자 정보와 현재 페이지 제목을 연결하는 컴포넌트입니다.
 * 특정 대시보드 페이지 전용이 아니라, Gnb를 사용하는 공통 레이아웃에서 사용합니다.
 *
 * 이곳에서는 useCurrentUser로 이름·이메일을 가져오고, 현재 경로에 맞는 제목을 만들어
 * props로 전달합니다. Gnb는 전달받은 내용을 표시하고 메뉴 열기·닫기 등 UI 동작을 담당합니다.
 * 데이터 조회와 화면 동작을 분리해 Gnb 안에 API 연결 코드가 늘어나지 않도록 합니다.
 *
 * 향후 목표 목록·알림 API도 이곳에서 연결해 Gnb에 전달할 수 있습니다(현재는 미연동).
 * 페이지 본문의 사용자 정보는 이 컴포넌트에서 전달하지 않으며,
 * 필요한 화면에서 useCurrentUser를 사용해 동일한 React Query 캐시를 공유합니다.
 */
export default function ConnectedGnb() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGoalCreateOpen, setIsGoalCreateOpen] = useState(false);
  const createGoal = useCreateGoal();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const loggingOut = useRef(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const handleLogout = async () => {
    if (loggingOut.current) return;
    loggingOut.current = true;
    setIsLoggingOut(true);
    try {
      await queryClient.cancelQueries();
      await logout();
      // 이전 계정의 조회 캐시를 지우고 현재 언어의 로그인 화면으로 이동합니다.
      queryClient.clear();
      router.replace('/login');
      router.refresh();
    } catch {
      toast.error('로그아웃하지 못했어요. 다시 시도해주세요.');
      loggingOut.current = false;
      setIsLoggingOut(false);
    }
  };
  const { userName, userEmail, userImage } = useCurrentUser();
  const page = pathname.split('/')[1];
  // 클릭 여부가 아닌 실제 경로로 선택하므로 직접 접속·새로고침·뒤로 가기에도 유지됩니다.
  const menus: Record<string, MenuId> = {
    dashboard: 'dashboard',
    goals: 'goal',
    calendar: 'calendar',
    posts: 'board',
    favorites: 'favorites',
    notes: 'notes',
  };
  // URL 첫 경로(키)에 맞는 모바일 헤더 제목(값)을 선택합니다. 페이지를 생성하는 설정은 아닙니다.
  const titles: Record<string, string> = {
    dashboard: userName ? `${userName}님의 대시보드` : '대시보드',
    goals: userName ? `${userName}님의 목표` : '목표',
    todos: '모든 할 일',
    calendar: '캘린더',
    posts: '소통 게시판',
    notes: '노트 모아보기',
    favorites: '찜한 할 일',
    mypage: '내 정보 관리',
  };
  return (
    <>
      <Gnb
        onCreateTodo={() => setIsCreateOpen(true)}
        onCreateGoal={() => setIsGoalCreateOpen(true)}
        onLogout={() => void handleLogout()}
        isLoggingOut={isLoggingOut}
        activeMenu={menus[page] ?? null}
        pageTitle={titles[page] ?? '슬리드 투두'}
        userName={userName || '사용자'}
        userEmail={userEmail}
        userImage={userImage}
        hasNotification={false}
      />
      <GoalCreateModal
        isOpen={isGoalCreateOpen}
        onOpenChange={setIsGoalCreateOpen}
        onSubmit={async (title) => {
          await createGoal.mutateAsync({ title });
          window.dispatchEvent(new Event('gnb:goal-created'));
        }}
      />
      <TodoCreateModal
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        // Query 캐시 외에 자체 상태로 관리하는 대시보드 목록에도 생성 완료를 알립니다.
        onCreated={() => window.dispatchEvent(new Event('gnb:todo-created'))}
      />
    </>
  );
}

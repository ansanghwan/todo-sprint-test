'use client';

import IconButton from '@/components/ui/button/IconButton';

export type NotificationButtonProps = {
  hasNotification?: boolean;
  onOpen?: () => void;
  compact?: boolean;
};

// 알림 아이콘·배지·클릭 연결은 이곳에서 공통으로 관리합니다.
// 각 위치에서 별도의 API 호출이나 로컬 알림 상태를 만들지 마세요.
// 부모가 같은 알림 데이터와 열기 함수를 전달하며, compact는 모양만 바꿉니다.
// 개발 연동: 공통 부모/알림 훅에서 읽지 않은 알림이 있는지 판단해 hasNotification을 전달합니다.
// 이 컴포넌트가 직접 true/false로 변경하지 않고, 받은 값을 IconButton에 그대로 전달합니다.
// true: IconButton이 주황색 점을 표시하고 접근성 이름에 "(새 알림 있음)"을 붙입니다.
// false: 주황색 점을 숨기고 접근성 이름은 "알림 열기"로 표시합니다.
// 읽음 처리 후 공통 데이터를 갱신하면 모든 위치의 버튼에 같은 값이 반영됩니다.
// 클릭(onOpen)은 알림 목록을 여는 동작이며, 이곳에서 임의로 읽음 처리하거나 점을 숨기지 않습니다.
export default function NotificationButton({
  hasNotification = false,
  onOpen,
  compact = false,
}: NotificationButtonProps) {
  return (
    <IconButton
      icon="bell"
      aria-label="알림 열기"
      hasNotification={hasNotification}
      onClick={onOpen}
      className={
        compact
          ? 'size-11 border-0 bg-transparent *:data-notification-dot:top-[0.7rem] *:data-notification-dot:right-[0.8rem] *:data-notification-dot:size-2'
          : undefined
      }
    />
  );
}

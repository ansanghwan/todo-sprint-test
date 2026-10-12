/** 알림 API(/{teamId}/notifications) 요청·응답 DTO입니다. 서버 스펙을 그대로 따릅니다. */

// ── 요청 ──
export interface GetNotificationsParams {
  cursor?: number;
  limit?: number;
}

export interface UpdateNotificationBodyDto {
  isRead: boolean;
}

// ── 응답 ──
export interface CommentNotificationDataDto {
  postTitle: string;
  commentContent: string;
  commentAuthor: string;
  userImage: string | null;
}

export interface TodoNotificationDataDto {
  todoTitle: string;
  goalTitle: string | null;
  userImage: string | null;
}

export interface GoalNotificationDataDto {
  goalTitle: string;
  totalTodos: number;
  userImage: string | null;
}

interface NotificationBaseDto {
  id: number;
  teamId: string;
  userId: number;
  message: string;
  isRead: boolean;
  resourceId: number | null;
  createdAt: string;
}

// data 구조가 type마다 달라 type으로 구분되는 union으로 둡니다.
export type NotificationDto =
  | (NotificationBaseDto & {
      type: 'comment';
      data?: CommentNotificationDataDto | null;
    })
  | (NotificationBaseDto & {
      type: 'todo';
      data?: TodoNotificationDataDto | null;
    })
  | (NotificationBaseDto & {
      type: 'goal';
      data?: GoalNotificationDataDto | null;
    });

export interface NotificationPageDto {
  notifications: NotificationDto[];
  nextCursor: number | null;
  totalCount: number;
}

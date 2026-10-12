import { useTranslations } from 'next-intl';

import { toast } from '@/components/ui/toast/Toaster';
import {
  useToggleTodoDone,
  useToggleTodoFavorite,
} from '@/queries/todoMutations';

/** 할 일을 보여주는 모든 화면에서 같은 동작을 하는 TodoItem 콜백 */
export interface TodoItemCommonActions {
  /** 완료 토글 (FN-TD-06) */
  onToggleDone: (todoId: number, done: boolean) => void;
  /** 찜 토글 (FN-TD-07) */
  onToggleFavorite: (todoId: number, isFavorite: boolean) => void;
  /** 링크 복사 (FN-TD-14) */
  onCopyLink: (linkUrl: string) => Promise<void>;
}

/**
 * 완료·찜 토글과 링크 복사만 담당합니다.
 * 상세 열기와 노트 보기·작성은 화면마다 연결 방식이 달라 사용하는 화면이 직접 넘깁니다.
 */
const useTodoItemActions = (): TodoItemCommonActions => {
  const t = useTranslations('Todo');
  const { mutate: toggleDone } = useToggleTodoDone();
  const { mutate: toggleFavorite } = useToggleTodoFavorite();

  const handleToggleDone = (todoId: number, done: boolean) => {
    toggleDone(
      { todoId, done },
      { onError: () => toast.error(t('toggleTodoDoneError')) },
    );
  };

  const handleToggleFavorite = (todoId: number, isFavorite: boolean) => {
    toggleFavorite(
      { todoId, isFavorite },
      { onError: () => toast.error(t('toggleFavoriteError')) },
    );
  };

  const handleCopyLink = async (linkUrl: string) => {
    try {
      await navigator.clipboard.writeText(linkUrl);
      toast.success(t('linkCopied'));
    } catch {
      toast.error(t('copyLinkError'));
    }
  };

  return {
    onToggleDone: handleToggleDone,
    onToggleFavorite: handleToggleFavorite,
    onCopyLink: handleCopyLink,
  };
};

export default useTodoItemActions;

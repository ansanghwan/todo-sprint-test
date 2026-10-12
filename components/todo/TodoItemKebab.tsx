'use client';

import { useTranslations } from 'next-intl';

import KebabMenu from '@/components/ui/kebab-menu/KebabMenu';

interface TodoItemKebabProps {
  /** 수정하기 (FN-TD-09). 넘기지 않으면 수정 메뉴를 그리지 않습니다. */
  onEdit?: () => void;
  onDelete: () => void;
  /** 어두운 배경(todo_white)용 흰 케밥 아이콘 */
  isWhite?: boolean;
}

/** 할 일 아이템의 케밥 메뉴: 수정하기 / 삭제하기 */
const TodoItemKebab = ({
  onEdit,
  onDelete,
  isWhite = false,
}: TodoItemKebabProps) => {
  const t = useTranslations('Todo');

  return (
    <KebabMenu
      isWhite={isWhite}
      ariaLabel={t('moreActions')}
      items={[
        ...(onEdit ? [{ label: t('edit'), onSelect: onEdit }] : []),
        { label: t('delete'), onSelect: onDelete },
      ]}
    />
  );
};

export default TodoItemKebab;

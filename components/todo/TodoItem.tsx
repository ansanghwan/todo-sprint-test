'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';

import {
  IconCheckboxActive,
  IconCheckboxActiveWhite,
  IconCheckboxInactive,
  IconCheckboxInactiveWhite,
  IconKebab,
  IconKebabWhite,
  IconLink,
  IconLinkWhite,
  IconNoteView,
  IconNoteViewWhite,
  IconNoteWrite,
  IconStarFilled,
  IconStarFilledWhite,
  IconStarOutline,
  IconStarOutlineWhite,
} from '@/components/icons';
import { cn, stopPropagation } from '@/lib/utils';
import type { TodoDto } from '@/types/api/todo';

/** 아이템 렌더링에 실제로 쓰는 필드만 좁힙니다. 응답 스펙이 바뀌면 여기서 타입 에러로 드러납니다. */
export type TodoItemData = Pick<
  TodoDto,
  'id' | 'title' | 'done' | 'noteIds' | 'linkUrl' | 'isFavorite'
>;

/**
 * 피그마 todo_list 컴포넌트(node 4:9638)의 변형을 따릅니다.
 * size  - large: 1920 / 744 (높이 44px), small: 375 (높이 36px)
 * style - todo: 밝은 배경용, white: 어두운 배경용(대시보드 상단 카드)
 * 색상 hex는 globals.css의 @theme 토큰이 정의되면 토큰 클래스로 교체합니다.
 */
const itemVariants = cva('flex w-full items-center', {
  variants: {
    size: {
      large: 'gap-2 px-2 py-2.5',
      small: 'gap-1.5 px-1 py-1.5',
    },
  },
  defaultVariants: { size: 'large' },
});

const titleVariants = cva(
  'min-w-0 flex-1 truncate text-left tracking-[-0.03em]',
  {
    variants: {
      size: {
        large: 'text-base',
        small: 'text-sm lg:text-base',
      },
      done: {
        true: 'text-grayscale-500',
        false: 'text-grayscale-800',
      },
      style: {
        todo: '',
        white: 'font-semibold',
      },
    },
    compoundVariants: [
      // white는 완료 여부와 무관하게 흰 글씨입니다.
      { style: 'white', done: true, class: 'text-white' },
      { style: 'white', done: false, class: 'text-white' },
    ],
    defaultVariants: { size: 'large', done: false, style: 'todo' },
  },
);

const iconGroupVariants = cva('flex h-6 shrink-0 items-center', {
  variants: {
    size: {
      large: 'gap-2',
      small: 'gap-1.5',
    },
  },
  defaultVariants: { size: 'large' },
});

export type TodoItemStyle = 'todo' | 'white';

/**
 * 아이콘 버튼의 접근성 이름. 상태는 aria-checked·aria-pressed로 전달하므로 이름은 상태와 무관하게 고정합니다.
 * 번역은 사용하는 화면이 넘깁니다 (hooks/todo/useTodoItemLabels).
 */
export interface TodoItemLabels {
  done: string;
  favorite: string;
  viewNote: string;
  writeNote: string;
  copyLink: string;
  moreActions: string;
}

export type TodoItemProps = VariantProps<typeof itemVariants> & {
  todo: TodoItemData;
  labels: TodoItemLabels;
  /** 배경 색 계열. white는 어두운 배경(대시보드 상단 카드)용입니다. */
  style?: TodoItemStyle;
  /** 완료 토글 (FN-TD-06). next는 토글 후의 값입니다. API 호출과 롤백은 페이지가 담당합니다. */
  onToggleDone: (id: number, next: boolean) => void;
  /** 찜 토글 (FN-TD-07). next는 토글 후의 값입니다. */
  onToggleFavorite: (id: number, next: boolean) => void;
  /** 아이템 클릭 시 상세 열기 (FN-TD-13) */
  onOpenDetail: (id: number) => void;
  /** 링크 복사 (FN-TD-14) */
  onCopyLink: (linkUrl: string) => void;
  /** 노트 보기 (FN-TD-11) */
  onViewNote: (noteId: number) => void;
  /** 노트 작성 진입 (FN-TD-12) */
  onCreateNote: (id: number) => void;
  /** 케밥 드롭다운 (FN-TD-09). 메뉴 항목이 페이지마다 달라 주입받습니다. */
  kebabSlot?: ReactNode;
  /** 더보기 버튼 노출 여부. 최근 등록한 일 카드처럼 메뉴가 없는 목록에서는 숨깁니다. */
  showKebab?: boolean;
  /** 노트가 없을 때 노트 작성 버튼을 표시할지 결정합니다. */
  showCreateNote?: boolean;
  className?: string;
};

export default function TodoItem({
  todo,
  labels,
  size = 'large',
  style = 'todo',
  onToggleDone,
  onToggleFavorite,
  onOpenDetail,
  onCopyLink,
  onViewNote,
  onCreateNote,
  kebabSlot,
  showKebab = true,
  showCreateNote = true,
  className,
}: TodoItemProps) {
  const hasNote = todo.noteIds.length > 0;
  const { linkUrl } = todo;
  const isWhite = style === 'white';

  const CheckboxIcon = todo.done
    ? isWhite
      ? IconCheckboxActiveWhite
      : IconCheckboxActive
    : isWhite
      ? IconCheckboxInactiveWhite
      : IconCheckboxInactive;
  const NoteViewIcon = isWhite ? IconNoteViewWhite : IconNoteView;
  const LinkIcon = isWhite ? IconLinkWhite : IconLink;
  const KebabIcon = isWhite ? IconKebabWhite : IconKebab;
  const StarIcon = todo.isFavorite
    ? isWhite
      ? IconStarFilledWhite
      : IconStarFilled
    : isWhite
      ? IconStarOutlineWhite
      : IconStarOutline;

  return (
    <li className={cn(itemVariants({ size }), className)}>
      <button
        type="button"
        role="checkbox"
        aria-checked={todo.done}
        aria-label={labels.done}
        onClick={stopPropagation(() => onToggleDone(todo.id, !todo.done))}
        className="shrink-0"
      >
        <CheckboxIcon className="size-[18px]" />
      </button>

      <button
        type="button"
        onClick={() => onOpenDetail(todo.id)}
        className={cn(
          titleVariants({ size, done: todo.done, style }),
          'cursor-pointer',
        )}
      >
        {todo.title}
      </button>

      <div className={iconGroupVariants({ size })}>
        {hasNote ? (
          <button
            type="button"
            aria-label={labels.viewNote}
            onClick={stopPropagation(() => onViewNote(todo.noteIds[0]))}
          >
            <NoteViewIcon className="size-6" />
          </button>
        ) : showCreateNote ? (
          <button
            type="button"
            aria-label={labels.writeNote}
            onClick={stopPropagation(() => onCreateNote(todo.id))}
          >
            <IconNoteWrite className="size-6" />
          </button>
        ) : null}

        {linkUrl ? (
          <button
            type="button"
            aria-label={labels.copyLink}
            onClick={stopPropagation(() => onCopyLink(linkUrl))}
          >
            <LinkIcon className="size-6" />
          </button>
        ) : null}

        {showKebab ? (
          <div className="flex" onClick={(event) => event.stopPropagation()}>
            {kebabSlot ?? (
              <button type="button" aria-label={labels.moreActions}>
                <KebabIcon className="size-6" />
              </button>
            )}
          </div>
        ) : null}

        <button
          type="button"
          aria-label={labels.favorite}
          aria-pressed={todo.isFavorite}
          onClick={stopPropagation(() =>
            onToggleFavorite(todo.id, !todo.isFavorite),
          )}
        >
          <StarIcon className="size-6" />
        </button>
      </div>
    </li>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import TagChip from '@/components/todo/todo-form/fields/TagChip';
import { getTagColor } from '@/components/todo/todo-form/tagColors';
import {
  formatDueDateForDisplay,
  toDueDateInput,
} from '@/components/todo/todo-form/todoFormValues';
import type { TodoDto } from '@/types/api/todo';

/** 값이 없을 때 표시합니다 (다른 화면에서 만든 목표·마감기한·태그 없는 할 일). */
const EMPTY_VALUE = '-';

interface InfoRowProps {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}

/** 아이콘 + 회색 라벨 + 값 한 줄. Figma Task modal (4:9960) */
const InfoRow = ({ icon, label, children }: InfoRowProps) => (
  <div className="flex items-center gap-2">
    <dt className="flex shrink-0 items-center gap-1 text-sm/5 font-medium tracking-[-0.03em] text-grayscale-400">
      {icon}
      {label}
    </dt>
    <dd className="min-w-0 flex-1 text-sm/5 tracking-[-0.03em] wrap-break-word text-foreground">
      {children}
    </dd>
  </div>
);

const MaterialIcon = ({ name }: { name: string }) => (
  <span
    aria-hidden="true"
    className="material-symbols-outlined mr-2 w-4.5 text-center text-[1.125rem]"
  >
    {name}
  </span>
);

interface TodoDetailContentProps {
  todo: TodoDto;
}

/**
 * 할 일 상세 본문 (FN-TD-41, 42). 제목·상태 칩은 모달 헤더가 그립니다.
 * 링크와 이미지가 둘 다 없으면 첨부자료 영역을 숨깁니다.
 * 작성된 노트(FN-TD-43)는 노트 담당과 연결 방식을 정할 때까지 보류합니다.
 */
const TodoDetailContent = ({ todo }: TodoDetailContentProps) => {
  const t = useTranslations('Todo');
  const dueDate = formatDueDateForDisplay(toDueDateInput(todo.dueDate));
  const hasAttachments = Boolean(todo.linkUrl || todo.fileUrl);

  return (
    <>
      <dl className="flex flex-col gap-4">
        <InfoRow icon={<MaterialIcon name="flag" />} label={t('goal')}>
          {todo.goal?.title ?? EMPTY_VALUE}
        </InfoRow>
        <InfoRow
          icon={<MaterialIcon name="calendar_today" />}
          label={t('dueDate')}
        >
          {dueDate || EMPTY_VALUE}
        </InfoRow>
        <InfoRow
          icon={
            <span
              aria-hidden="true"
              className="w-4.25 text-center text-base/6 font-semibold"
            >
              #
            </span>
          }
          label={t('tag')}
        >
          {todo.tags.length > 0 ? (
            <ul className="flex flex-wrap gap-1">
              {todo.tags.map((tag, index) => (
                <TagChip
                  key={tag.id}
                  label={tag.name}
                  color={getTagColor(index)}
                />
              ))}
            </ul>
          ) : (
            EMPTY_VALUE
          )}
        </InfoRow>
      </dl>

      {hasAttachments && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm/5 font-semibold tracking-[-0.03em] text-foreground md:text-base/6">
            {t('attachments')}
          </h3>
          <div className="flex flex-col gap-3">
            {todo.linkUrl && (
              <a
                href={todo.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-1 text-base/6 tracking-[-0.02em] break-all text-foreground underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-orange-600"
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[1.5rem] text-grayscale-500"
                >
                  link
                </span>
                {todo.linkUrl}
              </a>
            )}
            {todo.fileUrl && (
              // 업로드 서버의 URL이라 next/image 최적화 대상이 아닙니다.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={todo.fileUrl}
                alt={t('attachedImage')}
                className="aspect-408/223 w-full rounded-2xl border border-grayscale-200 object-cover"
              />
            )}
          </div>
        </section>
      )}
    </>
  );
};

export default TodoDetailContent;

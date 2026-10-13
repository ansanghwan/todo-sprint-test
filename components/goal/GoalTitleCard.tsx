'use client';

import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useId, useRef, useState } from 'react';

import Button from '@/components/ui/button/Button';
import ConfirmModal from '@/components/ui/ConfirmModal';
import KebabMenu from '@/components/ui/kebab-menu/KebabMenu';
import TextField from '@/components/ui/textfield/TextField';
import { toast } from '@/components/ui/toast/Toaster';
import { useRouter } from '@/i18n/navigation';
import { deleteGoal, updateGoal } from '@/lib/api/goals';
import { goalKeys } from '@/queries/goal';
import { todoKeys } from '@/queries/todo';
import type { GoalDetailDto } from '@/types/api/goal';

export default function GoalTitleCard({ goal }: { goal: GoalDetailDto }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const inputId = useId();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(goal.title);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const busy = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmedTitle = title.trim();
  const error = !trimmedTitle
    ? '목표명을 입력해주세요.'
    : title.length > 100
      ? '목표명은 100자 이내로 입력해주세요.'
      : undefined;

  const cancelEdit = () => {
    if (busy.current) return;
    setTitle(goal.title);
    setIsEditing(false);
  };
  const save = async () => {
    if (error || busy.current) return;
    if (trimmedTitle === goal.title) {
      cancelEdit();
      return;
    }
    busy.current = true;
    setIsPending(true);
    try {
      await queryClient.cancelQueries({ queryKey: goalKeys.detail(goal.id) });
      const updated = await updateGoal(goal.id, { title: trimmedTitle });
      queryClient.setQueryData<GoalDetailDto>(
        goalKeys.detail(goal.id),
        (previous) => ({ ...(previous ?? goal), ...updated }),
      );
      void queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: todoKeys.all });
      setIsEditing(false);
    } catch {
      toast.error('목표를 수정하지 못했어요. 다시 시도해주세요.');
    } finally {
      busy.current = false;
      setIsPending(false);
    }
  };
  const remove = async () => {
    if (busy.current) return;
    busy.current = true;
    setIsPending(true);
    try {
      await deleteGoal(goal.id);
      void queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: todoKeys.all });
      setIsDeleteOpen(false);
      router.replace('/dashboard');
    } catch {
      toast.error('목표를 삭제하지 못했어요. 다시 시도해주세요.');
    } finally {
      busy.current = false;
      setIsPending(false);
    }
  };

  return (
    <>
      <div className="flex w-full min-w-0 items-center gap-3 rounded-2xl bg-white-section p-4 md:rounded-3xl md:p-6 lg:gap-4 lg:rounded-[2rem] lg:py-15 lg:pr-12 lg:pl-10">
        <Image
          src="/icons/icon_goal.svg"
          width={40}
          height={40}
          alt=""
          className="size-10 shrink-0"
        />
        {isEditing ? (
          <form
            className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                cancelEdit();
              }
            }}
          >
            <div className="min-w-0 basis-full md:flex-1 md:basis-0 [&_label]:sr-only">
              <TextField
                ref={inputRef}
                id={inputId}
                label="목표명"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={isPending}
                error={error}
                aria-required="true"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                size="md"
                className="w-auto"
                disabled={Boolean(error) || isPending}
              >
                저장
              </Button>
              <Button
                size="md"
                variant="neutral"
                className="w-auto"
                disabled={isPending}
                onClick={cancelEdit}
              >
                취소
              </Button>
            </div>
          </form>
        ) : (
          <>
            <h2 className="min-w-0 flex-1 truncate text-base font-semibold tracking-[-0.03em] text-heading md:text-xl lg:text-2xl">
              {goal.title}
            </h2>
            <KebabMenu
              ariaLabel="목표 더보기"
              items={[
                {
                  label: '수정하기',
                  onSelect: () => {
                    setTitle(goal.title);
                    setIsEditing(true);
                    requestAnimationFrame(() => {
                      inputRef.current?.focus();
                      inputRef.current?.select();
                    });
                  },
                },
                { label: '삭제하기', onSelect: () => setIsDeleteOpen(true) },
              ]}
            />
          </>
        )}
      </div>
      <ConfirmModal
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="정말 삭제하시겠어요?"
        description="삭제된 목표는 복구할 수 없습니다."
        isPending={isPending}
        onConfirm={() => void remove()}
      />
    </>
  );
}

'use client';

import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
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
  const nextIntlTodo = useTranslations('Todo');
  const nextIntlGoalDetail = useTranslations('GoalDetail');
  const nextIntlGoalCreate = useTranslations('GoalCreate');
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
    ? nextIntlGoalCreate('required')
    : title.length > 100
      ? nextIntlGoalCreate('tooLong')
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
      toast.error(nextIntlGoalDetail('updateError'));
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
      toast.error(nextIntlGoalDetail('deleteError'));
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
                label={nextIntlGoalCreate('title')}
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
                {nextIntlGoalDetail('save')}
              </Button>
              <Button
                size="md"
                variant="neutral"
                className="w-auto"
                disabled={isPending}
                onClick={cancelEdit}
              >
                {nextIntlTodo('cancel')}
              </Button>
            </div>
          </form>
        ) : (
          <>
            <h2 className="min-w-0 flex-1 truncate text-base font-semibold tracking-[-0.03em] text-heading md:text-xl lg:text-2xl">
              {goal.title}
            </h2>
            <KebabMenu
              ariaLabel={nextIntlGoalDetail('moreActions')}
              items={[
                {
                  label: nextIntlTodo('edit'),
                  onSelect: () => {
                    setTitle(goal.title);
                    setIsEditing(true);
                    requestAnimationFrame(() => {
                      inputRef.current?.focus();
                      inputRef.current?.select();
                    });
                  },
                },
                {
                  label: nextIntlTodo('delete'),
                  onSelect: () => setIsDeleteOpen(true),
                },
              ]}
            />
          </>
        )}
      </div>
      <ConfirmModal
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={nextIntlGoalDetail('deleteConfirm')}
        description={nextIntlGoalDetail('deleteWarning')}
        cancelLabel={nextIntlTodo('cancel')}
        confirmLabel={nextIntlTodo('confirm')}
        isPending={isPending}
        onConfirm={() => void remove()}
      />
    </>
  );
}

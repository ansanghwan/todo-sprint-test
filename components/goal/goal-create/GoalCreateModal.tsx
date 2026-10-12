'use client';

import { useTranslations } from 'next-intl';
import { useId, useRef, useState } from 'react';

import { fieldBoxVariants } from '@/components/todo/todo-form/fieldStyles';
import FieldLayout from '@/components/todo/todo-form/fields/FieldLayout';
import Button from '@/components/ui/button/Button';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Modal from '@/components/ui/Modal';
import ModalHeader from '@/components/ui/ModalHeader';
import TextField from '@/components/ui/textfield/TextField';
import { toast } from '@/components/ui/toast/Toaster';
import useCloseConfirm from '@/hooks/useCloseConfirm';
import { cn } from '@/lib/utils';

export interface GoalCreateModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** 생성 요청을 처리합니다. 실패하면 reject하여 입력값을 유지합니다. */
  onSubmit: (title: string) => Promise<void>;
}

const GoalCreateModal = (props: GoalCreateModalProps) => {
  if (!props.isOpen) return null;
  return <GoalCreateDialog {...props} />;
};

const GoalCreateDialog = ({
  isOpen,
  onOpenChange,
  onSubmit,
}: GoalCreateModalProps) => {
  const t = useTranslations('Todo');
  const g = useTranslations('GoalCreate');
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const [title, setTitle] = useState('');
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const trimmedTitle = title.trim();
  const canSubmit = trimmedTitle.length > 0 && title.length <= 100;
  const error =
    title.length > 100
      ? g('tooLong')
      : touched && !trimmedTitle
        ? g('required')
        : undefined;
  const close = () => onOpenChange(false);
  const { isConfirmOpen, setIsConfirmOpen, requestClose, confirmClose } =
    useCloseConfirm({
      shouldConfirm: () => title.length > 0,
      isBlocked: isSubmitting,
      onClose: close,
    });

  const submit = async () => {
    setTouched(true);
    if (!canSubmit || submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      await onSubmit(trimmedTitle);
    } catch {
      toast.error(g('createError'));
      return;
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
    close();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
        size="lg"
        className="overflow-hidden"
      >
        <div className="-m-1 min-h-0 scrollbar-thin overflow-y-auto overscroll-contain p-1 pr-2">
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
            className="flex flex-col gap-6"
          >
            <ModalHeader>{t('createGoal')}</ModalHeader>
            <FieldLayout
              label={g('title')}
              htmlFor={inputId}
              isRequired
              errorId={errorId}
              errorMessage={error}
            >
              <div className="w-full">
                <TextField
                  id={inputId}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  onBlur={() => setTouched(true)}
                  disabled={isSubmitting}
                  placeholder={g('placeholder')}
                  aria-required="true"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? errorId : undefined}
                  className={cn(
                    fieldBoxVariants({ isError: Boolean(error) }),
                    'h-11 py-0 focus:ring-0 md:h-14',
                    error && 'focus:border-danger',
                  )}
                />
              </div>
            </FieldLayout>
            <div className="mt-2 flex gap-3 md:mt-4">
              <Button
                variant="neutral"
                className="min-w-0 flex-1 shrink"
                disabled={isSubmitting}
                onClick={requestClose}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                className="min-w-0 flex-1 shrink"
                disabled={!canSubmit || isSubmitting}
              >
                {t('register')}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
      <ConfirmModal
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={t('form.closeConfirm')}
        description={t('form.closeWarning')}
        cancelLabel={t('cancel')}
        confirmLabel={t('confirm')}
        onConfirm={confirmClose}
      />
    </>
  );
};

export default GoalCreateModal;

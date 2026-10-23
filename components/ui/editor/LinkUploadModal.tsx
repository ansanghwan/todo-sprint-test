'use client';

import { useTranslations } from 'next-intl';
import { useId, useState, type FormEvent } from 'react';

import { parseLinkUrl } from '@/components/todo/todo-form/linkUrl';
import {
  FIELD_ERROR_CLASS,
  fieldBoxVariants,
} from '@/components/todo/todo-form/fieldStyles';
import Button from '@/components/ui/button/Button';
import Modal from '@/components/ui/Modal';
import ModalHeader from '@/components/ui/ModalHeader';

interface LinkUploadModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** 기존 링크를 고칠 때의 주소. 있으면 입력칸을 채우고 링크 삭제 버튼을 보여 줍니다. */
  initialUrl?: string;
  /** 스킴까지 보완된 주소를 넘깁니다. */
  onSubmit: (url: string) => void;
  onRemove: () => void;
}

/**
 * 링크 업로드 팝업 (FN-WR-04, 미리보기 카드 제외).
 * 할 일 링크(FN-TD-25)와 같은 규칙으로 검사하고, 올바른 주소가 있을 때만 확인할 수 있습니다.
 * 닫기는 X, ESC, 바깥 클릭이며 본문은 바꾸지 않습니다.
 */
const LinkUploadModal = ({
  isOpen,
  onOpenChange,
  ...props
}: LinkUploadModalProps) => (
  <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="sm">
    {/* 닫히면 내용이 사라지므로, 열 때마다 입력 상태가 initialUrl로 새로 시작합니다. */}
    <LinkUploadForm {...props} />
  </Modal>
);

const LinkUploadForm = ({
  initialUrl = '',
  onSubmit,
  onRemove,
}: Omit<LinkUploadModalProps, 'isOpen' | 'onOpenChange'>) => {
  const t = useTranslations('Todo');
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const [value, setValue] = useState(initialUrl);
  const [isTouched, setIsTouched] = useState(false);
  const parsed = parseLinkUrl(value);
  const url = parsed.success ? parsed.url : undefined;
  const isInvalid = isTouched && !parsed.success;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // 팝업은 portal이지만 React 이벤트는 컴포넌트 트리를 따라 올라가므로,
    // 에디터를 감싼 노트 저장 form까지 submit이 전달되지 않게 막습니다.
    event.stopPropagation();
    if (url) {
      onSubmit(url);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <ModalHeader>{t('linkUpload')}</ModalHeader>

      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="sr-only">
          {t('link')}
        </label>
        <input
          id={inputId}
          type="text"
          inputMode="url"
          autoFocus
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={() => setIsTouched(true)}
          placeholder={t('form.linkPlaceholder')}
          aria-invalid={isInvalid}
          aria-describedby={isInvalid ? errorId : undefined}
          className={fieldBoxVariants({ isError: isInvalid })}
        />
        {isInvalid && (
          <p id={errorId} role="alert" className={FIELD_ERROR_CLASS}>
            {t('form.errors.linkInvalid')}
          </p>
        )}
      </div>

      {/* 목표 생성·할 일 생성·수정 팝업과 같은 버튼 줄입니다. */}
      <div className="mt-2 flex gap-3 md:mt-4">
        {initialUrl && (
          <Button
            type="button"
            variant="neutral"
            className="min-w-0 flex-1 shrink"
            onClick={onRemove}
          >
            {t('form.removeLink')}
          </Button>
        )}
        <Button type="submit" className="min-w-0 flex-1 shrink" disabled={!url}>
          {t('confirm')}
        </Button>
      </div>
    </form>
  );
};

export default LinkUploadModal;

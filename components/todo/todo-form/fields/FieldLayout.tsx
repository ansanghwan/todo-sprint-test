import type { ReactNode } from 'react';

import FormLabel from '@/components/ui/form/FormLabel';
import { FIELD_ERROR_CLASS } from '../fieldStyles';

interface FieldLayoutProps {
  label: string;
  /** 라벨이 가리킬 입력 요소의 id */
  htmlFor?: string;
  /** role="group"처럼 aria-labelledby로 라벨을 참조할 때 쓰는 id */
  labelId?: string;
  isRequired?: boolean;
  /** 오류 문구 요소의 id. 입력 요소의 aria-describedby와 같은 값을 넘깁니다. */
  errorId: string;
  errorMessage?: string;
  children: ReactNode;
}

/**
 * 라벨 · 입력 · 오류 문구를 세로로 배치합니다 (라벨과 입력 사이 8px).
 * 입력 요소의 aria 속성은 각 필드가 직접 지정합니다.
 */
const FieldLayout = ({
  label,
  htmlFor,
  labelId,
  isRequired,
  errorId,
  errorMessage,
  children,
}: FieldLayoutProps) => (
  <div className="flex flex-col items-start gap-2">
    <FormLabel id={labelId} htmlFor={htmlFor} isRequired={isRequired}>
      {label}
    </FormLabel>
    {children}
    {errorMessage && (
      <p id={errorId} className={FIELD_ERROR_CLASS}>
        {errorMessage}
      </p>
    )}
  </div>
);

export default FieldLayout;

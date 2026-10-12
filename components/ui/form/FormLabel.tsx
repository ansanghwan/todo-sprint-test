import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

interface FormLabelProps extends ComponentProps<'label'> {
  /** 필수 입력이면 주황 별표를 붙입니다. 필수 여부는 입력 요소의 aria-required로도 알려야 합니다. */
  isRequired?: boolean;
}

/** 폼 필드 라벨. Figma TaskForm의 라벨(모바일 14/20, PC 16/24 semibold)과 필수 별표 */
const FormLabel = ({
  isRequired = false,
  className,
  children,
  ...props
}: FormLabelProps) => (
  <label
    className={cn(
      'text-sm/5 font-semibold text-grayscale-700 md:text-base/6',
      className,
    )}
    {...props}
  >
    {children}
    {isRequired && (
      <span aria-hidden="true" className="text-orange-500">
        *
      </span>
    )}
  </label>
);

export default FormLabel;

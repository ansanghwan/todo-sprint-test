import { cva } from 'class-variance-authority';

import type { TagColor } from '../tagColors';

/** Figma Badge (4:8985): 높이 24, 패딩 좌 8·상하 4·우 3, 글자 12/16 medium, 테두리 1px */
const chipVariants = cva(
  'flex shrink-0 items-center gap-0.5 rounded-full border py-0.75 pr-0.75 pl-2 text-xs/4 font-medium',
  {
    variants: {
      color: {
        green: 'border-success-200 bg-success-50 text-success-700',
        yellow: 'border-warning-200 bg-warning-50 text-warning-700',
        red: 'border-error-200 bg-error-50 text-error-700',
      },
    },
  },
);

const removeIconVariants = cva('material-symbols-outlined text-[1rem]', {
  variants: {
    color: {
      green: 'text-success-400',
      yellow: 'text-warning-400',
      red: 'text-error-400',
    },
  },
});

interface TagChipProps {
  label: string;
  color: TagColor;
  /** 삭제 버튼의 접근성 이름 (예: "공부 태그 삭제") */
  removeLabel: string;
  onRemove: () => void;
}

const TagChip = ({ label, color, removeLabel, onRemove }: TagChipProps) => (
  <li data-color={color} className={chipVariants({ color })}>
    <span className="max-w-40 truncate">{label}</span>
    <button
      type="button"
      aria-label={removeLabel}
      onClick={onRemove}
      className="flex rounded-full focus-visible:outline-2 focus-visible:outline-orange-600"
    >
      <span aria-hidden="true" className={removeIconVariants({ color })}>
        close
      </span>
    </button>
  </li>
);

export default TagChip;

import { cva } from 'class-variance-authority';

/**
 * 생성·수정 폼 입력 상자의 크기와 상태 색 (Figma input 4:8972, upload_input).
 * - 모바일: 높이 44 · 좌우 패딩 12 · 모서리 12 · 글자 14/20 (글자 크기는 높이에서 계산한 추정값)
 * - PC(md 이상): 높이 56 · 좌우 패딩 16 · 모서리 16 · 글자 16/24
 * input에 직접 쓰면 focus, 아이콘을 감싼 상자에 쓰면 focus-within으로 포커스 테두리가 바뀝니다.
 * aria-invalid·aria-describedby·label 연결은 여기서 다루지 않고 각 필드가 직접 지정합니다.
 */
export const fieldBoxVariants = cva(
  'flex min-h-11 w-full items-center gap-2 rounded-xl border px-3 text-sm/5 text-grayscale-700 transition-colors outline-none placeholder:text-grayscale-500 motion-reduce:transition-none md:min-h-14 md:rounded-2xl md:px-4 md:text-base/6',
  {
    variants: {
      /** plain: 흰 배경 실선, upload: 회색 배경 점선(링크) */
      tone: {
        plain: 'bg-white',
        upload: 'border-dashed bg-grayscale-50',
      },
      isError: {
        true: 'border-danger',
        false:
          'border-grayscale-300 focus-within:border-orange-500 focus:border-orange-500 data-[state=open]:border-orange-500',
      },
    },
    defaultVariants: { tone: 'plain', isError: false },
  },
);

/** 상자 안에 넣는 실제 input. 상자가 테두리와 패딩을 그리므로 input은 꾸미지 않습니다. */
export const FIELD_INNER_INPUT_CLASS =
  'min-w-0 flex-1 bg-transparent text-grayscale-700 outline-none placeholder:text-grayscale-500';

/** 필드 아래 오류 문구 (Figma 14/20 medium, #FF3434) */
export const FIELD_ERROR_CLASS = 'text-sm/5 font-medium text-danger';

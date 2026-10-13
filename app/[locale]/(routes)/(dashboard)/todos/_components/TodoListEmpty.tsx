import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface TodoListEmptyProps {
  /** 기본은 모든 할 일의 안내 문구입니다. 찜한 할 일(FN-FV-05)은 자기 문구를 넘깁니다. */
  message?: string;
}

/** 빈 상태 (FN-TD-03). Figma `empty` (4:4149), 모바일 (4:4177) */
const TodoListEmpty = ({ message }: TodoListEmptyProps) => {
  const t = useTranslations('Todo');

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2.5 py-10 md:gap-4.5">
      <Image
        src="/images/todo/empty.svg"
        alt=""
        width={130}
        height={140}
        className="h-21.25 w-auto md:h-35"
      />
      <p className="text-sm/5 font-medium tracking-[-0.03em] text-grayscale-500 md:text-base/6">
        {message ?? t('noAllTodos')}
      </p>
    </div>
  );
};

export default TodoListEmpty;

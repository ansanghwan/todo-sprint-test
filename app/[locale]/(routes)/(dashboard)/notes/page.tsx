import Image from 'next/image';
import NotesView from '@/components/note/NotesView';
import { Suspense } from 'react';

export default function Page() {
  return (
    <div className={'bg-grayscale-100'}>
      <Suspense fallback={null}>
        <NotesView>
          <div
            className={
              'mb-2.5 flex w-full flex-row flex-nowrap items-center rounded-[1.75rem] bg-orange-100 p-10'
            }
          >
            <Image
              src="../icons/img_goal.svg"
              width={40}
              height={40}
              alt="목표 아이콘"
              className="mr-6"
            />
            <h3 className={'text-2xl font-semibold'}>
              자바스크립트로 웹 서비스 만들기
            </h3>
          </div>
        </NotesView>
      </Suspense>
    </div>
  );
}

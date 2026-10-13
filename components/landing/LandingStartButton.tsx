'use client';

import { useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { request } from '@/lib/api/client-fetcher';
import { ApiError } from '@/lib/api/errors';
import { toast } from '@/components/ui/toast/Toaster';

/** 두 시작하기 버튼이 같은 세션 확인 절차를 사용합니다. 페이지 전체의 접근 보호와는 별개입니다. */
export default function LandingStartButton({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const t = useTranslations('Landing');
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);

  const start = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    try {
      // 쿠키 존재만으로 판단하지 않습니다. 기존 클라이언트가 401 시 토큰 갱신 후 재요청합니다.
      await request<unknown>({ url: '/users/me' });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push('/login');
        return;
      }
      // 서버·통신 장애는 비로그인으로 단정하지 않고 현재 화면에서 재시도하게 합니다.
      toast.error(t('sessionCheckError'));
      inFlight.current = false;
      setPending(false);
      return;
    }
    // 이동이 완료될 때까지 중복 클릭을 막습니다. locale은 공용 router가 유지합니다.
    router.push('/dashboard');
  };

  return (
    <button
      type="button"
      data-enter="button"
      className={className}
      onClick={start}
      disabled={pending}
      aria-busy={pending}
      aria-label={pending ? t('checkingSession') : undefined}
    >
      {pending ? t('checkingSession') : children}
    </button>
  );
}

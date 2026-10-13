import { useTranslations } from 'next-intl';

import ClientSuspense from '@/components/boundaries/ClientSuspense';
import QueryErrorBoundary from '@/components/boundaries/QueryErrorBoundary';
import PasswordForm from './_components/PasswordForm';
import ProfileForm from './_components/ProfileForm';
import ProfileFormSkeleton from './_components/ProfileFormSkeleton';

const CARD_CLASS_NAME = 'rounded-4xl bg-white-section p-5 md:px-8 md:py-10';

export default function MyPage() {
  const t = useTranslations('MyInfo');

  return (
    <div className="flex flex-col gap-6 md:gap-10 lg:mx-auto lg:w-full lg:max-w-140">
      <h2 className="hidden px-2 text-xl font-semibold text-heading md:block lg:text-2xl">
        {t('title')}
      </h2>
      <div className="flex flex-col gap-4 md:gap-6">
        <section className={CARD_CLASS_NAME}>
          <QueryErrorBoundary message={t('loadError')}>
            <ClientSuspense fallback={<ProfileFormSkeleton />}>
              <ProfileForm />
            </ClientSuspense>
          </QueryErrorBoundary>
        </section>
        <section className={CARD_CLASS_NAME}>
          <PasswordForm />
        </section>
      </div>
    </div>
  );
}

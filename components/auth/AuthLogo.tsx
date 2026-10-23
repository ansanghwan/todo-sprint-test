import ThemedLogo from '@/components/common/ThemedLogo';
import { useTranslations } from 'next-intl';

/** GNB와 같은 logo.svg. 원본의 그림자 여백만큼 바깥 여백을 당겨 시안 위치에 맞춥니다. */
const AuthLogo = () => {
  const t = useTranslations('Auth');

  return (
    <div className="h-12">
      <ThemedLogo
        alt={t('logoAlt')}
        width={284}
        height={80}
        priority
        className="-mt-3 -ml-2 h-20 w-71 max-w-none"
      />
    </div>
  );
};

export default AuthLogo;

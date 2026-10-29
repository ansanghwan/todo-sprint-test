import { Link } from '@/i18n/navigation';

interface AuthSwitchLinkProps {
  prompt: string;
  linkLabel: string;
  href: '/login' | '/signup';
}

/** 로그인 ↔ 회원가입 화면 이동. "슬리드투두가 처음이신가요? 회원가입" */
const AuthSwitchLink = ({ prompt, linkLabel, href }: AuthSwitchLinkProps) => {
  return (
    <p className="flex items-center justify-center gap-1.5 text-sm/5 tracking-[-0.03em] md:gap-2 md:text-base/6">
      <span className="font-medium text-grayscale-700">{prompt}</span>
      <Link
        href={href}
        className="rounded-sm font-semibold text-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
      >
        {linkLabel}
      </Link>
    </p>
  );
};

export default AuthSwitchLink;

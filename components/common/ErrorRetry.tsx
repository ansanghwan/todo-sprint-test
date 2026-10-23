import { useTranslations } from 'next-intl';
import Button from '@/components/ui/button/Button';

interface ErrorRetryProps {
  message: string;
  onRetry: () => void;
}

const ErrorRetry = ({ message, onRetry }: ErrorRetryProps) => {
  const t = useTranslations('Common');

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <p className="text-muted">{message}</p>
      <Button variant="neutral" size="sm" className="w-auto" onClick={onRetry}>
        {t('retry')}
      </Button>
    </div>
  );
};

export default ErrorRetry;

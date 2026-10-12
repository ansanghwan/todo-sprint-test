import Image from 'next/image';
import { cn } from '@/lib/utils';

const DEFAULT_PROFILE_IMAGE = '/images/gnb/img_profile.jpg';

interface WriterAvatarProps {
  image: string | null;
  className?: string;
}

const WriterAvatar = ({ image, className }: WriterAvatarProps) => (
  <Image
    src={image ?? DEFAULT_PROFILE_IMAGE}
    alt=""
    width={24}
    height={24}
    className={cn(
      'size-5 shrink-0 rounded-full object-cover md:size-6',
      className,
    )}
  />
);

export default WriterAvatar;

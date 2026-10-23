import Image, { type ImageProps } from 'next/image';

type ThemedLogoProps = Omit<ImageProps, 'src'> & { symbol?: boolean };

/** data-theme 기준으로 전환해 초기 표시와 설정에서 변경한 테마를 함께 반영합니다. */
export default function ThemedLogo({
  symbol = false,
  alt,
  ...props
}: ThemedLogoProps) {
  const name = symbol ? 'symbol' : 'logo';

  return (
    <>
      <span className="contents dark:hidden">
        <Image {...props} src={`/icons/gnb/${name}.svg`} alt={alt} />
      </span>
      <span className="hidden dark:contents">
        <Image {...props} src={`/icons/gnb/${name}-dark.svg`} alt={alt} />
      </span>
    </>
  );
}

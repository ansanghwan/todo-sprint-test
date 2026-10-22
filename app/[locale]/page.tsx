import Image from 'next/image';
import { useTranslations } from 'next-intl';
import LandingStartButton from '@/components/landing/LandingStartButton';
import LandingSmoothScroll from '@/components/landing/LandingSmoothScroll';

// 반복되는 문구와 버튼 스타일은 함께 수정할 수 있도록 모았습니다.
const eyebrowClass =
  'text-base font-semibold text-orange-600 md:text-2xl lg:text-3xl';
const hdadingManinClass =
  'mt-4 text-[length:clamp(1.875rem,5.3vw,6.15rem)] leading-[1.25] font-extrabold text-[#292929]';
const headingClass =
  'mt-2 text-xl font-bold leading-snug tracking-tight md:mt-6 md:text-display-md lg:text-6xl';
const startClass =
  'inline-flex h-10 w-34  items-center justify-center rounded-full bg-orange-500 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-colors hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600 md:h-14 md:w-56 md:text-base';
const featureItemClass =
  'flex items-center gap-3.5 rounded-2xl border border-[#ffffff40] bg-[#ffffff26] px-4 py-3.5 text-[length:1rem] font-bold shadow-[0_0.25rem_0.75rem_#ae38100a] md:gap-5 md:px-6 md:py-5 md:text-[length:1.25rem]';
const featureIconClass = 'size-9 shrink-0 md:size-10';
// data-steps-pinned가 있는 모바일에서만 카드를 같은 칸에 겹칩니다.
const stepCardClass =
  'relative flex flex-col items-center rounded-[2rem] border border-white bg-white px-5 py-8 shadow-[0_0.75rem_2.5rem_#824c3510] md:px-4 md:py-10 max-md:group-data-[steps-pinned]/steps:col-start-1 max-md:group-data-[steps-pinned]/steps:row-start-1 max-md:group-data-[steps-pinned]/steps:w-full max-md:group-data-[steps-pinned]/steps:max-w-96 max-md:group-data-[steps-pinned]/steps:justify-self-center max-md:group-data-[steps-pinned]/steps:py-6';

export default function Home() {
  const nextIntlLanding = useTranslations('Landing');
  return (
    <LandingSmoothScroll>
      {/* JavaScript 비활성화 시에도 콘텐츠를 표시합니다. */}
      <noscript>
        <style>{`
          [data-landing-section] [data-enter],
          [data-landing-section] [data-enter] img,
          [data-steps-heading] > :is(p, h2),
          [data-landing-section="steps"] ol,
          [data-landing-section="steps"] ol > li {
            opacity: 1 !important;
            visibility: visible !important;
            transform: none !important;
          }
        `}</style>
      </noscript>
      {/* section01 */}
      <section
        data-landing-section="hero"
        className="min-h-svh [background:radial-gradient(ellipse_at_20%_80%,#dcfaf3_0,transparent_55%),radial-gradient(ellipse_at_85%_15%,#fff0df_0,transparent_55%),#fafafb]"
      >
        <div className="mx-auto flex size-full max-w-7xl flex-col items-center justify-center gap-[clamp(2rem,5svh,3.5rem)] px-5 py-[clamp(2.5rem,6svh,5rem)] text-center md:px-12">
          <div data-enter="text">
            <p data-enter="text" className={eyebrowClass}>
              {nextIntlLanding('eyebrow')}
            </p>
            <h1 className={hdadingManinClass}>
              {nextIntlLanding.rich('heroTitle', {
                br: () => <br />,
                brand: (chunks) => <span>{chunks}</span>,
              })}
            </h1>
          </div>
          <LandingStartButton className={startClass}>
            {nextIntlLanding('start')}
          </LandingStartButton>
          <div
            data-enter="image"
            className="w-full max-w-7xl overflow-hidden rounded-3xl border border-white bg-white shadow-[0_1rem_3rem_#36645414] md:rounded-4xl"
          >
            <div
              aria-hidden="true"
              className="flex h-7 items-center gap-1.5 border-b border-[#f4f4f4] px-4 [&>span]:size-1.5 [&>span]:rounded-full [&>span]:bg-[#dedede]"
            >
              <span />
              <span />
              <span />
            </div>
            <Image
              src="/images/landing/sec01.png"
              unoptimized
              alt={nextIntlLanding('heroImageAlt')}
              width={1328}
              height={635}
              sizes="(min-width: 1120px) 1024px, 94vw"
              preload
              className="block h-auto max-h-[46svh] w-full object-contain object-top"
            />
          </div>
        </div>
      </section>

      {/* section02 */}
      <section
        data-landing-section="features"
        className="flex min-h-svh items-center bg-orange-500 px-5 py-[clamp(3rem,7svh,6rem)] text-white md:px-10 lg:px-[clamp(2.5rem,5vw,5rem)]"
      >
        <div
          data-reveal-trigger
          className="mx-auto grid w-full max-w-7xl gap-[clamp(2rem,5svh,3.5rem)] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-[clamp(2rem,4vw,4.5rem)] xl:max-w-384 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]"
        >
          <div
            data-enter="text"
            className="mx-auto w-full max-w-160 text-center lg:text-left"
          >
            <p className="inline-block rounded-[999px] border border-[#ffffff40] bg-[#ffffff1f] px-3.5 py-1.5 text-[0.875rem] font-semibold">
              {nextIntlLanding('featuresEyebrow')}
            </p>
            <h2 className="mt-4 text-[clamp(1.5rem,5.8vw,2rem)] leading-[1.3] font-extrabold tracking-[-0.04em] text-balance break-keep md:text-[2.5rem] lg:text-6xl [&>span]:inline-block lg:[&>span]:block">
              {nextIntlLanding.rich('featuresTitle', {
                first: (chunks) => <span>{chunks}</span>,
                second: (chunks) => <span>{chunks}</span>,
              })}
            </h2>
            <ul className="mt-[clamp(1.75rem,4svh,2.5rem)] grid gap-3 text-left lg:mt-10 lg:gap-4">
              <li className={featureItemClass}>
                <Image
                  src="/images/landing/img_sec02_1.png"
                  alt=""
                  width={40}
                  height={40}
                  className={featureIconClass}
                />
                {nextIntlLanding('featureTasks')}
              </li>
              <li className={featureItemClass}>
                <Image
                  src="/images/landing/img_sec02_2.png"
                  alt=""
                  width={40}
                  height={40}
                  className={featureIconClass}
                />
                {nextIntlLanding('featureProgress')}
              </li>
              <li className={featureItemClass}>
                <Image
                  src="/images/landing/img_sec02_3.png"
                  alt=""
                  width={40}
                  height={40}
                  className={featureIconClass}
                />
                {nextIntlLanding('featureNotes')}
              </li>
            </ul>
          </div>
          <div
            data-enter="image"
            className="mx-auto w-full max-w-160 filter-[drop-shadow(0_1rem_1.5rem_#a53c1826)] lg:max-w-none"
          >
            <Image
              src="/images/landing/img_sec02.png"
              unoptimized
              alt={nextIntlLanding('featuresImageAlt')}
              width={744}
              height={424}
              sizes="(min-width: 1696px) 915px, (min-width: 1280px) 56vw, (min-width: 1024px) 52vw, (min-width: 744px) 640px, 92vw"
              className="block h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* section03 */}
      <section
        data-landing-section="steps"
        className="group/steps flex min-h-svh items-center bg-[linear-gradient(140deg,#fff5ef,#fafafb_55%,#eafaf7)] px-5 py-20 max-md:data-steps-pinned:py-8 md:px-8"
      >
        <div className="mx-auto w-full max-w-7xl text-center">
          <div data-steps-heading>
            <p className={eyebrowClass}>{nextIntlLanding('stepsEyebrow')}</p>
            <h2 className={headingClass}>{nextIntlLanding('stepsTitle')}</h2>
          </div>
          {/* 카드 내용은 개별 작성하고 카드 외형만 공통으로 적용합니다. */}
          <ol className="relative mt-10 grid gap-5 max-md:group-data-steps-pinned/steps:mt-6 md:grid-cols-3 md:gap-6 lg:mt-26">
            <li className={stepCardClass}>
              <span className="flex size-9 items-center justify-center rounded-full bg-orange-500 text-xl font-bold text-white shadow-md shadow-orange-500/15">
                1
              </span>
              <Image
                src="/images/landing/img_sec03_1.png"
                alt=""
                width={180}
                height={180}
                sizes="(min-width: 1024px) 180px, 120px"
                className="mt-4 size-30 lg:mt-6 lg:size-36"
              />
              <h3 className="mt-6 text-xl font-bold md:text-lg lg:mt-8 lg:text-2xl">
                {nextIntlLanding('stepGoalTitle')}
              </h3>
              <p className="mt-3 text-base/relaxed text-[#777777] md:text-sm lg:mt-4 lg:text-base">
                {nextIntlLanding.rich('stepGoalDescription', {
                  br: () => <br />,
                })}
              </p>
            </li>
            <li className={stepCardClass}>
              <span className="flex size-9 items-center justify-center rounded-full bg-orange-500 text-xl font-bold text-white shadow-md shadow-orange-500/15">
                2
              </span>
              <Image
                src="/images/landing/img_sec03_2.png"
                alt=""
                width={180}
                height={180}
                sizes="(min-width: 1024px) 180px, 120px"
                className="mt-4 size-30 lg:mt-6 lg:size-36"
              />
              <h3 className="mt-6 text-xl font-bold md:text-lg lg:mt-8 lg:text-2xl">
                {nextIntlLanding('stepTodoTitle')}
              </h3>
              <p className="mt-3 text-base/relaxed text-[#777777] md:text-sm lg:mt-4 lg:text-base">
                {nextIntlLanding.rich('stepTodoDescription', {
                  br: () => <br />,
                })}
              </p>
            </li>
            <li className={stepCardClass}>
              <span className="flex size-9 items-center justify-center rounded-full bg-orange-500 text-xl font-bold text-white shadow-md shadow-orange-500/15">
                3
              </span>
              <Image
                src="/images/landing/img_sec03_3.png"
                alt=""
                width={180}
                height={180}
                sizes="(min-width: 1024px) 180px, 120px"
                className="mt-4 size-30 lg:mt-6 lg:size-36"
              />
              <h3 className="mt-6 text-xl font-bold md:text-lg lg:mt-8 lg:text-2xl">
                {nextIntlLanding('stepNoteTitle')}
              </h3>
              <p className="mt-3 text-base/relaxed text-[#777777] md:text-sm lg:mt-4 lg:text-base">
                {nextIntlLanding.rich('stepNoteDescription', {
                  br: () => <br />,
                })}
              </p>
            </li>
          </ol>
        </div>
      </section>

      {/* section04 */}
      <section
        data-landing-section="community"
        className="flex min-h-svh items-center bg-white px-5 py-16 md:px-8 md:py-24 lg:py-28"
      >
        <div
          data-reveal-trigger
          className="mx-auto grid w-full max-w-7xl gap-12 md:gap-16 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-22"
        >
          <div
            data-enter="text"
            className="text-right md:pr-10 lg:order-2 lg:pr-0 lg:text-center"
          >
            <p
              className={`${eyebrowClass} text-center md:text-right lg:text-left`}
            >
              {nextIntlLanding('communityEyebrow')}
            </p>
            <h2
              className={`${headingClass} text-center leading-relaxed md:text-right lg:text-left`}
            >
              {nextIntlLanding.rich('communityTitle', { br: () => <br /> })}
            </h2>
          </div>
          <Image
            data-enter="image"
            src="/images/landing/img_sec04.png"
            loading="eager"
            alt={nextIntlLanding('communityImageAlt')}
            width={737}
            height={491}
            sizes="(min-width: 1024px) 52vw, 95vw"
            className="mx-auto h-auto w-full max-w-193 lg:order-1"
          />
        </div>
      </section>

      {/* section05 */}
      <section
        data-landing-section="finale"
        className="flex min-h-svh items-center bg-[#fff8e3]"
      >
        <div className="relative isolate mx-auto flex min-h-svh w-full max-w-7xl items-center justify-center overflow-hidden px-4 py-24 md:px-8 lg:px-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <Image
              data-enter="image"
              src="/images/landing/sec05_star.png"
              alt=""
              width={71}
              height={71}
              className="absolute top-8 left-[17%] h-auto w-8 md:top-12 md:w-12 lg:top-[16%] lg:w-18"
            />
            <Image
              data-enter="image"
              src="/images/landing/sec05_circle.png"
              alt=""
              width={44}
              height={48}
              className="absolute top-20 left-[7%] h-auto w-5 md:top-28 md:w-7 lg:top-[35%] lg:left-[12%] lg:w-11"
            />
            <Image
              data-enter="image"
              src="/images/landing/sec05_check.png"
              unoptimized
              alt=""
              width={102}
              height={113}
              className="absolute right-[6%] bottom-18 h-auto w-12 md:right-[8%] md:bottom-14 md:w-18 lg:right-[13%] lg:bottom-[30%] lg:w-26"
            />
          </div>
          <div data-reveal-trigger className="text-center">
            <p data-enter="text" className={eyebrowClass}>
              {nextIntlLanding('eyebrow')}
            </p>

            <h2 data-enter="text" className={hdadingManinClass}>
              {nextIntlLanding.rich('heroTitle', { br: () => <br /> })}
            </h2>
            <LandingStartButton className={`${startClass} mt-10 md:mt-12`}>
              {nextIntlLanding('start')}
            </LandingStartButton>
          </div>
        </div>
      </section>
    </LandingSmoothScroll>
  );
}

'use client';

import { useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { useGSAP } from '@gsap/react';
import {
  animateHero,
  animateFeatures,
  animateSteps,
  animateCommunity,
  animateFinale,
} from './LandingSectionAnimations';

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollSmoother);

// false로 바꾸면 섹션이 서로 덮이는 효과만 끕니다.
const ENABLE_SECTION_OVERLAP = true;
// 섹션을 모두 읽을 수 있도록 다음 섹션의 진입을 늦출 스크롤 거리입니다.
// 0.3 = 화면 높이의 30%. 시간(초)이 아니라 스크롤 거리 기준입니다.
const SECTION_READ_RATIO = 0.3;

export default function LandingSmoothScroll({
  children,
}: {
  children: ReactNode;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add('(prefers-reduced-motion: no-preference)', () => {
        if (!wrapperRef.current || !contentRef.current) return;

        const smoother = ScrollSmoother.create({
          wrapper: wrapperRef.current,
          content: contentRef.current,
          smooth: 1,
          speed: 1,
          smoothTouch: 0.1,
          effects: false,
        });

        const sections = gsap.utils.toArray<HTMLElement>(
          ':scope > section',
          contentRef.current,
        );
        sections.forEach((section, index) => {
          if (section.dataset.landingSection === 'steps') {
            // 3번은 전용 핀을 사용해 중복 고정을 피합니다.
            gsap.set(section, { position: 'relative', zIndex: index + 1 });
            animateSteps(section);
            return;
          }
          if (ENABLE_SECTION_OVERLAP) {
            gsap.set(section, { position: 'relative', zIndex: index + 1 });
            if (index === sections.length - 1) return;

            // 고정 공간 중 한 화면만 겹쳐 다음 섹션이 덮어 올라오도록 합니다.
            // 나머지 SECTION_READ_RATIO만큼은 현재 섹션을 가리지 않습니다.
            gsap.set(sections[index + 1], { marginTop: '-100vh' });
            ScrollTrigger.create({
              trigger: section,
              // 긴 모바일 섹션은 끝까지 읽은 뒤 고정합니다.
              start: () =>
                section.offsetHeight > window.innerHeight
                  ? 'bottom bottom'
                  : 'top top',
              end: () => `+=${window.innerHeight * (1 + SECTION_READ_RATIO)}`,
              pin: true,
              pinSpacing: true,
              invalidateOnRefresh: true,
            });
          }
        });

        // 섹션마다 시작 대상과 타임라인을 독립적으로 설정합니다.
        const hero = contentRef.current.querySelector<HTMLElement>(
          '[data-landing-section="hero"]',
        );
        const features = contentRef.current.querySelector<HTMLElement>(
          '[data-landing-section="features"]',
        );
        const community = contentRef.current.querySelector<HTMLElement>(
          '[data-landing-section="community"]',
        );
        const finale = contentRef.current.querySelector<HTMLElement>(
          '[data-landing-section="finale"]',
        );
        if (hero) animateHero(hero);
        if (features) animateFeatures(features);
        if (community) animateCommunity(community);
        if (finale) animateFinale(finale);

        return () => smoother.kill();
      });
      return () => media.revert();
    },
    { scope: wrapperRef },
  );

  return (
    <div ref={wrapperRef}>
      <main
        ref={contentRef}
        className="overflow-x-clip bg-white text-[#333333]"
      >
        {children}
      </main>
    </div>
  );
}

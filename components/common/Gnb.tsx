'use client';

import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import ActionButton from '@/components/ui/button/ActionButton';
import NotificationButton from '@/components/common/NotificationButton';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

export type MenuId =
  'dashboard' | 'goal' | 'calendar' | 'board' | 'favorites' | 'notes';

type GnbProps = {
  activeMenu?: MenuId | null;
  onCreateTodo?: () => void;
  onCreateGoal?: () => void;
  onLogout?: () => void;
  isLoggingOut?: boolean;
  pageTitle?: string;
  userName?: string;
  userEmail?: string;
  hasNotification?: boolean;
  onOpenNotifications?: () => void;
};

export default function Gnb({
  activeMenu = null,
  onCreateTodo,
  onCreateGoal,
  onLogout,
  isLoggingOut = false,
  pageTitle = '대시보드',
  userName = '사용자',
  userEmail = '',
  hasNotification = false,
  onOpenNotifications,
}: GnbProps = {}) {
  // TODO(알림 기능 구현 위치): 이 Gnb는 클라이언트 컴포넌트입니다.
  // 알림 조회·읽음 처리 로직은 공통 훅/상태 관리에 구현하고, 이 위치에서 한 번 연결해
  // 아래 notificationProps에 실제 미확인 알림 여부와 목록 열기 함수를 넣어주세요.
  // 또는 별도의 클라이언트 부모에서 훅을 연결하고 현재 Gnb props로 전달해도 됩니다.
  // 두 방식 중 한 곳만 사용하며, NotificationButton/IconButton 내부에는 조회 로직을 넣지 않습니다.
  // hasNotification의 기본 false는 미연동 상태의 기본값일 뿐입니다.
  // 실제 개발에서는 true/false로 고정하지 말고 알림 데이터에서 계산한 값을 사용해주세요.
  // 각 NotificationButton에 hasNotification={true} 등을 따로 붙이면 공통 값을 덮어쓰므로 금지합니다.
  // - hasNotification: 읽지 않은 알림이 하나라도 있으면 true, 없으면 false입니다.
  // - onOpenNotifications: 공통 알림 목록 또는 팝업을 여는 함수를 연결합니다.
  // - 읽음 처리: 서버에 읽음 처리를 요청한 뒤 공통 알림 데이터를 갱신해주세요.
  //   갱신한 데이터로 hasNotification을 다시 계산하면 세 위치의 배지가 함께 바뀝니다.
  //   읽지 않은 알림이 남아 있으면 true를 유지하며, 모두 읽었을 때만 false가 됩니다.
  // - 종 클릭은 목록 열기이며, 자동으로 읽음 처리한다는 뜻은 아닙니다.
  //   목록을 열 때 전체 읽음 처리할지, 개별 알림 선택 시 처리할지는 서비스 정책에 따릅니다.
  // 세 위치는 동일한 데이터와 열기 함수를 공유합니다. 위치별 상태/API/팝업을 만들지 마세요.
  // 현재는 UI 연결 구조만 마련된 상태로, 배지는 기본 false이며 조회·열기·읽음 기능은 미구현입니다.
  const notificationProps = { hasNotification, onOpen: onOpenNotifications };
  const [isOpen, setIsOpen] = useState(false);
  const [closeImmediately, setCloseImmediately] = useState(false);
  // 선택 표시는 ConnectedGnb가 현재 경로로 결정합니다. 링크는 href로 이동합니다.
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 닫기 버튼과 딤에서 공통으로 사용합니다.
  function closeMenu() {
    toggleRef.current?.focus({ preventScroll: true });
    setIsOpen(false);
  }

  // 닫힌 메뉴는 애니메이션 중에도 클릭·Tab·스크린리더 접근을 막습니다.
  // PC는 true일 때 접힘, 모바일·태블릿은 false일 때 닫힘입니다.
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const breakpoint =
      getComputedStyle(document.documentElement)
        .getPropertyValue('--breakpoint-lg')
        .trim() || '64rem';
    const desktop = window.matchMedia(`(min-width: ${breakpoint})`);
    function updateMenuAccess() {
      if (!menu) return;
      const hidden = desktop.matches ? isOpen : !isOpen;
      toggleRef.current?.setAttribute('aria-expanded', String(!hidden));
      if (hidden && menu.contains(document.activeElement)) {
        toggleRef.current?.focus({ preventScroll: true });
      }
      menu.inert = hidden;
    }
    updateMenuAccess();
    desktop.addEventListener('change', updateMenuAccess);
    return () => desktop.removeEventListener('change', updateMenuAccess);
  }, [isOpen]);

  return (
    <aside
      data-open={isOpen}
      className="group/gnb peer/gnb sticky top-0 z-50 w-full bg-white-section text-foreground after:pointer-events-none after:fixed after:inset-0 after:z-10 after:hidden after:bg-black/40 after:opacity-0 after:transition-opacity after:duration-400 after:ease-out after:content-[''] motion-reduce:transition-none motion-reduce:after:transition-none md:fixed md:left-0 md:flex md:h-dvh md:w-15 md:flex-col md:overflow-hidden md:rounded-r-[40px] md:shadow-lg md:transition-[width] md:duration-400 md:ease-out md:after:block md:data-[open=true]:w-90.5 md:data-[open=true]:after:pointer-events-auto md:data-[open=true]:after:opacity-100 lg:w-90.5 lg:rounded-r-[48px] lg:after:hidden lg:data-[open=true]:w-24"
      onClick={(event) => {
        if (event.target === event.currentTarget) closeMenu();
        // 모바일 페이지 이동은 메뉴를 즉시 닫습니다. Link의 기본 이동은 유지합니다.
        const link = (event.target as Element).closest('a[href]');
        if (
          !link ||
          link.getAttribute('href')?.startsWith('#') ||
          link.getAttribute('target') === '_blank' ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        const breakpoint =
          getComputedStyle(document.documentElement)
            .getPropertyValue('--breakpoint-md')
            .trim() || '46.5rem';
        // Next Link도 정상 이동 시 preventDefault를 사용하므로 그 여부로 제외하지 않습니다.
        if (!window.matchMedia(`(min-width: ${breakpoint})`).matches) {
          setCloseImmediately(true);
          closeMenu();
        }
      }}
    >
      {/* 기본 헤더: 모바일의 닫힌 상단 바 / 태블릿·PC의 로고와 토글 버튼 */}
      <header className="relative z-20 flex h-16 w-full shrink-0 items-center justify-between gap-2 bg-white-section px-4 max-md:border-b max-md:border-solid max-md:border-subtle max-md:shadow-md max-md:group-data-[open=true]/gnb:invisible md:block md:h-auto md:group-data-[open=false]/gnb:px-0 md:group-data-[open=false]/gnb:pt-14 md:group-data-[open=true]/gnb:pt-21 lg:group-data-[open=false]/gnb:px-4 lg:group-data-[open=false]/gnb:pt-21 lg:group-data-[open=true]/gnb:px-0 lg:group-data-[open=true]/gnb:pt-14">
        <Link
          href="/dashboard"
          className="hidden font-semibold whitespace-nowrap md:inline md:group-data-[open=false]/gnb:mx-auto md:group-data-[open=false]/gnb:block md:group-data-[open=false]/gnb:w-fit lg:group-data-[open=false]/gnb:mx-0 lg:group-data-[open=false]/gnb:block lg:group-data-[open=false]/gnb:w-auto lg:group-data-[open=true]/gnb:mx-auto lg:group-data-[open=true]/gnb:block lg:group-data-[open=true]/gnb:w-fit"
          aria-label="대시보드"
        >
          <Image
            src="/icons/gnb/logo.svg"
            alt=""
            width={284}
            height={80}
            className="hidden h-auto w-74.5 max-w-none md:group-data-[open=true]/gnb:block lg:group-data-[open=false]/gnb:block lg:group-data-[open=true]/gnb:hidden"
          />
          {/* 원본 80px 중 본체 48px → 전체 10/3rem이면 본체는 2rem(32px) */}
          <Image
            src="/icons/gnb/symbol.svg"
            alt=""
            width={80}
            height={80}
            className="hidden size-[calc(10rem/3)] max-w-none md:group-data-[open=false]/gnb:block lg:group-data-[open=false]/gnb:hidden lg:group-data-[open=true]/gnb:block"
          />
        </Link>
        <button
          type="button"
          ref={toggleRef}
          className="flex size-8 shrink-0 items-center justify-center md:absolute md:top-4 md:right-4 lg:group-data-[open=true]/gnb:right-auto lg:group-data-[open=true]/gnb:left-1/2 lg:group-data-[open=true]/gnb:-translate-x-1/2"
          aria-label="메뉴 열기·닫기"
          aria-controls="gnb-menu"
          onClick={() => {
            if (isOpen) closeMenu();
            else {
              setCloseImmediately(false);
              setIsOpen(true);
            }
          }}
        >
          <span
            className="flex size-6 items-center justify-center md:hidden"
            aria-hidden="true"
          >
            <Image
              src="/icons/gnb/menu.svg"
              alt=""
              width={14}
              height={10}
              className="h-2.5 w-3.5"
            />
          </span>
          <Image
            src="/icons/gnb/chevrons-right.svg"
            alt=""
            width={18}
            height={15}
            className="hidden h-3.75 w-4.5 md:block"
          />
        </button>
        {/* 개발 연동: pageTitle에 현재 페이지 제목을 전달해주세요.
            기본 문구는 대시보드 시안용이며, 내 정보 링크가 아닙니다. */}
        <span className="min-w-0 flex-1 truncate text-base font-semibold md:hidden">
          {pageTitle}
        </span>
        {/* 모바일: 메뉴를 닫았을 때 상단 헤더에서만 표시합니다. */}
        <div className="shrink-0 md:hidden">
          <NotificationButton {...notificationProps} compact />
        </div>
        {/* 태블릿은 open=false, PC는 open=true일 때 접힌 상태입니다.
            펼친 상태의 알림은 아래 내 정보 링크 옆에서 표시합니다. */}
        <div className="hidden justify-center md:max-lg:group-data-[open=false]/gnb:flex lg:group-data-[open=true]/gnb:flex">
          <NotificationButton {...notificationProps} compact />
        </div>
      </header>

      {/* 모바일: 기존 헤더까지 덮으며 위에서 내려오는 메뉴 */}
      <div
        ref={menuRef}
        id="gnb-menu"
        style={closeImmediately ? { transitionDuration: '0s' } : undefined}
        className="absolute top-[-100dvh] left-0 z-30 flex h-dvh min-h-0 w-full flex-col gap-6 overflow-hidden bg-white-section pt-4 pb-14 transition-[top,visibility] duration-500 ease-out group-data-[open=false]/gnb:pointer-events-none group-data-[open=false]/gnb:invisible group-data-[open=true]/gnb:top-0 motion-reduce:transition-none md:relative md:top-auto md:h-auto md:flex-1 md:pb-9 md:group-data-[open=false]/gnb:pointer-events-auto md:group-data-[open=false]/gnb:visible md:group-data-[open=true]/gnb:top-auto"
      >
        <div className="flex min-h-0 w-full flex-1 flex-col motion-reduce:transition-none md:px-8 md:transition-[opacity,visibility] md:duration-400 md:ease-out md:group-data-[open=false]/gnb:pointer-events-none md:group-data-[open=false]/gnb:invisible md:group-data-[open=false]/gnb:opacity-0 md:max-lg:group-data-[open=false]/gnb:duration-150 lg:group-data-[open=false]/gnb:pointer-events-auto lg:group-data-[open=false]/gnb:visible lg:group-data-[open=false]/gnb:opacity-100 lg:group-data-[open=true]/gnb:pointer-events-none lg:group-data-[open=true]/gnb:invisible lg:group-data-[open=true]/gnb:opacity-0 lg:group-data-[open=true]/gnb:duration-150">
          {/* 모바일에서 메뉴를 펼쳤을 때 표시하는 로고·닫기 버튼 */}
          <div className="shrink-0 pt-10 md:hidden">
            <Link href="/dashboard" className="block w-83.75 max-w-full">
              <Image
                src="/icons/gnb/logo.svg"
                alt="Slid to-do 대시보드"
                width={284}
                height={80}
                className="h-auto w-full"
              />
            </Link>
            <button
              type="button"
              className="absolute top-4 right-4 flex size-8 items-center justify-center"
              aria-label="메뉴 닫기"
              onClick={closeMenu}
            >
              <span
                className="flex size-6 items-center justify-center"
                aria-hidden="true"
              >
                <Image
                  src="/icons/gnb/close.svg"
                  alt=""
                  width={14}
                  height={14}
                  className="size-3.5"
                />
              </span>
            </button>
          </div>

          <div className="min-h-0 flex-1 scrollbar-thin overflow-x-hidden overflow-y-auto overscroll-contain px-5 md:px-0">
            <nav aria-label="주 메뉴">
              <ul className="space-y-3">
                <li>
                  <SideMenuLink
                    href="/dashboard"
                    title="대시보드"
                    icon="dashboard"
                    active={activeMenu === 'dashboard'}
                  />
                </li>
                {/* 시연에서는 목표 메뉴를 숨깁니다. 목표 목록 연동 후 복구합니다. */}
                <li hidden>
                  <SideMenuAccordion
                    title="목표"
                    href="/"
                    icon={
                      <SideMenuIcon
                        name="flag"
                        active={activeMenu === 'goal'}
                      />
                    }
                    active={activeMenu === 'goal'}
                  >
                    {/* 임시 목표 목록입니다. 실제 목표 데이터와 주소로 교체합니다.
                        개발 연동: 아래 Link의 data-active를 선택한 목표 여부에 연결해주세요.
                        예: data-active={selectedGoalId === goal.id}
                        true이면 글자색만 orange-700(#DC5203)으로 표시합니다.
                        false이면 기본 스타일을 표시합니다.
                        data-active는 li가 아닌 Link에 지정하며, 선택한 항목만 true로 유지해주세요.
                        현재 임시 항목은 활성화하지 않습니다.
                    */}
                    <li>
                      <Link
                        href="#"
                        data-active="false"
                        className="block truncate px-6 py-2 focus-visible:outline-2 focus-visible:outline-orange-500 data-[active=false]:hover:text-orange-700 data-[active=true]:text-orange-700"
                      >
                        자바스크립트로 웹 서비스 만들기
                      </Link>
                    </li>

                    <li>
                      <Link
                        href="#"
                        data-active="false"
                        className="block truncate px-6 py-2 focus-visible:outline-2 focus-visible:outline-orange-500 data-[active=false]:hover:text-orange-700 data-[active=true]:text-orange-700"
                      >
                        자바스크립트로 웹 서비스 만들기
                      </Link>
                    </li>
                  </SideMenuAccordion>
                </li>
                <li>
                  <SideMenuLink
                    href="/calendar"
                    title="캘린더"
                    icon="calendar"
                    active={activeMenu === 'calendar'}
                  />
                </li>
                <li>
                  <SideMenuLink
                    href="/posts"
                    title="소통 게시판"
                    icon="message"
                    active={activeMenu === 'board'}
                  />
                </li>
                <li>
                  <SideMenuLink
                    href="/notes"
                    title="노트 모아보기"
                    icon="note"
                    active={activeMenu === 'notes'}
                  />
                </li>
              </ul>
            </nav>
            <div className="mt-3 md:mt-6">
              <ul>
                <li hidden>
                  <Link
                    href="#"
                    className="flex h-11 w-full items-center gap-2 rounded-2xl px-4 py-0 font-normal text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grayscale-500 md:h-14 md:text-lg"
                  >
                    <SideMenuIcon name="setting" />
                    <span>설정</span>
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onLogout}
                    disabled={isLoggingOut || !onLogout}
                    className="flex h-11 w-full cursor-pointer items-center gap-2 rounded-2xl px-4 py-0 font-normal text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grayscale-500 disabled:cursor-not-allowed disabled:opacity-50 md:h-14 md:text-lg"
                  >
                    <SideMenuIcon name="logout" />
                    <span>{isLoggingOut ? '로그아웃 중…' : '로그아웃'}</span>
                  </button>
                </li>
              </ul>
            </div>

            <div className="mt-6 mb-4 md:mt-25 md:mb-8">
              <ul className="grid grid-cols-2 gap-2">
                <li className="flex min-w-0 justify-center">
                  <ActionButton
                    variant="goal"
                    className="cursor-pointer"
                    disabled={!onCreateGoal}
                    onClick={() => {
                      closeMenu();
                      onCreateGoal?.();
                    }}
                  />
                </li>
                <li className="flex min-w-0 justify-center">
                  <ActionButton
                    variant="task"
                    className="cursor-pointer"
                    disabled={!onCreateTodo}
                    onClick={() => {
                      closeMenu();
                      onCreateTodo?.();
                    }}
                  />
                </li>
              </ul>
            </div>

            <div>
              <ul className="flex flex-col items-start gap-2 md:flex-row md:items-center">
                <li className="w-full md:w-56 md:shrink-0">
                  {/* 사용자 정보는 연결 컴포넌트에서 전달합니다. 내 정보 관리 경로는 추후 연결합니다. */}
                  <Link
                    href="#"
                    aria-label="내 정보 관리"
                    className="flex h-16 w-full items-center gap-2 rounded-full border border-solid border-subtle p-3 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
                  >
                    <Image
                      src="/images/gnb/img_profile.jpg"
                      alt=""
                      width={38}
                      height={38}
                      className="size-9.5 shrink-0 rounded-full object-cover"
                    />
                    <span className="min-w-0">
                      <span className="flex items-center font-medium tracking-[-0.03em] text-foreground">
                        <span className="truncate">{userName}</span>
                        <span
                          aria-hidden="true"
                          className="size-4 shrink-0 bg-grayscale-400"
                          style={{
                            maskImage: 'url(/icons/gnb/icon_arrow_right.svg)',
                            maskSize: '0.3125rem 0.5rem',
                            maskPosition: 'center',
                            maskRepeat: 'no-repeat',
                          }}
                        />
                      </span>
                      <span className="block truncate font-normal text-subtle">
                        {userEmail}
                      </span>
                    </span>
                  </Link>
                </li>
                {/* 모바일에서는 숨깁니다. md 이상은 펼친 메뉴에서만 접근 가능합니다. */}
                <li className="hidden shrink-0 md:block">
                  <NotificationButton {...notificationProps} />
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// 활성 여부는 부모에서 전달합니다. 링크와 아이콘이 같은 active를 사용합니다.
function SideMenuLink({
  href,
  title,
  icon,
  active,
}: {
  href: string;
  title: string;
  icon: SideMenuIconName;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      data-active={active}
      aria-current={active ? 'page' : undefined}
      className="group/menu-item flex h-11 w-full items-center gap-2 overflow-hidden rounded-[20px] px-4 py-0 font-semibold text-foreground hover:text-orange-menu-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grayscale-500 data-[active=true]:bg-orange-menu-background data-[active=true]:font-bold data-[active=true]:text-orange-menu-active md:h-14 md:py-3.5 md:text-lg"
    >
      <SideMenuIcon name={icon} active={active} />
      <span className="min-w-0 flex-1 truncate">{title}</span>
    </Link>
  );
}

// SVG를 마스크로 사용해 원본 모양을 유지하면서 상태별 색상을 적용합니다.
type SideMenuIconName =
  | 'dashboard'
  | 'flag'
  | 'calendar'
  | 'message'
  | 'star'
  | 'setting'
  | 'logout'
  | 'note';

function SideMenuIcon({
  name,
  active = false,
}: {
  name: SideMenuIconName;
  active?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      data-active={active}
      className="size-6 shrink-0 bg-grayscale-300 group-hover/menu-item:bg-orange-menu-active data-[active=true]:bg-orange-menu-active"
      style={{
        maskImage: `url(/icons/gnb/icon_${name}.svg)`,
        maskSize: 'contain',
        maskPosition: 'center',
        maskRepeat: 'no-repeat',
      }}
    />
  );
}

// ── 재사용 가능한 사이드 메뉴 아코디언 ──
// 각 사용 위치마다 상태와 ID가 독립적입니다. 추후 타입과 함수를 별도 파일로 옮길 수 있습니다.
type SideMenuAccordionProps = {
  title: string;
  href: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  active?: boolean;
  children: ReactNode;
};

function SideMenuAccordion({
  title,
  href,
  icon,
  defaultOpen = false,
  active = false,
  children,
}: SideMenuAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className="group/side-menu-accordion" data-open={isExpanded}>
      {/* 제목 링크는 페이지 선택, 화살표 버튼은 펼침만 담당합니다. 서로 중첩하지 않습니다. */}
      <div
        data-active={active}
        className="group/menu-item flex h-11 w-full items-center gap-2 overflow-hidden rounded-[20px] px-4 py-0 text-left font-semibold text-foreground hover:text-orange-menu-active data-[active=true]:bg-orange-menu-background data-[active=true]:font-bold data-[active=true]:text-orange-menu-active md:h-14 md:py-3.5 md:text-lg"
      >
        <Link
          href={href}
          data-active={active}
          aria-current={active ? 'page' : undefined}
          className="flex min-w-0 flex-1 items-center gap-2 self-stretch focus-visible:outline-2 focus-visible:outline-grayscale-500"
        >
          {icon && (
            <span className="flex shrink-0 items-center" aria-hidden="true">
              {icon}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate">{title}</span>
        </Link>
        <button
          type="button"
          aria-label={`${title} 목록 ${isExpanded ? '접기' : '펼치기'}`}
          aria-expanded={isExpanded}
          aria-controls={panelId}
          onClick={() => setIsExpanded((previous) => !previous)}
          className="flex w-6 shrink-0 items-center justify-center self-stretch focus-visible:outline-2 focus-visible:outline-grayscale-500"
        >
          <span
            aria-hidden="true"
            data-active={active}
            className="size-6 shrink-0 rotate-180 bg-grayscale-400 transition-transform duration-300 group-data-[open=true]/side-menu-accordion:rotate-0 data-[active=true]:bg-orange-700 motion-reduce:transition-none"
            style={{
              maskImage: 'url(/icons/gnb/icon_arrow_up.svg)',
              maskSize: 'contain',
              maskPosition: 'center',
              maskRepeat: 'no-repeat',
            }}
          />
        </button>
      </div>

      {/* 높이 애니메이션 영역. 닫는 즉시 내부 키보드·스크린리더 접근도 차단합니다. */}
      <div
        id={panelId}
        inert={!isExpanded}
        aria-hidden={!isExpanded}
        className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-data-[open=true]/side-menu-accordion:grid-rows-[1fr] motion-reduce:transition-none"
      >
        <div className="min-h-0 overflow-hidden">
          {/* 모바일은 높이 제한 없이, md 이상은 최대 6.5rem(104px)까지 표시 후 내부 스크롤합니다. */}
          <div className="scrollbar-thin md:max-h-26 md:overflow-y-auto md:overscroll-contain">
            <ul className="pt-2 text-sm font-semibold">{children}</ul>
          </div>
        </div>
      </div>
    </div>
  );
}

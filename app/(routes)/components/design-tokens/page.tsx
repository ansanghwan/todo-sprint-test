// TODO: [2026.09.21] Storybook 문서 전환 검토 (yjc2021 제안, 팀 합의 후 결정)
'use client';

import { useState, type CSSProperties } from 'react';
import SearchInput from '@/components/ui/SearchInput';
import { colors, typography, weights, themeTokens, shadows } from './tokens';

export default function DesignTokensPage() {
  const [message, setMessage] = useState('클래스명 버튼을 누르면 복사됩니다.');

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${value} 복사 완료`);
    } catch {
      setMessage(
        '복사하지 못했습니다. 클래스명 텍스트를 직접 선택해 복사해주세요.',
      );
    }
  }

  function classButton(value: string) {
    return (
      <button
        type="button"
        onClick={() => void copy(value)}
        aria-label={`${value} 클래스 복사`}
        className="max-w-full rounded-lg border border-grayscale-200 bg-white px-3 py-2 text-left font-mono text-xs break-all text-grayscale-700 hover:bg-grayscale-100 focus-visible:outline-2 focus-visible:outline-primary-600"
      >
        {value}
      </button>
    );
  }

  return (
    <main className="min-h-dvh bg-grayscale-100 px-4 py-10 font-sans text-base text-grayscale-800 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="space-y-4">
          <p className="text-sm font-semibold text-primary-700">
            TEAM STYLE GUIDE
          </p>
          <h1 className="text-3xl font-bold">
            컬러 · 폰트 · 테마 · 그림자 클래스
          </h1>
          <p>
            미리보기를 비교하고 필요한 클래스명을 눌러 복사하세요. 크기는 기본
            16px 기준입니다.
          </p>
          <nav
            aria-label="토큰 가이드 목차"
            className="flex flex-wrap gap-4 text-sm font-semibold text-primary-700"
          >
            <a href="#theme">테마 색상</a>
            <a href="#palette">고정 컬러 팔레트</a>
            <a href="#typography">폰트 크기</a>
            <a href="#weight">폰트 굵기 · 서체</a>
            <a href="#shadow">그림자</a>
          </nav>
          <p
            role="status"
            aria-live="polite"
            className="rounded-lg bg-white p-3 text-sm text-grayscale-600"
          >
            {message}
          </p>
        </header>

        <section id="theme" aria-labelledby="theme-title" className="space-y-5">
          <h2 id="theme-title" className="text-2xl font-bold">
            테마에 따라 바뀌는 색상
          </h2>
          <p>
            같은 클래스를 사용하면 OS의 라이트·다크 설정에 따라 색상이 바뀝니다.
            아래는 비교용 미리보기이며 실제 앱 테마를 변경하지 않습니다. 다크
            색상은 현재 등록된 검토용 값입니다.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {(['light', 'dark'] as const).map((mode) => (
              <div
                key={mode}
                style={
                  Object.fromEntries(
                    themeTokens.map((token) => [token.variable, token[mode]]),
                  ) as CSSProperties
                }
                className="rounded-2xl bg-background p-5 text-foreground"
              >
                <h3 className="mb-4 text-lg font-bold text-heading">
                  {mode === 'light' ? '라이트' : '다크'} 미리보기
                </h3>
                <p className="mb-4 text-sm">바깥 배경: bg-background</p>
                <div className="space-y-3 rounded-xl bg-white-section p-5">
                  <p className="text-sm text-muted">
                    카드 배경: bg-white-section
                  </p>
                  <p className="text-xl font-bold text-heading">
                    제목 · text-heading
                  </p>
                  <p className="text-foreground">본문 · text-foreground</p>
                  <p className="text-muted">보조 설명 · text-muted</p>
                  <p className="text-subtle">안내 문구 · text-subtle</p>
                  <div className="rounded-lg border border-subtle p-3 text-sm text-foreground">
                    연한 일반 테두리 · border border-subtle
                  </div>
                  <div className="rounded-lg border border-default p-3 text-sm text-foreground">
                    인풋 테두리 · border border-default
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-foreground">
                      SearchInput default · 48px / 16px / 400
                    </p>
                    <SearchInput
                      aria-label="할 일 검색"
                      placeholder="할 일을 검색해주세요"
                    />
                    <p className="pt-2 text-sm text-foreground">
                      SearchInput sm · 40px / 14px
                    </p>
                    <SearchInput
                      size="sm"
                      aria-label="할 일 검색"
                      placeholder="할 일을 검색해주세요"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto rounded-xl bg-white">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                테마 클래스별 용도와 라이트·다크 색상
              </caption>
              <thead>
                <tr className="border-b border-grayscale-200">
                  <th scope="col" className="p-4">
                    클래스 · 복사
                  </th>
                  <th scope="col" className="p-4">
                    용도
                  </th>
                  <th scope="col" className="p-4">
                    라이트
                  </th>
                  <th scope="col" className="p-4">
                    다크
                  </th>
                </tr>
              </thead>
              <tbody>
                {themeTokens.map((token) => (
                  <tr
                    key={token.className}
                    className="border-b border-grayscale-100"
                  >
                    <td className="p-4">{classButton(token.className)}</td>
                    <td className="p-4">{token.usage}</td>
                    <td className="p-4 font-mono">{token.light}</td>
                    <td className="p-4 font-mono">{token.dark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-grayscale-600">
            주황·청록 등 고유 배경과 그 안의 글자는 테마 변경 대상이 아닙니다.
            고정 팔레트와 text-white 등을 사용하세요. border-default와
            border-subtle은 색상만 지정하며, 테두리를 새로 추가하는 클래스가
            아닙니다.
          </p>
        </section>

        <section
          id="palette"
          aria-labelledby="palette-title"
          className="space-y-5"
        >
          <h2 id="palette-title" className="text-2xl font-bold">
            고정 컬러 팔레트
          </h2>
          <p>
            라이트·다크에서 같은 색상입니다. 배경은 bg-, 글자는 text-, 테두리는
            border-를 복사하세요. blue는 피그마에 지정된 청록 계열 이름입니다.
          </p>
          {['grayscale', 'orange', 'blue'].map((group) => (
            <div key={group} className="space-y-3">
              <h3 className="text-lg font-semibold">{group}</h3>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {colors
                  .filter((token) => token.name.startsWith(group))
                  .map((token) => (
                    <article
                      key={token.name}
                      className="min-w-0 overflow-hidden rounded-xl border border-grayscale-200 bg-white"
                    >
                      <div className="bg-white">
                        <div
                          className={`${token.background} h-12`}
                          aria-label={`${token.name} 색상 미리보기`}
                        />
                      </div>
                      <div className="space-y-2 p-3">
                        <h4 className="text-sm font-semibold wrap-break-word">
                          {token.name}
                        </h4>
                        <p className="font-mono text-xs text-grayscale-600">
                          {token.value}
                        </p>
                        {token.name.includes('alpha') && (
                          <p className="text-xs text-grayscale-600">
                            흰 배경 위의 반투명 색상입니다.
                          </p>
                        )}
                        <div className="grid gap-1.5">
                          {classButton(token.background)}
                          {classButton(token.text)}
                          {classButton(token.border)}
                        </div>
                      </div>
                    </article>
                  ))}
              </div>
            </div>
          ))}
        </section>

        <section
          id="typography"
          aria-labelledby="typography-title"
          className="space-y-5"
        >
          <h2 id="typography-title" className="text-2xl font-bold">
            폰트 크기 · 줄 높이
          </h2>
          <p>
            text-*에는 글자 크기와 줄 높이가 함께 등록되어 있습니다. display
            계열은 기본 굵기 700을 포함합니다. 큰 글자는 미리보기 안에서 가로로
            스크롤할 수 있습니다.
          </p>
          <div className="space-y-3">
            {typography.map((token) => (
              <article
                key={token.className}
                className="min-w-0 rounded-xl bg-white p-5"
              >
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  {classButton(token.className)}
                  <p className="text-sm text-grayscale-600">
                    크기 / 줄 높이: {token.pixels} · {token.size} /{' '}
                    {token.lineHeight}
                  </p>
                </div>
                <div className="overflow-x-auto py-2">
                  <p className={`${token.className} whitespace-nowrap`}>
                    오늘의 목표를 기록해요 Aa 123
                  </p>
                </div>
              </article>
            ))}
          </div>
          <p className="text-sm text-grayscale-600">
            text-display-xl은 시안 기준 80px / 74px입니다. 여러 줄 제목에 사용할
            때 글자 겹침 여부를 확인해주세요.
          </p>
        </section>

        <section
          id="weight"
          aria-labelledby="weight-title"
          className="space-y-5"
        >
          <h2 id="weight-title" className="text-2xl font-bold">
            폰트 굵기 · 서체
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {weights.map((token) => (
              <article
                key={token.className}
                className="space-y-4 rounded-xl bg-white p-5"
              >
                {classButton(token.className)}
                <p className="text-sm">font-weight: {token.value}</p>
                <p className={`${token.className} text-xl`}>
                  오늘의 목표를 기록해요 Aa 123
                </p>
              </article>
            ))}
          </div>
          <div className="space-y-4 rounded-xl bg-white p-5">
            <p className="font-pretendard text-lg">
              Pretendard Variable · 프리텐다드 가변 폰트
            </p>
            <div className="flex flex-wrap gap-2">
              {classButton('font-pretendard')}
              {classButton('font-sans')}
            </div>
            <p className="text-sm text-grayscale-600">
              현재 두 클래스 모두 프리텐다드로 연결됩니다. CDN 로딩 전에는 대체
              서체가 보일 수 있습니다.
            </p>
            <p>조합 예시: 본문 16px / 굵기 600 / 테마 기본 글자색</p>
            {classButton('text-base font-semibold text-foreground')}
          </div>
        </section>
        <section
          id="shadow"
          aria-labelledby="shadow-title"
          className="space-y-5"
        >
          <h2 id="shadow-title" className="text-2xl font-bold">
            그림자
          </h2>
          <p>
            검정 약 5%의 은은한 그림자입니다. 라이트·다크에서 같은 값을
            사용하며, 다크 배경에서는 덜 보입니다. md·lg는 그림자 토큰 이름이며
            화면 크기를 뜻하지 않습니다.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {shadows.map((token) => (
              <article
                key={token.className}
                className="min-w-0 rounded-xl bg-white p-5"
              >
                <div className="flex items-center justify-center px-6 py-12">
                  <div
                    className={`${token.className} flex h-32 w-full max-w-64 items-center justify-center rounded-2xl bg-white text-lg font-semibold`}
                  >
                    {token.className}
                  </div>
                </div>
                <div className="space-y-3">
                  {classButton(token.className)}
                  <p className="text-sm">번짐 {token.blur} · 이동 0 · 확산 0</p>
                  <p className="font-mono text-xs break-all text-grayscale-600">
                    {token.value}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <div className="space-y-3 rounded-xl bg-white p-5">
            <p>반응형 적용 예시: 기본 그림자 없음 → 태블릿 md → PC lg</p>
            {classButton('md:shadow-md lg:shadow-lg')}
            <p className="text-sm text-grayscale-600">
              이 두 클래스는 Tailwind 기본 그림자 값을 프로젝트 시안 값으로
              대체합니다.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

/** 'mailto:', 'ftp://'처럼 스킴이 적혀 있는지 봅니다. 'example.com:8080'처럼 콜론 뒤가 숫자(포트)면 스킴이 아닙니다. */
const EXPLICIT_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:(?!\d)/i;
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

type ParsedLinkUrl = { success: true; url?: string } | { success: false };

/**
 * FN-TD-25의 링크 입력을 전송값으로 바꿉니다.
 * 1. 앞뒤 공백 제거  2. 비어 있으면 선택값이라 통과(url 없음)
 * 3. 스킴이 없으면 https:// 추가  4. URL로 해석되는지 확인  5. 프로토콜이 http·https인지 확인
 * 스킴이 적혀 있는데 http·https가 아니면(ftp:, mailto:, javascript: 등) 실패입니다.
 */
export const parseLinkUrl = (link: string): ParsedLinkUrl => {
  const trimmed = link.trim();
  if (!trimmed) {
    return { success: true };
  }

  const candidate = EXPLICIT_SCHEME_PATTERN.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const { protocol } = new URL(candidate);
    if (!ALLOWED_PROTOCOLS.includes(protocol)) {
      return { success: false };
    }
  } catch {
    return { success: false };
  }

  return { success: true, url: candidate };
};

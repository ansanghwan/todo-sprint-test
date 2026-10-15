/** 미리보기용: HTML 본문에서 태그를 빼고 글자만 남깁니다. 화면에는 텍스트로만 출력하세요. */
export function htmlToText(html: string) {
  return html
    .replace(/<\/(p|li|h[1-6])>/g, ' ') // 문단이 붙지 않게 공백
    .replace(/<[^>]*>/g, '') // 나머지 태그 제거
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&') // &amp;는 마지막에 (두 번 바뀌지 않게)
    .replace(/\s+/g, ' ')
    .trim();
}

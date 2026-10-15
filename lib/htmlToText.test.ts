import { describe, expect, it } from 'vitest';
import { htmlToText } from '@/lib/htmlToText';

describe('htmlToText', () => {
  it('태그를 지우고 문단 사이는 공백 하나로 잇는다', () => {
    expect(htmlToText('<p>첫 문단</p><p>둘째 문단</p>')).toBe(
      '첫 문단 둘째 문단',
    );
  });

  it('굵게·정렬 같은 서식 태그와 속성을 지운다', () => {
    expect(
      htmlToText(
        '<p style="text-align: center"><strong>안녕</strong> <em>하세요</em></p>',
      ),
    ).toBe('안녕 하세요');
  });

  it('목록 항목을 공백으로 구분한다', () => {
    expect(htmlToText('<ul><li><p>사과</p></li><li><p>배</p></li></ul>')).toBe(
      '사과 배',
    );
  });

  it('HTML 엔티티를 원래 글자로 되돌린다', () => {
    expect(
      htmlToText(
        '<p>a &lt; b &amp;&amp; c &gt; d &quot;e&quot; &#39;f&#39;&nbsp;g</p>',
      ),
    ).toBe(`a < b && c > d "e" 'f' g`);
  });

  it('&amp;lt;처럼 이중으로 인코딩된 글자는 한 번만 되돌린다', () => {
    expect(htmlToText('<p>&amp;lt;</p>')).toBe('&lt;');
  });

  it('연속된 공백·줄바꿈을 하나로 줄이고 앞뒤 공백을 지운다', () => {
    expect(htmlToText('  <p>a\n\n  b</p>  ')).toBe('a b');
  });

  it('태그가 없는 예전 일반 텍스트는 그대로 둔다', () => {
    expect(htmlToText('그냥 글')).toBe('그냥 글');
  });

  it('빈 문단만 있으면 빈 문자열을 돌려준다', () => {
    expect(htmlToText('<p></p>')).toBe('');
  });
});

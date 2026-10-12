import { describe, expect, it } from 'vitest';

import { parseLinkUrl } from './linkUrl';

describe('parseLinkUrl', () => {
  it('비어 있거나 공백뿐이면 선택값이라 통과하고 보낼 값이 없다', () => {
    expect(parseLinkUrl('')).toEqual({ success: true });
    expect(parseLinkUrl('   ')).toEqual({ success: true });
  });

  it.each([
    ['example.com', 'https://example.com'],
    ['  example.com  ', 'https://example.com'],
    ['example.com:8080/path', 'https://example.com:8080/path'],
    ['localhost:3000', 'https://localhost:3000'],
    ['http://example.com', 'http://example.com'],
    ['HTTPS://Example.com', 'HTTPS://Example.com'],
  ])('"%s" → "%s"', (input, url) => {
    expect(parseLinkUrl(input)).toEqual({ success: true, url });
  });

  it.each([
    'hello world',
    'https://',
    'ftp://x',
    'mailto:x@example.com',
    'javascript:alert(1)',
    'data:text/html,hi',
  ])('"%s"는 실패한다', (input) => {
    expect(parseLinkUrl(input)).toEqual({ success: false });
  });
});

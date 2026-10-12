import { describe, expect, it } from 'vitest';

import { hasImageExtension, IMAGE_ACCEPT } from './imageFile';

describe('hasImageExtension (FN-TD-26)', () => {
  it.each(['a.jpg', 'a.jpeg', 'a.png', 'a.gif', 'a.webp', 'a.svg', 'A.PNG'])(
    '%s는 첨부할 수 있다',
    (name) => {
      expect(hasImageExtension(name)).toBe(true);
    },
  );

  it.each(['a.bmp', 'a.pdf', 'a.png.exe', 'png', 'a.'])(
    '%s는 첨부할 수 없다',
    (name) => {
      expect(hasImageExtension(name)).toBe(false);
    },
  );

  it('파일 선택 창에는 허용 확장자만 넘긴다', () => {
    expect(IMAGE_ACCEPT).toBe('.jpg,.jpeg,.png,.gif,.webp,.svg');
  });
});

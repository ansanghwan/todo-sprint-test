import { vi } from 'vitest';

/**
 * jsdom에 없는 브라우저 API 중 Radix Select·Popover가 쓰는 것만 채웁니다.
 * 필요한 테스트 파일의 beforeEach에서 부릅니다 (vi.unstubAllGlobals로 되돌립니다).
 */
export const installRadixDomMocks = () => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
};

/**
 * IntersectionObserver 대역. 감시 중(observe 후 disconnect 전)인 observer에만 알립니다.
 * 돌려주는 함수를 부르면 감시 요소가 화면에 들어온 상황을 만듭니다.
 */
export const stubIntersectionObserver = () => {
  const activeCallbacks = new Set<IntersectionObserverCallback>();

  vi.stubGlobal(
    'IntersectionObserver',
    class {
      private callback: IntersectionObserverCallback;
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
      }
      observe() {
        activeCallbacks.add(this.callback);
      }
      disconnect() {
        activeCallbacks.delete(this.callback);
      }
    },
  );

  return () =>
    activeCallbacks.forEach((callback) =>
      callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    );
};

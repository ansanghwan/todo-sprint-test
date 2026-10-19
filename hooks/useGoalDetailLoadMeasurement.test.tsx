import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import useGoalDetailLoadMeasurement from './useGoalDetailLoadMeasurement';

let frames: Map<number, FrameRequestCallback>;
let marks: Set<string>;
let navigationType: string;
const measure = vi.fn((): PerformanceMeasure => ({
  duration: 1234.5,
  detail: null,
  entryType: 'measure',
  name: 'goal-detail:initial-data-visible',
  startTime: 0,
  toJSON: () => ({}),
}));

beforeEach(() => {
  window.history.replaceState({}, '', '/goals/705?goalPerf=1');
  frames = new Map();
  marks = new Set();
  navigationType = 'reload';
  let id = 0;
  vi.spyOn(performance, 'getEntriesByType').mockImplementation(() => [
    {
      type: navigationType,
      name: window.location.href,
    } as PerformanceNavigationTiming,
  ]);
  vi.spyOn(performance, 'getEntriesByName').mockImplementation((name) =>
    marks.has(name) ? ([{}] as PerformanceEntry[]) : [],
  );
  vi.spyOn(performance, 'mark').mockImplementation((name) => {
    marks.add(name);
    return {} as PerformanceMark;
  });
  vi.spyOn(performance, 'measure').mockImplementation(measure);
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++id, callback);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (frame: number) =>
    frames.delete(frame),
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  measure.mockClear();
});

function nextFrame() {
  act(() => {
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach((callback) => callback(0));
  });
}

it('waits for readiness and two frames, then measures once from navigation zero', () => {
  const { rerender } = renderHook(
    ({ ready }) => useGoalDetailLoadMeasurement(ready, false),
    { initialProps: { ready: false } },
  );
  expect(frames.size).toBe(0);
  rerender({ ready: true });
  nextFrame();
  expect(measure).not.toHaveBeenCalled();
  nextFrame();
  expect(measure).toHaveBeenCalledWith('goal-detail:initial-data-visible', {
    start: 0,
    end: 'goal-detail:initial-data-visible:end',
  });
  rerender({ ready: false });
  rerender({ ready: true });
  expect(measure).toHaveBeenCalledTimes(1);
});

it('does nothing without explicit measurement opt-in', () => {
  window.history.replaceState({}, '', '/goals/705');
  renderHook(() => useGoalDetailLoadMeasurement(true, false));
  expect(frames.size).toBe(0);
});

it('does not measure a normal navigation as a reload', () => {
  navigationType = 'navigate';
  renderHook(() => useGoalDetailLoadMeasurement(true, false));
  expect(frames.size).toBe(0);
});

it('does not count an error as success even after recovery', () => {
  const { rerender } = renderHook(
    ({ failed }) => useGoalDetailLoadMeasurement(true, failed),
    { initialProps: { failed: true } },
  );
  rerender({ failed: false });
  nextFrame();
  nextFrame();
  expect(measure).not.toHaveBeenCalled();
});

it('invalidates a sample when the tab becomes hidden', () => {
  renderHook(() => useGoalDetailLoadMeasurement(true, false));
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  nextFrame();
  nextFrame();
  expect(measure).not.toHaveBeenCalled();
});

it('invalidates a sample after user interaction', () => {
  renderHook(() => useGoalDetailLoadMeasurement(true, false));
  act(() => window.dispatchEvent(new Event('pointerdown')));
  nextFrame();
  nextFrame();
  expect(measure).not.toHaveBeenCalled();
});

it('cancels pending frames on unmount and avoids duplicate document results', () => {
  const { unmount } = renderHook(() =>
    useGoalDetailLoadMeasurement(true, false),
  );
  nextFrame();
  unmount();
  nextFrame();
  expect(measure).not.toHaveBeenCalled();
  marks.add('goal-detail:initial-data-visible');
  renderHook(() => useGoalDetailLoadMeasurement(true, false));
  expect(frames.size).toBe(0);
});

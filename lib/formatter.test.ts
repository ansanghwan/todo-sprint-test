import { describe, expect, it } from 'vitest';
import { getElapsedTime } from './formatter';

const now = new Date('2026-02-16T12:00:00.000Z');

describe('getElapsedTime', () => {
  it.each([
    ['2026-02-16T11:59:30.000Z', 'now', 0],
    ['2026-02-16T11:55:00.000Z', 'minute', 5],
    ['2026-02-16T11:00:00.000Z', 'hour', 1],
    ['2026-02-13T12:00:00.000Z', 'day', 3],
    ['2025-12-16T12:00:00.000Z', 'month', 2],
    ['2025-02-16T12:00:00.000Z', 'year', 1],
  ])('%s → %s %i', (createdAt, unit, count) => {
    expect(getElapsedTime(createdAt, now)).toEqual({ unit, count });
  });
});

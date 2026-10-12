import { describe, expect, it } from 'vitest';
import { formatDateToRelativeTime } from './formatter';

const now = new Date('2026-02-16T12:00:00.000Z');

describe('formatDateToRelativeTime', () => {
  it.each([
    ['2026-02-16T11:59:30.000Z', '방금'],
    ['2026-02-16T11:55:00.000Z', '5분'],
    ['2026-02-16T11:00:00.000Z', '1시간'],
    ['2026-02-13T12:00:00.000Z', '3일'],
    ['2025-12-16T12:00:00.000Z', '2개월'],
    ['2025-02-16T12:00:00.000Z', '1년'],
  ])('%s → %s', (createdAt, expected) => {
    expect(formatDateToRelativeTime(createdAt, now)).toBe(expected);
  });
});

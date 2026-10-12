import { describe, expect, it } from 'vitest';

import { makeTodo } from '@/test/todoMocks';
import {
  addMonths,
  getCalendarDays,
  groupTodosByDueDate,
  toKstDateKey,
} from './calendarDates';

describe('calendarDates', () => {
  it('월요일부터 시작해 그 달이 걸치는 주만 만든다', () => {
    const days = getCalendarDays('2025-01');

    expect(days).toHaveLength(35);
    expect(days[0]).toBe('2024-12-30');
    expect(days.at(-1)).toBe('2025-02-02');
  });

  it('6주에 걸치는 달은 6주를 만든다', () => {
    const days = getCalendarDays('2025-03');

    expect(days).toHaveLength(42);
    expect(days[0]).toBe('2025-02-24');
    expect(days.at(-1)).toBe('2025-04-06');
  });

  it('4주로 끝나는 달은 4주만 만든다', () => {
    const days = getCalendarDays('2027-02');

    expect(days).toHaveLength(28);
    expect(days[0]).toBe('2027-02-01');
    expect(days.at(-1)).toBe('2027-02-28');
  });

  it('1일이 월요일이면 그날부터 시작한다', () => {
    expect(getCalendarDays('2025-09')[0]).toBe('2025-09-01');
  });

  it('해를 넘겨 월을 이동한다', () => {
    expect(addMonths('2025-01', -1)).toBe('2024-12');
    expect(addMonths('2025-12', 1)).toBe('2026-01');
  });

  it('날짜는 KST 기준으로 구한다', () => {
    expect(toKstDateKey('2025-01-09T15:00:00.000Z')).toBe('2025-01-10');
    expect(toKstDateKey('2025-01-09T14:59:59.000Z')).toBe('2025-01-09');
  });

  it('마감일이 없는 할 일은 날짜에 배치하지 않는다', () => {
    const todosByDate = groupTodosByDueDate([
      makeTodo(1, { dueDate: '2025-01-10T00:00:00.000Z' }),
      makeTodo(2, { dueDate: null }),
    ]);

    expect([...todosByDate.keys()]).toEqual(['2025-01-10']);
    expect(todosByDate.get('2025-01-10')).toHaveLength(1);
  });
});

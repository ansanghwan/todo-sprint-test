import type { TodoDto } from '@/types/api/todo';

/** 'YYYY-MM-DD' */
export type DateKey = string;
/** 'YYYY-MM' */
export type MonthKey = string;

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DAYS_IN_WEEK = 7;
const DATE_KEY_LENGTH = 10;
const MONTH_KEY_LENGTH = 7;

const toDateKey = (utcDate: Date): DateKey =>
  utcDate.toISOString().slice(0, DATE_KEY_LENGTH);

export const toKstDateKey = (date: Date | string): DateKey =>
  toDateKey(new Date(new Date(date).getTime() + KST_OFFSET_MS));

export const getMonthKey = (dateKey: DateKey): MonthKey =>
  dateKey.slice(0, MONTH_KEY_LENGTH);

export const isInMonth = (dateKey: DateKey, month: MonthKey) =>
  getMonthKey(dateKey) === month;

/** 그 달 1일의 UTC 자정 */
export const getFirstDay = (month: MonthKey) => new Date(`${month}-01`);

export const addMonths = (month: MonthKey, amount: number): MonthKey => {
  const firstDay = getFirstDay(month);
  firstDay.setUTCMonth(firstDay.getUTCMonth() + amount);
  return getMonthKey(toDateKey(firstDay));
};

/** 월요일부터 시작해 그 달이 걸치는 주(4~6주)의 날짜. 이전·다음 달 날짜를 포함합니다. */
export const getCalendarDays = (month: MonthKey): DateKey[] => {
  const firstDay = getFirstDay(month);
  const daysFromMonday =
    (firstDay.getUTCDay() + DAYS_IN_WEEK - 1) % DAYS_IN_WEEK;
  const gridStart = firstDay.getTime() - daysFromMonday * DAY_MS;
  const daysInMonth =
    (getFirstDay(addMonths(month, 1)).getTime() - firstDay.getTime()) / DAY_MS;
  const weekCount = Math.ceil((daysFromMonday + daysInMonth) / DAYS_IN_WEEK);

  return Array.from({ length: weekCount * DAYS_IN_WEEK }, (_, index) =>
    toDateKey(new Date(gridStart + index * DAY_MS)),
  );
};

export const getDayOfMonth = (dateKey: DateKey) =>
  Number(dateKey.slice(MONTH_KEY_LENGTH + 1));

/** 2025-01-10 → 2025. 01. 10 */
export const formatDateKey = (dateKey: DateKey) =>
  dateKey.replaceAll('-', '. ');

export const groupTodosByDueDate = (todos: TodoDto[]) => {
  const todosByDate = new Map<DateKey, TodoDto[]>();

  for (const todo of todos) {
    if (todo.dueDate === null) {
      continue;
    }
    const dateKey = toKstDateKey(todo.dueDate);
    todosByDate.set(dateKey, [...(todosByDate.get(dateKey) ?? []), todo]);
  }

  return todosByDate;
};

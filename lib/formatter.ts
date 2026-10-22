export const formatUtcDateToYmd = (date: string): string => {
  const parsedDate = new Date(date);

  const year = parsedDate.getUTCFullYear();
  const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getUTCDate()).padStart(2, '0');

  return `${year}.${month}.${day}`;
};

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

export type ElapsedTimeUnit =
  'now' | 'minute' | 'hour' | 'day' | 'month' | 'year';

/** 작성 후 지난 시간을 가장 큰 단위 하나로 나타냅니다. 문구는 화면이 번역합니다. */
export const getElapsedTime = (
  date: string,
  now = new Date(),
): { unit: ElapsedTimeUnit; count: number } => {
  const elapsed = now.getTime() - new Date(date).getTime();

  if (elapsed < MINUTE) {
    return { unit: 'now', count: 0 };
  }
  if (elapsed < HOUR) {
    return { unit: 'minute', count: Math.floor(elapsed / MINUTE) };
  }
  if (elapsed < DAY) {
    return { unit: 'hour', count: Math.floor(elapsed / HOUR) };
  }
  if (elapsed < MONTH) {
    return { unit: 'day', count: Math.floor(elapsed / DAY) };
  }
  if (elapsed < YEAR) {
    return { unit: 'month', count: Math.floor(elapsed / MONTH) };
  }
  return { unit: 'year', count: Math.floor(elapsed / YEAR) };
};

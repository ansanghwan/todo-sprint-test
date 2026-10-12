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

/** 작성 시간을 '방금', '5분', '1시간', '3일', '2개월', '1년' 형태로 변환합니다. */
export const formatDateToRelativeTime = (date: string, now = new Date()) => {
  const elapsed = now.getTime() - new Date(date).getTime();

  if (elapsed < MINUTE) {
    return '방금';
  }
  if (elapsed < HOUR) {
    return `${Math.floor(elapsed / MINUTE)}분`;
  }
  if (elapsed < DAY) {
    return `${Math.floor(elapsed / HOUR)}시간`;
  }
  if (elapsed < MONTH) {
    return `${Math.floor(elapsed / DAY)}일`;
  }
  if (elapsed < YEAR) {
    return `${Math.floor(elapsed / MONTH)}개월`;
  }
  return `${Math.floor(elapsed / YEAR)}년`;
};

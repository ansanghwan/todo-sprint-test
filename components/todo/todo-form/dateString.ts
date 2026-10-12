const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * 달력에서 고른 날짜를 폼 값 'YYYY-MM-DD'로 바꿉니다.
 * toISOString()은 UTC로 바꿔 KST 자정이 전날로 밀리므로, 로컬 연·월·일을 그대로 씁니다.
 */
export const toDateString = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** 폼 값 'YYYY-MM-DD'를 로컬 자정의 Date로 바꿉니다. 형식이 다르면 undefined */
export const parseDateString = (value: string) => {
  const match = DATE_PATTERN.exec(value);
  if (!match) {
    return undefined;
  }
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
};

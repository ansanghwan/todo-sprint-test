export type TagColor = 'green' | 'yellow' | 'red';

const TAG_COLOR_ORDER: TagColor[] = ['green', 'yellow', 'red'];

/**
 * 태그 색은 저장하지 않고, 현재 배열에서의 순서로 초록 → 노랑 → 빨강을 반복합니다.
 * 색은 장식이라 앞 태그를 지우면 뒤 태그의 색이 바뀔 수 있습니다. 서버에는 이름만 보냅니다.
 */
export const getTagColor = (index: number) =>
  TAG_COLOR_ORDER[index % TAG_COLOR_ORDER.length];

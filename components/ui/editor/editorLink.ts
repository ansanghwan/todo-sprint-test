import { getMarkRange, type Editor } from '@tiptap/react';

/** 링크 팝업을 연 순간의 적용 위치와, 그 위치에 이미 걸린 링크 주소 */
export interface EditorLinkTarget {
  from: number;
  to: number;
  /** 기존 링크를 고치는 경우의 주소. 새 링크면 없습니다. */
  href?: string;
}

/**
 * 링크 팝업을 열기 전에 적용 위치를 기억합니다.
 * 팝업 입력으로 포커스가 옮겨가도 이 위치에 적용하기 위해서입니다.
 * - 글자를 선택했으면 그 범위
 * - 선택 없이 커서가 링크 안에 있으면 그 링크 전체
 * - 그 밖에는 커서 위치(from === to)
 */
export const getEditorLinkTarget = (editor: Editor): EditorLinkTarget => {
  const { from, to, empty, $from } = editor.state.selection;
  const href = editor.getAttributes('link').href as string | undefined;

  if (empty && href) {
    const range = getMarkRange($from, editor.schema.marks.link);
    if (range) {
      return { ...range, href };
    }
  }
  return { from, to, href };
};

/**
 * FN-WR-04 (미리보기 카드 제외): 기억한 위치에 일반 링크를 넣습니다.
 * 범위가 있으면 그 글자에 링크를 걸고, 커서 위치면 URL 자체를 링크 텍스트로 넣습니다.
 */
export const applyEditorLink = (
  editor: Editor,
  { from, to }: EditorLinkTarget,
  url: string,
) => {
  if (from === to) {
    editor
      .chain()
      .focus()
      .insertContentAt(from, {
        type: 'text',
        text: url,
        marks: [{ type: 'link', attrs: { href: url } }],
      })
      .run();
    return;
  }
  editor
    .chain()
    .focus()
    .setTextSelection({ from, to })
    .setLink({ href: url })
    .run();
};

/** 기억한 위치의 링크를 해제합니다. 글자는 그대로 둡니다. */
export const removeEditorLink = (
  editor: Editor,
  { from, to }: EditorLinkTarget,
) => {
  editor.chain().focus().setTextSelection({ from, to }).unsetLink().run();
};

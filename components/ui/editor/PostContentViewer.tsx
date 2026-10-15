'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import { postEditorExtensions } from '@/components/ui/editor/PostEditor';

interface PostContentViewerProps {
  /** 게시글 본문 HTML */
  html: string;
}

/** 예전 일반 텍스트 게시글은 줄마다 문단으로 감싸 줄바꿈을 유지합니다. */
const toEditorHtml = (content: string) =>
  content.trimStart().startsWith('<')
    ? content
    : content
        .split('\n')
        .map((line) => `<p>${escapeHtml(line)}</p>`)
        .join('');

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** 게시글 본문을 작성 화면과 같은 서식으로 보여 주는 읽기 전용 뷰어 */
export default function PostContentViewer({ html }: PostContentViewerProps) {
  const editor = useEditor(
    {
      extensions: postEditorExtensions,
      content: toEditorHtml(html),
      editable: false,
      immediatelyRender: false,
    },
    [html],
  );

  return <EditorContent editor={editor} />;
}

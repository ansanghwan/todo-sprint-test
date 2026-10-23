'use client';

import TextAlign from '@tiptap/extension-text-align';
import { EditorContent, useEditor, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface NoteContentViewerProps {
  /** 노트 본문 (Tiptap JSON) */
  content: JSONContent;
}

/**
 * 노트 본문을 작성 화면(NoteEditor)과 같은 서식으로 보여 주는 읽기 전용 뷰어.
 * 편집할 수 없는 상태라 본문 링크는 일반 링크처럼 새 탭으로 열립니다.
 */
const NoteContentViewer = ({ content }: NoteContentViewerProps) => {
  const editor = useEditor(
    {
      extensions: [
        // 클릭 처리는 브라우저 기본 링크 동작(target="_blank")에 맡깁니다.
        StarterKit.configure({ link: { openOnClick: false } }),
        TextAlign.configure({ types: ['paragraph', 'heading'] }),
      ],
      content,
      editable: false,
      immediatelyRender: false,
    },
    [content],
  );

  return <EditorContent editor={editor} />;
};

export default NoteContentViewer;

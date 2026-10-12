'use client';

import {
  useEditor,
  EditorContent,
  useEditorState,
  JSONContent,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { Placeholder } from '@tiptap/extensions';
import Toolbar from '@/components/ui/editor/Toolbar';
import { useTranslations } from 'next-intl';

type Props = {
  value?: JSONContent; // Tiptap 문서 JSON
  onChange: (json: JSONContent | undefined) => void;
  children: React.ReactNode; // 제목, 목표, 할일, 작성일, 태그 등 추가 데이터 컴포넌트
};

export default function NoteEditor({ value, onChange, children }: Props) {
  const t = useTranslations('Todo');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      TextAlign.configure({ types: ['paragraph', 'heading'] }),
      Placeholder.configure({
        placeholder: `${t('noteContentPlaceholder')}`,
      }),
    ],
    content: value,
    immediatelyRender: false, // Next.js SSR hydration 에러 방지 (중요)
    onUpdate: ({ editor }) =>
      onChange(editor.isEmpty ? undefined : editor.getJSON()),
    editorProps: {
      attributes: { class: 'min-h-[400px] outline-none' },
    },
  });

  // 글자수 (공백포함 / 공백제외)
  const counts = useEditorState({
    editor,
    selector: ({ editor }) => {
      const text = editor?.getText() ?? '';
      return {
        withSpace: text.length,
        withoutSpace: text.replace(/\s/g, '').length,
      };
    },
  });

  if (!editor) return null;

  return (
    <div>
      <Toolbar editor={editor} />
      {children}
      <EditorContent
        editor={editor}
        className={'mt-4 border-t border-grayscale-200 py-4'}
      />
      <p className="text-right text-xs text-gray-400">
        {t('includeSpaces')} {counts?.withSpace ?? 0}
        {t('characters')} | {t('excludeSpaces')} {counts?.withoutSpace ?? 0}
        {t('characters')}
      </p>
    </div>
  );
}

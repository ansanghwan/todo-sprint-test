'use client';

import { useEditor, EditorContent, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { Placeholder } from '@tiptap/extensions';
import { useTranslations } from 'next-intl';
import PostToolbar from '@/components/ui/editor/PostToolbar';

type Props = {
  value?: string;
  placeholder: string;
  onChange: (html: string) => void;
  onImageClick: () => void;
  children: React.ReactNode;
};
export default function PostEditor({
  value,
  placeholder,
  onChange,
  onImageClick,
  children,
}: Props) {
  const t = useTranslations('Todo');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      TextAlign.configure({ types: ['paragraph', 'heading'] }),
      Placeholder.configure({
        placeholder: `${placeholder}`,
      }),
    ],
    content: value,
    immediatelyRender: false, // Next.js SSR hydration 에러 방지 (중요)
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? '' : editor.getHTML()),
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
      <PostToolbar editor={editor} onImageClick={onImageClick} />
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

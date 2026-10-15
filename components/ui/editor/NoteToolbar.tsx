import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import {
  applyEditorLink,
  getEditorLinkTarget,
  removeEditorLink,
  type EditorLinkTarget,
} from './editorLink';
import LinkUploadModal from './LinkUploadModal';

export default function NoteToolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      underline: editor.isActive('underline'),
      left: editor.isActive({ textAlign: 'left' }),
      center: editor.isActive({ textAlign: 'center' }),
      right: editor.isActive({ textAlign: 'right' }),
      list: editor.isActive('bulletList'),
      link: editor.isActive('link'),
    }),
  });

  const t = useTranslations('Todo');
  // 팝업을 연 순간의 적용 위치. null이면 팝업이 닫힌 상태입니다.
  const [linkTarget, setLinkTarget] = useState<EditorLinkTarget | null>(null);

  const openLinkModal = () => setLinkTarget(getEditorLinkTarget(editor));

  const handleLinkSubmit = (url: string) => {
    if (linkTarget) {
      applyEditorLink(editor, linkTarget, url);
    }
    setLinkTarget(null);
  };

  const handleLinkRemove = () => {
    if (linkTarget) {
      removeEditorLink(editor, linkTarget);
    }
    setLinkTarget(null);
  };

  return (
    <div className="flex items-center gap-3 rounded-full bg-gray-50 px-4 py-2 align-middle">
      <div className="flex flex-row flex-nowrap items-center gap-1.5">
        <button
          type="button"
          data-active={s.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={'flex items-center align-middle text-grayscale-500'}
        >
          <span className="material-symbols-rounded font-light!">
            format_bold
          </span>
        </button>
        <button
          type="button"
          data-active={s.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={'flex items-center align-middle text-grayscale-500'}
        >
          <span className="material-symbols-rounded font-light!">
            format_italic
          </span>
        </button>
        <button
          type="button"
          data-active={s.underline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={'flex items-center align-middle text-grayscale-500'}
        >
          <span className="material-symbols-rounded font-light!">
            format_underlined
          </span>
        </button>
      </div>

      <div className="flex flex-row flex-nowrap items-center gap-1.5">
        <button
          type="button"
          data-active={s.left}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={'flex items-center align-middle text-grayscale-500'}
        >
          <span className="material-symbols-rounded font-light!">
            format_align_left
          </span>
        </button>
        <button
          type="button"
          data-active={s.center}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={'flex items-center align-middle text-grayscale-500'}
        >
          <span className="material-symbols-rounded font-light!">
            format_align_center
          </span>
        </button>
        <button
          type="button"
          data-active={s.right}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={'flex items-center align-middle text-grayscale-500'}
        >
          <span className="material-symbols-rounded font-light!">
            format_align_right
          </span>
        </button>
        <button
          type="button"
          data-active={s.list}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={'flex items-center align-middle text-grayscale-500'}
        >
          <span className="material-symbols-rounded font-light!">
            format_list_bulleted
          </span>
        </button>
      </div>

      <button
        type="button"
        data-active={s.link}
        aria-label={t('link')}
        onClick={openLinkModal}
        className={'flex items-center align-middle text-grayscale-500'}
      >
        <span className="material-symbols-outlined font-light!">link_2</span>
      </button>

      <LinkUploadModal
        isOpen={linkTarget !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setLinkTarget(null);
          }
        }}
        initialUrl={linkTarget?.href}
        onSubmit={handleLinkSubmit}
        onRemove={handleLinkRemove}
      />

      {/*<button*/}
      {/*  type="button"*/}
      {/*  data-active={s.image}*/}
      {/*  onClick={setLink}*/}
      {/*  className={'flex align-middle items-center text-grayscale-500'}*/}
      {/*>*/}
      {/*  <span className="material-symbols-outlined font-light!">image</span>*/}
      {/*</button>*/}
    </div>
  );
}

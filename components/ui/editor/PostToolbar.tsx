import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';

interface PostToolbarProps {
  editor: Editor;
  /** 이미지 첨부 버튼을 눌렀을 때 (파일 선택 창 열기) */
  onImageClick: () => void;
}

export default function PostToolbar({
  editor,
  onImageClick,
}: PostToolbarProps) {
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
      image: editor.isActive('image'),
    }),
  });

  return (
    <div className="flex items-center gap-3 rounded-full bg-muted-section px-4 py-2 align-middle">
      <div className="flex flex-row flex-nowrap items-center gap-1.5">
        <button
          type="button"
          data-active={s.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={'flex items-center align-middle text-muted'}
        >
          <span className="material-symbols-rounded font-light!">
            format_bold
          </span>
        </button>
        <button
          type="button"
          data-active={s.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={'flex items-center align-middle text-muted'}
        >
          <span className="material-symbols-rounded font-light!">
            format_italic
          </span>
        </button>
        <button
          type="button"
          data-active={s.underline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={'flex items-center align-middle text-muted'}
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
          className={'flex items-center align-middle text-muted'}
        >
          <span className="material-symbols-rounded font-light!">
            format_align_left
          </span>
        </button>
        <button
          type="button"
          data-active={s.center}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={'flex items-center align-middle text-muted'}
        >
          <span className="material-symbols-rounded font-light!">
            format_align_center
          </span>
        </button>
        <button
          type="button"
          data-active={s.right}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={'flex items-center align-middle text-muted'}
        >
          <span className="material-symbols-rounded font-light!">
            format_align_right
          </span>
        </button>
        <button
          type="button"
          data-active={s.list}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={'flex items-center align-middle text-muted'}
        >
          <span className="material-symbols-rounded font-light!">
            format_list_bulleted
          </span>
        </button>
      </div>

      <button
        type="button"
        aria-label="이미지 첨부"
        onClick={onImageClick}
        className={'flex items-center align-middle text-muted'}
      >
        <span className="material-symbols-outlined font-light!">image</span>
      </button>
    </div>
  );
}

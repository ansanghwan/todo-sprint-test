import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';

export default function Toolbar({ editor }: { editor: Editor }) {
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
      image: editor.isActive('image'),
    }),
  });

  const setLink = () => {
    const url = window.prompt('링크 주소');
    if (url === null) return;
    if (url === '') return editor.chain().focus().unsetLink().run();
    editor.chain().focus().setLink({ href: url }).run();
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
        onClick={setLink}
        className={'flex items-center align-middle text-grayscale-500'}
      >
        <span className="material-symbols-outlined font-light!">link_2</span>
      </button>

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

import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { afterEach, describe, expect, it } from 'vitest';

import {
  applyEditorLink,
  getEditorLinkTarget,
  removeEditorLink,
} from './editorLink';

let editor: Editor;

afterEach(() => {
  editor.destroy();
});

const createEditor = (content: string) => {
  editor = new Editor({
    extensions: [StarterKit.configure({ link: { openOnClick: false } })],
    content,
  });
  return editor;
};

// '<p>hello world</p>'에서 문단 안 글자는 위치 1부터 시작합니다.
const WORLD = { from: 7, to: 12 };

describe('editorLink', () => {
  it('선택한 글자에 링크를 걸고, 그사이 선택이 바뀌어도 기억한 위치에 적용한다', () => {
    createEditor('<p>hello world</p>');
    editor.commands.setTextSelection(WORLD);
    const target = getEditorLinkTarget(editor);
    // 팝업 입력으로 포커스가 옮겨가며 선택이 풀린 상황
    editor.commands.setTextSelection(1);

    applyEditorLink(editor, target, 'https://example.com');

    expect(editor.getHTML()).toContain(
      'hello <a target="_blank" rel="noopener noreferrer nofollow" href="https://example.com">world</a>',
    );
  });

  it('선택이 없으면 커서 위치에 URL 자체를 링크 텍스트로 넣는다', () => {
    createEditor('<p>hello world</p>');
    editor.commands.setTextSelection(6);
    const target = getEditorLinkTarget(editor);

    applyEditorLink(editor, target, 'https://example.com');

    expect(editor.getText()).toBe('hellohttps://example.com world');
    expect(editor.getHTML()).toContain(
      'href="https://example.com">https://example.com</a>',
    );
  });

  it('커서가 기존 링크 안에 있으면 링크 전체와 기존 주소를 대상으로 잡고, 주소만 바꾼다', () => {
    createEditor('<p>see <a href="https://old.com">docs</a> here</p>');
    // 'docs' 가운데에 커서
    editor.commands.setTextSelection(7);
    const target = getEditorLinkTarget(editor);

    expect(target).toEqual({ from: 5, to: 9, href: 'https://old.com' });

    applyEditorLink(editor, target, 'https://new.com');

    expect(editor.getText()).toBe('see docs here');
    expect(editor.getHTML()).toContain('href="https://new.com">docs</a>');
    expect(editor.getHTML()).not.toContain('old.com');
  });

  it('링크를 해제하면 글자는 남기고 링크만 뺀다', () => {
    createEditor('<p>see <a href="https://old.com">docs</a> here</p>');
    editor.commands.setTextSelection(7);
    const target = getEditorLinkTarget(editor);

    removeEditorLink(editor, target);

    expect(editor.getText()).toBe('see docs here');
    expect(editor.getHTML()).not.toContain('<a');
  });
});

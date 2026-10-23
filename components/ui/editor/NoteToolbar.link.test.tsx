import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { installRadixDomMocks } from '@/test/domMocks';
import IntlTestProvider from '@/test/IntlTestProvider';
import NoteToolbar from './NoteToolbar';

/**
 * 툴바 링크 버튼 → 링크 업로드 팝업 → 본문 반영 흐름 (FN-WR-04, 미리보기 카드 제외).
 * 에디터 설정은 노트 에디터와 같게 둡니다.
 */
let editor: Editor | null = null;

const Harness = ({
  content,
  onSave,
}: {
  content: string;
  onSave?: () => void;
}) => {
  const instance = useEditor({
    extensions: [StarterKit.configure({ link: { openOnClick: false } })],
    content,
    immediatelyRender: true,
  });
  useEffect(() => {
    editor = instance;
  }, [instance]);
  if (!instance) return null;
  // NoteForm처럼 에디터가 노트 저장 form 안에 있습니다.
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave?.();
      }}
    >
      <NoteToolbar editor={instance} />
      <EditorContent editor={instance} />
    </form>
  );
};

beforeEach(() => {
  installRadixDomMocks();
  // ProseMirror가 커서 위치를 계산할 때 쓰는 API (jsdom에 없음)
  Range.prototype.getClientRects = () =>
    ({
      length: 0,
      item: () => null,
      [Symbol.iterator]: [][Symbol.iterator],
    }) as unknown as DOMRectList;
  Range.prototype.getBoundingClientRect = () => new DOMRect();
});

const onSave = vi.fn();

const setup = (content = '<p>hello world</p>') => {
  onSave.mockClear();
  render(
    <IntlTestProvider>
      <Harness content={content} onSave={onSave} />
    </IntlTestProvider>,
  );
  return userEvent.setup();
};

const openLinkModal = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: '링크' }));
  return screen.findByRole('dialog', { name: '링크 업로드' });
};

const html = () => editor!.getHTML();

describe('툴바 링크 업로드', () => {
  it('선택한 글자에, 팝업 입력으로 포커스가 옮겨가도 그 위치에 링크를 건다', async () => {
    const user = setup();
    editor!.commands.setTextSelection({ from: 7, to: 12 });

    const dialog = await openLinkModal(user);
    const input = within(dialog).getByRole('textbox', { name: '링크' });
    expect(input).toHaveFocus();
    await user.type(input, 'example.com');
    await user.click(within(dialog).getByRole('button', { name: '확인' }));

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    // 스킴이 없으면 https://를 붙입니다.
    expect(html()).toContain('href="https://example.com">world</a>');
    expect(editor!.getText()).toBe('hello world');
  });

  it('선택이 없으면 그 위치에 URL을 링크 텍스트로 넣는다 (Enter로 확인)', async () => {
    const user = setup();
    editor!.commands.setTextSelection(6);

    const dialog = await openLinkModal(user);
    await user.type(
      within(dialog).getByRole('textbox', { name: '링크' }),
      'https://a.com{Enter}',
    );

    await waitFor(() =>
      expect(editor!.getText()).toBe('hellohttps://a.com world'),
    );
    expect(html()).toContain('href="https://a.com">https://a.com</a>');
  });

  it('올바른 주소가 있을 때만 확인할 수 있고, 잘못된 주소는 오류를 보여 준다', async () => {
    const user = setup();
    const dialog = await openLinkModal(user);
    const input = within(dialog).getByRole('textbox', { name: '링크' });
    const confirm = within(dialog).getByRole('button', { name: '확인' });

    expect(confirm).toBeDisabled();
    // 빈 값은 해제가 아니라 확인 불가입니다. 해제는 링크 삭제 버튼으로만 합니다.
    expect(
      within(dialog).queryByRole('button', { name: '링크 삭제' }),
    ).not.toBeInTheDocument();

    await user.type(input, 'ftp://files');
    await user.tab();

    expect(confirm).toBeDisabled();
    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      '올바른 링크를 입력해주세요',
    );
  });

  it('기존 링크 위에서 열면 주소가 채워지고, 고친 주소로 바꾼다', async () => {
    const user = setup('<p>see <a href="https://old.com">docs</a> here</p>');
    editor!.commands.setTextSelection(7);

    const dialog = await openLinkModal(user);
    const input = within(dialog).getByRole('textbox', { name: '링크' });
    expect(input).toHaveValue('https://old.com');

    await user.clear(input);
    await user.type(input, 'https://new.com');
    await user.click(within(dialog).getByRole('button', { name: '확인' }));

    await waitFor(() =>
      expect(html()).toContain('href="https://new.com">docs</a>'),
    );
    expect(html()).not.toContain('old.com');
  });

  it('기존 링크는 링크 삭제 버튼으로 해제하고 글자는 남긴다', async () => {
    const user = setup('<p>see <a href="https://old.com">docs</a> here</p>');
    editor!.commands.setTextSelection(7);

    const dialog = await openLinkModal(user);
    await user.click(within(dialog).getByRole('button', { name: '링크 삭제' }));

    await waitFor(() => expect(html()).not.toContain('<a'));
    expect(editor!.getText()).toBe('see docs here');
  });

  it('입력 후 닫으면 본문을 바꾸지 않는다', async () => {
    const user = setup('<p>see <a href="https://old.com">docs</a> here</p>');
    const before = html();
    editor!.commands.setTextSelection({ from: 1, to: 4 });

    const dialog = await openLinkModal(user);
    await user.type(
      within(dialog).getByRole('textbox', { name: '링크' }),
      'https://x.com',
    );
    await user.click(within(dialog).getByRole('button', { name: '닫기' }));

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(html()).toBe(before);
  });

  describe('노트 저장 form 안에서', () => {
    it('확인 버튼은 링크만 적용하고 노트 저장을 부르지 않는다', async () => {
      const user = setup();
      editor!.commands.setTextSelection({ from: 7, to: 12 });

      const dialog = await openLinkModal(user);
      await user.type(
        within(dialog).getByRole('textbox', { name: '링크' }),
        'https://a.com',
      );
      await user.click(within(dialog).getByRole('button', { name: '확인' }));

      await waitFor(() =>
        expect(html()).toContain('href="https://a.com">world</a>'),
      );
      expect(onSave).not.toHaveBeenCalled();
    });

    it('Enter도 링크만 적용하고 노트 저장을 부르지 않는다', async () => {
      const user = setup();
      editor!.commands.setTextSelection(6);

      const dialog = await openLinkModal(user);
      await user.type(
        within(dialog).getByRole('textbox', { name: '링크' }),
        'https://a.com{Enter}',
      );

      await waitFor(() =>
        expect(editor!.getText()).toBe('hellohttps://a.com world'),
      );
      expect(onSave).not.toHaveBeenCalled();
    });

    it('링크 삭제도 노트 저장을 부르지 않는다', async () => {
      const user = setup('<p>see <a href="https://old.com">docs</a> here</p>');
      editor!.commands.setTextSelection(7);

      const dialog = await openLinkModal(user);
      await user.click(
        within(dialog).getByRole('button', { name: '링크 삭제' }),
      );

      await waitFor(() => expect(html()).not.toContain('<a'));
      expect(onSave).not.toHaveBeenCalled();
    });
  });
});

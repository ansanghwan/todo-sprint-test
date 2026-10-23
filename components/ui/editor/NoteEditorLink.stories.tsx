import type { Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';

import IntlTestProvider from '@/test/IntlTestProvider';
import NoteEditor from './NoteEditor';
import LinkUploadModal from './LinkUploadModal';

/**
 * 노트 본문 링크 (FN-WR-04, 미리보기 카드 제외).
 * 에디터 스토리에서 글자를 선택하거나 커서를 둔 뒤 툴바의 링크 버튼으로 확인합니다.
 * Figma '링크 업로드' 팝업과는 아직 대조하지 못했습니다.
 */
const meta = {
  title: 'Notes/NoteEditorLink',
  component: LinkUploadModal,
  decorators: [
    (Story) => (
      <IntlTestProvider>
        <Story />
      </IntlTestProvider>
    ),
  ],
  args: {
    isOpen: true,
    onOpenChange: fn(),
    onSubmit: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof LinkUploadModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NewLink: Story = {
  name: '팝업: 새 링크',
};

export const EditLink: Story = {
  name: '팝업: 기존 링크 수정·삭제',
  args: { initialUrl: 'https://example.com/docs' },
};

const LINKED_CONTENT = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '참고 자료: ' },
        {
          type: 'text',
          text: '강의 노트',
          marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
        },
        { type: 'text', text: ' 를 보고 정리하기' },
      ],
    },
  ],
};

export const InEditor: Story = {
  name: '에디터에서 링크 넣기',
  render: () => (
    <div className="mx-auto max-w-200 bg-white-section p-6">
      <NoteEditor
        value={LINKED_CONTENT}
        placeholder="이 곳을 통해 노트 작성을 시작해주세요"
        onChange={() => {}}
      >
        {null}
      </NoteEditor>
    </div>
  ),
};

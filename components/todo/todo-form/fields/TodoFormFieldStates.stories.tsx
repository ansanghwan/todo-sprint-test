import type { Decorator, Meta, StoryObj } from '@storybook/nextjs';
import { useState, type ReactNode } from 'react';

import TestProviders from '@/test/TestProviders';
import { mockTodosApi } from '@/test/todoMocks';
import DueDateField from './DueDateField';
import GoalSelectField from './GoalSelectField';
import ImageField from './ImageField';
import LinkField from './LinkField';
import TagInputField from './TagInputField';
import TitleField from './TitleField';

/** PC 모달 안쪽 폭(424px)으로 보여 줍니다. 화면을 744px보다 좁히면 모바일 크기가 됩니다. */
const withFormWidth: Decorator = (Story) => (
  <TestProviders>
    <div className="flex max-w-106 flex-col gap-3 md:gap-4">
      <Story />
    </div>
  </TestProviders>
);

/** 상태를 나란히 비교하려고 같은 필드를 여러 개 놓을 때 쓰는 구분 제목 */
const State = ({ name, children }: { name: string; children: ReactNode }) => (
  <section className="flex flex-col gap-1">
    <p className="text-xs/4 text-grayscale-400">{name}</p>
    {children}
  </section>
);

const meta = {
  title: 'Todos/TodoForm/필드 상태',
  parameters: { layout: 'padded' },
  decorators: [withFormWidth],
  beforeEach: () => mockTodosApi({ totalCount: 0 }),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const TitleStates = () => {
  const [value, setValue] = useState('');
  return (
    <>
      <State name="기본 (직접 입력해 포커스 색 확인)">
        <TitleField value={value} onChange={setValue} />
      </State>
      <State name="입력 완료">
        <TitleField value="자바스크립트 기초 챕터3 듣기" onChange={() => {}} />
      </State>
      <State name="오류">
        <TitleField value="" onChange={() => {}} error="titleRequired" />
      </State>
    </>
  );
};

export const Title: Story = {
  name: '제목',
  render: () => <TitleStates />,
};

const GoalStates = () => {
  const [goalId, setGoalId] = useState<number | null>(null);
  return (
    <>
      <State name="선택 전 (열어서 스크롤하면 다음 10개 조회)">
        <GoalSelectField value={goalId} onChange={setGoalId} />
      </State>
      <State name="첫 페이지에 없는 목표를 미리 선택">
        <GoalSelectField
          value={23}
          onChange={() => {}}
          initialGoal={{ id: 23, title: '프론트엔드 면접 준비하기 23' }}
        />
      </State>
      <State name="오류">
        <GoalSelectField
          value={null}
          onChange={() => {}}
          error="goalRequired"
        />
      </State>
    </>
  );
};

export const Goal: Story = {
  name: '목표',
  render: () => <GoalStates />,
};

const DueDateStates = () => {
  const [date, setDate] = useState('');
  return (
    <>
      <State name="선택 전 (달력에서 고르고 확인)">
        <DueDateField value={date} onChange={setDate} />
      </State>
      <State name="선택 완료">
        <DueDateField value="2025-01-10" onChange={() => {}} />
      </State>
      <State name="오류">
        <DueDateField value="" onChange={() => {}} error="dueDateRequired" />
      </State>
    </>
  );
};

export const DueDate: Story = {
  name: '마감기한',
  render: () => <DueDateStates />,
};

const TagStates = () => {
  const [tags, setTags] = useState(['코딩', '자기계발', '공부']);
  return (
    <>
      <State name="칩 3색 (Enter로 추가, X로 삭제)">
        <TagInputField value={tags} onChange={setTags} />
      </State>
      <State name="10개 (줄바꿈)">
        <TagInputField
          value={Array.from({ length: 10 }, (_, i) => `태그 ${i + 1}`)}
          onChange={() => {}}
        />
      </State>
      <State name="오류">
        <TagInputField value={[]} onChange={() => {}} error="tooManyTags" />
      </State>
    </>
  );
};

export const Tags: Story = {
  name: '태그',
  render: () => <TagStates />,
};

const LinkStates = () => {
  const [link, setLink] = useState('');
  return (
    <>
      <State name="기본">
        <LinkField value={link} onChange={setLink} />
      </State>
      <State name="입력 완료 (X로 삭제)">
        <LinkField value="https://www.codeit.kr" onChange={() => {}} />
      </State>
      <State name="오류">
        <LinkField
          value="hello world"
          onChange={() => {}}
          error="linkInvalid"
        />
      </State>
    </>
  );
};

export const Link: Story = {
  name: '링크',
  render: () => <LinkStates />,
};

const ImageStates = () => {
  const [image, setImage] = useState<File | null>(null);
  return (
    <>
      <State name="기본 (파일을 고르면 미리보기, X로 삭제)">
        <ImageField value={image} onChange={setImage} />
      </State>
      <State name="오류">
        <ImageField
          value={null}
          onChange={() => {}}
          error="imageExtensionInvalid"
        />
      </State>
    </>
  );
};

export const Image: Story = {
  name: '이미지',
  render: () => <ImageStates />,
};

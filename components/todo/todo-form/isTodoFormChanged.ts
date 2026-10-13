import type { TodoFormInput } from './todoFormSchema';

/** 비교할 때만 쓰는 형태. 앞뒤 공백처럼 제출 결과에 영향이 없는 차이는 없앱니다. */
const normalize = (values: TodoFormInput) => ({
  title: values.title.trim(),
  goalId: values.goalId,
  dueDate: values.dueDate,
  tags: values.tags.map((tag) => tag.trim()),
  linkUrl: values.linkUrl.trim(),
  image: values.image,
  done: values.done,
});

/**
 * 사용자가 폼을 실제로 바꿨는지 판단합니다 (닫기 확인창을 띄울지 결정).
 * RHF의 isDirty 대신 현재 값과 처음 값을 직접 비교해서,
 * 입력했다가 처음 값으로 되돌린 경우와 initialGoal이 미리 들어간 경우를 "바꾸지 않음"으로 봅니다.
 * tagDraft는 태그 입력란에 적고 아직 Enter를 누르지 않은 글자입니다. 폼 값은 아니지만 닫으면 사라지므로 함께 봅니다.
 */
export const isTodoFormChanged = (
  current: TodoFormInput,
  initial: TodoFormInput,
  tagDraft = '',
) => {
  const a = normalize(current);
  const b = normalize(initial);

  return (
    tagDraft.trim() !== '' ||
    a.title !== b.title ||
    a.goalId !== b.goalId ||
    a.dueDate !== b.dueDate ||
    a.linkUrl !== b.linkUrl ||
    a.image !== b.image ||
    a.done !== b.done ||
    a.tags.length !== b.tags.length ||
    a.tags.some((tag, index) => tag !== b.tags[index])
  );
};

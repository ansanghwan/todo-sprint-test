import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getGoals } from '@/lib/api/goals';
import TestProviders from '@/test/TestProviders';
import {
  installRadixDomMocks,
  stubIntersectionObserver,
} from '@/test/domMocks';
import type { GoalDto, GoalPageDto } from '@/types/api/goal';
import type { TodoFormErrorKey } from '../todoFormSchema';
import GoalSelectField, { type GoalOption } from './GoalSelectField';

vi.mock('@/lib/api/goals', () => ({ getGoals: vi.fn() }));

const mockedGetGoals = vi.mocked(getGoals);

const goal = (id: number): GoalDto => ({
  id,
  teamId: 'team',
  userId: 1,
  title: `목표 ${id}`,
  createdAt: '2026-09-28T09:00:00.000Z',
  updatedAt: '2026-09-28T09:00:00.000Z',
  todoCount: 0,
  completedCount: 0,
});

const page = (ids: number[], nextCursor: number | null): GoalPageDto => ({
  goals: ids.map(goal),
  nextCursor,
  totalCount: 20,
});

let triggerIntersect: () => void;

beforeEach(() => {
  installRadixDomMocks();
  triggerIntersect = stubIntersectionObserver();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const Harness = ({
  initialGoal,
  error,
  onChange,
}: {
  initialGoal?: GoalOption;
  error?: TodoFormErrorKey;
  onChange?: (goalId: number) => void;
}) => {
  const [goalId, setGoalId] = useState<number | null>(initialGoal?.id ?? null);
  return (
    <TestProviders>
      <GoalSelectField
        value={goalId}
        onChange={(next) => {
          setGoalId(next);
          onChange?.(next);
        }}
        initialGoal={initialGoal}
        error={error}
      />
    </TestProviders>
  );
};

const trigger = () => screen.getByRole('combobox', { name: '목표' });
const optionLabels = () =>
  screen.getAllByRole('option').map((option) => option.textContent);

describe('GoalSelectField', () => {
  it('라벨과 연결되고 필수 입력으로 알리며, 선택 전에는 안내 문구를 보여 준다', async () => {
    mockedGetGoals.mockResolvedValueOnce(page([1, 2], null));
    render(<Harness />);

    expect(trigger()).toHaveAttribute('aria-required', 'true');
    expect(trigger()).toHaveTextContent('목표를 선택해주세요');
    await act(async () => {});
  });

  it('서버 기본 개수로 첫 페이지를 조회한다 (limit을 지정하지 않는다)', async () => {
    mockedGetGoals.mockResolvedValueOnce(page([1, 2], null));
    render(<Harness />);
    await act(async () => {});

    expect(mockedGetGoals).toHaveBeenCalledWith(
      { cursor: undefined },
      expect.any(AbortSignal),
    );
  });

  it('목록에서 목표를 고르면 선택값을 알리고 제목을 보여 준다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    mockedGetGoals.mockResolvedValueOnce(page([1, 2], null));
    render(<Harness onChange={onChange} />);

    await user.click(trigger());
    await user.click(await screen.findByRole('option', { name: '목표 2' }));

    expect(onChange).toHaveBeenCalledWith(2);
    expect(trigger()).toHaveTextContent('목표 2');
  });

  it('키보드로 열고 방향키와 Enter로 고를 수 있다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    mockedGetGoals.mockResolvedValueOnce(page([1, 2, 3], null));
    render(<Harness onChange={onChange} />);
    await act(async () => {});

    await user.tab();
    expect(trigger()).toHaveFocus();
    await user.keyboard('{Enter}');
    await screen.findByRole('listbox');
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger()).toHaveTextContent(`목표 ${onChange.mock.calls[0][0]}`);
  });

  it('Esc로 닫으면 선택이 바뀌지 않는다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    mockedGetGoals.mockResolvedValueOnce(page([1, 2], null));
    render(<Harness onChange={onChange} />);

    await user.click(trigger());
    await screen.findByRole('listbox');
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('목록 끝이 보이면 nextCursor로 다음 페이지를 이어 붙인다', async () => {
    const user = userEvent.setup();
    mockedGetGoals
      .mockResolvedValueOnce(page([1, 2], 3))
      .mockResolvedValueOnce(page([3, 4], null));
    render(<Harness />);

    await user.click(trigger());
    await screen.findByRole('option', { name: '목표 1' });
    await act(async () => triggerIntersect());

    expect(await screen.findByRole('option', { name: '목표 3' })).toBeVisible();
    expect(optionLabels()).toEqual(['목표 1', '목표 2', '목표 3', '목표 4']);
    expect(mockedGetGoals).toHaveBeenLastCalledWith(
      { cursor: 3 },
      expect.any(AbortSignal),
    );
  });

  it('닫혀 있을 때와 nextCursor가 null일 때는 다음 페이지를 요청하지 않는다', async () => {
    const user = userEvent.setup();
    mockedGetGoals
      .mockResolvedValueOnce(page([1, 2], 3))
      .mockResolvedValueOnce(page([3], null));
    render(<Harness />);
    await act(async () => {});

    // 닫힌 상태
    await act(async () => triggerIntersect());
    expect(mockedGetGoals).toHaveBeenCalledTimes(1);

    await user.click(trigger());
    await screen.findByRole('option', { name: '목표 1' });
    await act(async () => triggerIntersect());
    await screen.findByRole('option', { name: '목표 3' });

    // 마지막 페이지까지 받은 뒤
    await act(async () => triggerIntersect());
    expect(mockedGetGoals).toHaveBeenCalledTimes(2);
  });

  describe('initialGoal', () => {
    const initialGoal = { id: 7, title: '첫 페이지에 없는 목표' };

    it('목록 첫 페이지에 없어도 선택된 제목을 바로 보여 준다', async () => {
      mockedGetGoals.mockImplementationOnce(() => new Promise(() => {}));
      render(<Harness initialGoal={initialGoal} />);

      expect(trigger()).toHaveTextContent('첫 페이지에 없는 목표');
      await act(async () => {});
    });

    it('목록 맨 위에 두고, 나중에 같은 목표가 조회돼도 한 번만 보여 준다', async () => {
      const user = userEvent.setup();
      mockedGetGoals
        .mockResolvedValueOnce(page([1, 2], 3))
        .mockResolvedValueOnce({
          goals: [{ ...goal(7), title: initialGoal.title }, goal(8)],
          nextCursor: null,
          totalCount: 4,
        });
      render(<Harness initialGoal={initialGoal} />);

      await user.click(trigger());
      await screen.findByRole('option', { name: '목표 1' });
      expect(optionLabels()).toEqual([
        '첫 페이지에 없는 목표',
        '목표 1',
        '목표 2',
      ]);

      await act(async () => triggerIntersect());
      await screen.findByRole('option', { name: '목표 8' });

      expect(optionLabels()).toEqual([
        '첫 페이지에 없는 목표',
        '목표 1',
        '목표 2',
        '목표 8',
      ]);
    });

    it('다른 목표로 바꿀 수 있다', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      mockedGetGoals.mockResolvedValueOnce(page([1, 2], null));
      render(<Harness initialGoal={initialGoal} onChange={onChange} />);

      await user.click(trigger());
      await user.click(await screen.findByRole('option', { name: '목표 1' }));

      expect(onChange).toHaveBeenCalledWith(1);
      expect(trigger()).toHaveTextContent('목표 1');
    });
  });

  it('불러오지 못하면 목록에 알리고, 다시 열면 재요청한다', async () => {
    const user = userEvent.setup();
    mockedGetGoals
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(page([1], null));
    render(<Harness />);
    await act(async () => {});

    await user.click(trigger());

    expect(
      within(await screen.findByRole('listbox')).queryByRole('alert'),
    ).toBeNull();
    expect(await screen.findByRole('option', { name: '목표 1' })).toBeVisible();
    expect(mockedGetGoals).toHaveBeenCalledTimes(2);
  });

  it('목표가 하나도 없으면 없다고 알려 준다', async () => {
    const user = userEvent.setup();
    mockedGetGoals.mockResolvedValueOnce(page([], null));
    render(<Harness />);

    await user.click(trigger());

    expect(await screen.findByText('등록된 목표가 없어요')).toBeVisible();
  });

  it('오류가 있으면 문구를 보여 주고 trigger와 연결한다', async () => {
    mockedGetGoals.mockResolvedValueOnce(page([1], null));
    render(<Harness error="goalRequired" />);
    await act(async () => {});

    expect(trigger()).toHaveAttribute('aria-invalid', 'true');
    expect(trigger()).toHaveAccessibleDescription('목표를 선택해주세요');
  });
});

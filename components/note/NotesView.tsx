'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import SearchInput from '@/components/ui/SearchInput';
import NoteList from '@/components/note/NoteList';
import NoteSortMenu from '@/components/note/NoteSortMenu';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import type { NoteSort } from '@/types/api/note';

interface NotesViewProps {
  /** 헤더와 목록 사이에 들어갈 내용(목표 배너) */
  children?: ReactNode;
}

export default function NotesView({ children }: NotesViewProps) {
  const t = useTranslations('Todo');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // ── 읽기: URL → 값 ──
  const search = searchParams.get('search') ?? '';
  // URL은 사용자가 직접 고칠 수 있어서, 허용된 값만 받고 나머지는 기본값으로
  const sort: NoteSort =
    searchParams.get('sort') === 'oldest' ? 'oldest' : 'latest';

  // ── 쓰기: 값 → URL ──
  const updateQuery = (key: 'search' | 'sort', value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  return (
    <>
      <div className="mb-10 flex flex-row justify-between">
        <h2 className="text-2xl font-semibold max-md:hidden">{t('notes')}</h2>
        <div className="flex flex-row items-center gap-2">
          <SearchInput
            aria-label="노트 검색"
            placeholder={t('searchNotes')}
            defaultValue={search}
            onSearch={(query) => updateQuery('search', query.trim())}
            onChange={(event) => {
              if (event.target.value === '') updateQuery('search', '');
            }}
          />
          <NoteSortMenu
            value={sort}
            onChange={(nextSort) => updateQuery('sort', nextSort)}
          />
        </div>
      </div>

      {children}

      <NoteList search={search || undefined} sort={sort} />
    </>
  );
}

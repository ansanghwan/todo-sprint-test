'use client';

import { useTranslations } from 'next-intl';
import { useState, type SubmitEvent } from 'react';

const SEARCH_MAX_LENGTH = 200;

interface PostSearchFormProps {
  onSearch: (search: string) => void;
}

const PostSearchForm = ({ onSearch }: PostSearchFormProps) => {
  const t = useTranslations('Post');
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const trimmedKeyword = keyword.trim();

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedKeyword(trimmedKeyword);
    onSearch(trimmedKeyword);
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-subtle bg-white-section px-5 py-3 md:w-108 md:flex-none"
    >
      <input
        type="text"
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        maxLength={SEARCH_MAX_LENGTH}
        aria-label={t('searchPostsLabel')}
        placeholder={t('searchPosts')}
        className="min-w-0 flex-1 text-base text-foreground outline-none placeholder:text-muted"
      />
      <button
        type="submit"
        aria-label={t('search')}
        disabled={trimmedKeyword === appliedKeyword}
        className="cursor-pointer text-muted transition-colors enabled:hover:text-foreground disabled:cursor-default disabled:opacity-40"
      >
        <span
          aria-hidden
          className="material-symbols-rounded text-xl leading-none"
        >
          search
        </span>
      </button>
    </form>
  );
};

export default PostSearchForm;

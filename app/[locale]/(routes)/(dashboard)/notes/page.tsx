import NotesView from '@/app/[locale]/(routes)/(dashboard)/notes/_components/NotesView';
import { Suspense } from 'react';

export default function Page() {
  return (
    <div>
      <Suspense fallback={null}>
        <NotesView />
      </Suspense>
    </div>
  );
}

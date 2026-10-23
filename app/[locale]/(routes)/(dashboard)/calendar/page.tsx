import { Suspense } from 'react';

import CalendarContainer from './_components/CalendarContainer';

export default function CalendarPage() {
  return (
    <Suspense fallback={null}>
      <CalendarContainer />
    </Suspense>
  );
}

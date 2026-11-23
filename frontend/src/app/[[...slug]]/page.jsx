'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';

const TalentraApp = dynamic(() => import('../../App'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading TALENTRA...</span>
      </div>
    </div>
  ),
});

export default function CatchAllPage({ params }) {
  // Never intercept internal asset paths with application HTML
  if (params?.slug?.[0] === '_next' || params?.slug?.[0] === 'api') {
    notFound();
  }

  return <TalentraApp />;
}

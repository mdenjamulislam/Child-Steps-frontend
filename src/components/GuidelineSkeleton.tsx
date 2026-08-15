import React from "react";

export default function GuidelineSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-3">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
        </div>
        <div className="h-10 w-36 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-slate-700"></div>
              <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-start gap-3">
                  <div className="h-5 w-5 mt-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex-shrink-0"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                    {j !== 3 && <div className="h-4 w-4/5 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

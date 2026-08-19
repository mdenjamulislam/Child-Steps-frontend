"use client";

import React, { useState } from "react";
import type { CareerActionStep, CareerDifficulty } from "@/types";

// -- Difficulty Config ---------------------------------------------------------

const DIFFICULTY_CONFIG: Record<
  CareerDifficulty,
  { label: string; dotColor: string; badgeClasses: string; lineColor: string }
> = {
  Beginner: {
    label: "Beginner",
    dotColor: "bg-emerald-500",
    badgeClasses:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    lineColor: "bg-emerald-300 dark:bg-emerald-700",
  },
  Intermediate: {
    label: "Intermediate",
    dotColor: "bg-amber-500",
    badgeClasses:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    lineColor: "bg-amber-300 dark:bg-amber-700",
  },
  Advanced: {
    label: "Advanced",
    dotColor: "bg-violet-500",
    badgeClasses:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    lineColor: "bg-violet-300 dark:bg-violet-700",
  },
};

// -- Props ---------------------------------------------------------------------

interface CareerTimelineProps {
  steps: CareerActionStep[];
}

// -- Component -----------------------------------------------------------------

export default function CareerTimeline({ steps }: CareerTimelineProps) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggleStep = (index: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (!steps || steps.length === 0) {
    return (
      <p className="text-sm text-slate-400 italic">No action steps available.</p>
    );
  }

  const completedCount = checked.size;
  const totalCount = steps.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          {completedCount} of {totalCount} steps completed
        </span>
        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
          {progressPct}%
        </span>
      </div>
      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mb-6 overflow-hidden">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-violet-500 transition-all duration-700"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Timeline */}
      <div className="relative">
        {steps.map((step, index) => {
          const config = DIFFICULTY_CONFIG[step.difficulty] ?? DIFFICULTY_CONFIG.Beginner;
          const isLast = index === steps.length - 1;
          const isDone = checked.has(index);

          return (
            <div key={index} className="flex gap-4 sm:gap-6">
              {/* -- Left column: dot + connecting line ----------------------- */}
              <div className="flex flex-col items-center flex-shrink-0 w-8">
                {/* Node dot */}
                <button
                  onClick={() => toggleStep(index)}
                  aria-label={`Mark step ${index + 1} as ${isDone ? "incomplete" : "complete"}`}
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                    ${isDone
                      ? "bg-indigo-600 border-indigo-600 scale-110"
                      : `bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 hover:border-indigo-400`
                    }`}
                >
                  {isDone ? (
                    <svg
                      className="h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <span
                      className={`h-3 w-3 rounded-full ${config.dotColor} transition-transform duration-200`}
                    />
                  )}
                </button>

                {/* Connector line */}
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 min-h-[24px] mt-1 mb-1 rounded-full ${config.lineColor} transition-all duration-500`}
                  />
                )}
              </div>

              {/* -- Right column: content card -------------------------------- */}
              <div
                className={`flex-1 pb-8 transition-opacity duration-300 ${isDone ? "opacity-60" : "opacity-100"}`}
              >
                <div
                  className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 hover:shadow-md
                    ${isDone
                      ? "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm"
                    }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex-shrink-0">
                        {index + 1}
                      </span>
                      <h4
                        className={`text-sm sm:text-base font-semibold leading-snug transition-colors ${
                          isDone
                            ? "line-through text-slate-400 dark:text-slate-500"
                            : "text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        {step.title}
                      </h4>
                    </div>

                    {/* Difficulty badge */}
                    <span
                      className={`self-start sm:self-auto inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold flex-shrink-0 ${config.badgeClasses}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`} />
                      {config.label}
                    </span>
                  </div>

                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Mark complete button � mobile friendly tap area */}
                  <button
                    onClick={() => toggleStep(index)}
                    className={`mt-3 inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
                      isDone
                        ? "text-indigo-600 dark:text-indigo-400 hover:text-indigo-800"
                        : "text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                    }`}
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      {isDone ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      )}
                    </svg>
                    {isDone ? "Completed � click to undo" : "Mark as complete"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

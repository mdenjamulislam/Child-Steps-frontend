"use client";

import React, { useState } from "react";
import type { ChildSkill, SkillCategory, SkillStatus } from "@/types";

// ── Category Configuration ───────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  SkillCategory,
  {
    label: string;
    badgeBg: string;
    badgeText: string;
    iconBg: string;
    iconText: string;
    icon: React.ReactNode;
  }
> = {
  academic: {
    label: "Academic",
    badgeBg: "bg-blue-100 dark:bg-blue-900/40",
    badgeText: "text-blue-700 dark:text-blue-300",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconText: "text-blue-600 dark:text-blue-400",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  artistic: {
    label: "Artistic",
    badgeBg: "bg-pink-100 dark:bg-pink-900/40",
    badgeText: "text-pink-700 dark:text-pink-300",
    iconBg: "bg-pink-100 dark:bg-pink-900/40",
    iconText: "text-pink-600 dark:text-pink-400",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  },
  athletic: {
    label: "Athletic",
    badgeBg: "bg-emerald-100 dark:bg-emerald-900/40",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconText: "text-emerald-600 dark:text-emerald-400",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  social: {
    label: "Social",
    badgeBg: "bg-amber-100 dark:bg-amber-900/40",
    badgeText: "text-amber-700 dark:text-amber-300",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    iconText: "text-amber-600 dark:text-amber-400",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  technical: {
    label: "Technical",
    badgeBg: "bg-violet-100 dark:bg-violet-900/40",
    badgeText: "text-violet-700 dark:text-violet-300",
    iconBg: "bg-violet-100 dark:bg-violet-900/40",
    iconText: "text-violet-600 dark:text-violet-400",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
};

// ── Status Configuration ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  SkillStatus,
  { label: string; dotColor: string; ringColor: string }
> = {
  suggested: {
    label: "Suggested",
    dotColor: "bg-indigo-400",
    ringColor: "ring-indigo-200 dark:ring-indigo-800",
  },
  learning: {
    label: "In Progress",
    dotColor: "bg-amber-400",
    ringColor: "ring-amber-200 dark:ring-amber-800",
  },
  acquired: {
    label: "Acquired ✓",
    dotColor: "bg-emerald-400",
    ringColor: "ring-emerald-200 dark:ring-emerald-800",
  },
};

// ── Props ────────────────────────────────────────────────────────────────────

interface SkillDetailsCardProps {
  skill: ChildSkill;
  onUpdateStatus: (skillId: string, newStatus: SkillStatus) => Promise<void>;
  isUpdating?: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SkillDetailsCard({
  skill,
  onUpdateStatus,
  isUpdating = false,
}: SkillDetailsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [checkedActivities, setCheckedActivities] = useState<Set<number>>(
    new Set()
  );

  const catConfig = CATEGORY_CONFIG[skill.category];
  const statusConfig = STATUS_CONFIG[skill.status];

  const toggleActivity = (index: number) => {
    setCheckedActivities((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleStartLearning = () => {
    if (skill.status === "suggested") {
      onUpdateStatus(skill.id, "learning");
    }
  };

  const handleMarkMastered = () => {
    if (skill.status === "learning") {
      onUpdateStatus(skill.id, "acquired");
    }
  };

  const isAcquired = skill.status === "acquired";

  return (
    <div
      className={`group relative rounded-2xl border bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:shadow-md overflow-hidden ${
        isAcquired
          ? "border-emerald-200 dark:border-emerald-800/50"
          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
      }`}
    >
      {/* Acquired shimmer overlay */}
      {isAcquired && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/40 via-transparent to-teal-50/20 dark:from-emerald-900/10 dark:to-transparent pointer-events-none" />
      )}

      {/* ── Card Header ────────────────────────────────────────────────────── */}
      <div className="relative p-5">
        <div className="flex items-start gap-4">
          {/* Category icon */}
          <div
            className={`flex-shrink-0 h-11 w-11 rounded-xl flex items-center justify-center ${catConfig.iconBg} ${catConfig.iconText} transition-transform group-hover:scale-110`}
          >
            {catConfig.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {/* Category badge */}
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${catConfig.badgeBg} ${catConfig.badgeText}`}
              >
                {catConfig.label}
              </span>

              {/* AI badge */}
              {skill.ai_generated && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L13.09 8.26L19 7L14.74 11.74L21 13L14.74 14.26L19 19L13.09 15.74L12 22L10.91 15.74L5 19L9.26 14.26L3 13L9.26 11.74L5 7L10.91 8.26L12 2Z" />
                  </svg>
                  AI Suggested
                </span>
              )}

              {/* Status pill */}
              <span
                className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${statusConfig.ringColor} bg-white dark:bg-slate-900`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotColor} ${
                    skill.status === "learning" ? "animate-pulse" : ""
                  }`}
                />
                {statusConfig.label}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 leading-snug truncate">
              {skill.skill_name}
            </h3>
          </div>
        </div>

        {/* ── Rationale ────────────────────────────────────────────────────── */}
        {skill.metadata?.rationale && (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
            {skill.metadata.rationale}
          </p>
        )}

        {/* Expand/collapse toggle */}
        <button
          onClick={() => setIsExpanded((v) => !v)}
          className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          aria-expanded={isExpanded}
        >
          {isExpanded ? "Hide activities" : "Show activities"}
          <svg
            className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* ── Expandable Activities ─────────────────────────────────────────── */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-5 pb-5">
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Recommended Activities
            </p>
            <ol className="space-y-2.5">
              {(skill.metadata?.recommended_activities ?? []).map(
                (activity, idx) => {
                  const checked = checkedActivities.has(idx);
                  return (
                    <li key={idx}>
                      <label className="flex items-start gap-3 cursor-pointer group/item">
                        <div className="relative mt-0.5 flex-shrink-0 h-5 w-5">
                          <input
                            type="checkbox"
                            className="peer h-5 w-5 appearance-none rounded-md border-2 border-slate-300 dark:border-slate-600 checked:border-emerald-500 checked:bg-emerald-500 transition-all cursor-pointer focus:ring-2 focus:ring-emerald-500/20"
                            checked={checked}
                            onChange={() => toggleActivity(idx)}
                          />
                          <svg
                            className="absolute inset-0 m-auto w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span
                          className={`text-sm leading-relaxed transition-colors ${
                            checked
                              ? "line-through text-slate-400 dark:text-slate-500"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {idx + 1}.{" "}
                          </span>
                          {activity}
                        </span>
                      </label>
                    </li>
                  );
                }
              )}
            </ol>
          </div>
        </div>
      </div>

      {/* ── Action Buttons ─────────────────────────────────────────────────── */}
      {!isAcquired && (
        <div className="px-5 pb-5 pt-0 flex gap-2">
          {skill.status === "suggested" && (
            <button
              onClick={handleStartLearning}
              disabled={isUpdating}
              id={`start-learning-${skill.id}`}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
            >
              {isUpdating ? (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              Start Learning
            </button>
          )}

          {skill.status === "learning" && (
            <button
              onClick={handleMarkMastered}
              disabled={isUpdating}
              id={`mark-mastered-${skill.id}`}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
            >
              {isUpdating ? (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              Mark Mastered
            </button>
          )}
        </div>
      )}

      {/* Acquired achievement banner */}
      {isAcquired && (
        <div className="relative px-5 pb-5 pt-0">
          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 px-4 py-3">
            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
              <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                Skill Mastered! 🎉
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                This skill has been successfully acquired.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

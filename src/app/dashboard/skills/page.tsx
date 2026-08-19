"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { childService } from "@/services/childService";
import { skillsService } from "@/services/skillsService";
import SkillDetailsCard from "@/components/SkillDetailsCard";
import type { Child, ChildSkill, SkillsGrouped, SkillStatus } from "@/types";

// ── Sidebar nav definition ────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/growth",
    label: "Growth Tracker",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    href: "/dashboard/milestones",
    label: "Milestones",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/vaccinations",
    label: "Vaccinations",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/daily-log",
    label: "Daily Log",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    href: "/dashboard/guidelines",
    label: "AI Guidelines",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/skills",
    label: "Skill Development",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
];

// ── Tab definitions ───────────────────────────────────────────────────────────

type TabKey = "suggested" | "learning" | "acquired";

const TABS: { key: TabKey; label: string; emptyMessage: string }[] = [
  {
    key: "suggested",
    label: "Recommended by AI",
    emptyMessage:
      'No AI suggestions yet. Click "Generate AI Skills" to get personalised recommendations.',
  },
  {
    key: "learning",
    label: "In Progress",
    emptyMessage:
      "No skills in progress yet. Start a suggested skill to begin tracking.",
  },
  {
    key: "acquired",
    label: "Acquired",
    emptyMessage:
      "No skills mastered yet. Keep practising the in-progress skills!",
  },
];

// ── Skeleton loader ───────────────────────────────────────────────────────────

function SkillCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 rounded-xl bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="h-5 w-24 rounded-full bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-3 w-5/6 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
      <div className="mt-4 h-9 w-32 rounded-xl bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SkillsDashboardPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [grouped, setGrouped] = useState<SkillsGrouped>({
    suggested: [],
    learning: [],
    acquired: [],
  });

  const [activeTab, setActiveTab] = useState<TabKey>("suggested");
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [updatingSkillId, setUpdatingSkillId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !token) {
      router.replace("/login");
    }
  }, [authLoading, token, router]);

  // ── Load children ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading || !token) return;
    const fetchChildren = async () => {
      try {
        setLoadingChildren(true);
        const res = await childService.getAllChildren();
        if (res.success && res.data && res.data.length > 0) {
          setChildren(res.data);
          setSelectedChildId(res.data[0].id);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load children.");
      } finally {
        setLoadingChildren(false);
      }
    };
    fetchChildren();
  }, [authLoading, token]);

  // ── Load skills for selected child ────────────────────────────────────────
  const fetchSkills = useCallback(async (childId: string) => {
    if (!childId) return;
    try {
      setLoadingSkills(true);
      setError(null);
      const res = await skillsService.getSkills(childId);
      if (res.success) {
        setGrouped(res.grouped);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch skills.");
    } finally {
      setLoadingSkills(false);
    }
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchSkills(selectedChildId);
    }
  }, [selectedChildId, fetchSkills]);

  // ── Auto-dismiss success message ──────────────────────────────────────────
  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(t);
  }, [successMessage]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!selectedChildId || isGenerating) return;
    try {
      setIsGenerating(true);
      setError(null);
      const res = await skillsService.generateSuggestions(selectedChildId);
      if (res.success) {
        await fetchSkills(selectedChildId);
        setActiveTab("suggested");
        setSuccessMessage(
          `Generated ${res.data?.length ?? 3} new skill suggestions! Check the "Recommended by AI" tab.`
        );
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate skill suggestions.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateStatus = async (
    skillId: string,
    newStatus: SkillStatus
  ) => {
    try {
      setUpdatingSkillId(skillId);
      setError(null);
      const res = await skillsService.updateStatus(skillId, newStatus);
      if (res.success && res.data) {
        // Optimistic update: move the skill to the new status bucket
        setGrouped((prev) => {
          const allSkills: ChildSkill[] = [
            ...prev.suggested,
            ...prev.learning,
            ...prev.acquired,
          ];
          const updated = allSkills.map((s) =>
            s.id === skillId ? { ...s, status: newStatus } : s
          );
          return {
            suggested: updated.filter((s) => s.status === "suggested"),
            learning: updated.filter((s) => s.status === "learning"),
            acquired: updated.filter((s) => s.status === "acquired"),
          };
        });
        const statusLabel =
          newStatus === "learning" ? "In Progress" : "Acquired";
        setSuccessMessage(`Skill moved to "${statusLabel}"!`);
        // Navigate to the new tab
        if (newStatus === "learning") setActiveTab("learning");
        if (newStatus === "acquired") setActiveTab("acquired");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update skill status.");
    } finally {
      setUpdatingSkillId(null);
    }
  };

  // ── Summary counts ────────────────────────────────────────────────────────
  const totalSkills =
    grouped.suggested.length + grouped.learning.length + grouped.acquired.length;

  const selectedChild = children.find((c) => c.id === selectedChildId);

  // ── Active tab skills ──────────────────────────────────────────────────────
  const activeSkills: ChildSkill[] = grouped[activeTab];

  // ── Loading state ─────────────────────────────────────────────────────────
  if (authLoading || loadingChildren) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex shrink-0">
        <div className="flex h-16 items-center px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm">
            CS
          </div>
          <span className="ml-3 text-lg font-bold tracking-tight">Child Steper</span>
        </div>
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/dashboard/skills";
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 font-semibold"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">

        {/* ── Top Header ─────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 sm:px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold tracking-tight hidden sm:block">
              Skill Development
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Child selector */}
            {children.length > 1 && (
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                id="child-selector"
                className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </option>
                ))}
              </select>
            )}

            {/* Generate button */}
            <button
              id="generate-skills-btn"
              onClick={handleGenerate}
              disabled={isGenerating || !selectedChildId}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-4 py-2 text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
            >
              {isGenerating ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="hidden sm:inline">Generating...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L13.09 8.26L19 7L14.74 11.74L21 13L14.74 14.26L19 19L13.09 15.74L12 22L10.91 15.74L5 19L9.26 14.26L3 13L9.26 11.74L5 7L10.91 8.26L12 2Z" />
                  </svg>
                  <span className="hidden sm:inline">Generate AI Skills</span>
                  <span className="sm:hidden">Generate</span>
                </>
              )}
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">

          {/* ── Error alert ─────────────────────────────────────────────── */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20 p-4 flex items-start gap-3">
              <svg className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* ── Success toast ────────────────────────────────────────────── */}
          {successMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/20 p-4 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
              <svg className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">{successMessage}</p>
            </div>
          )}

          {/* ── No children state ────────────────────────────────────────── */}
          {children.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">No children profiles yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Add a child profile from the{" "}
                <Link href="/dashboard" className="text-indigo-600 dark:text-indigo-400 font-medium underline underline-offset-2">
                  dashboard
                </Link>{" "}
                to get started.
              </p>
            </div>
          ) : (
            <>
              {/* ── Hero header card ──────────────────────────────────── */}
              {selectedChild && (
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">
                        Skills for {selectedChild.first_name}
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                        Track and manage personalised skill development goals
                      </p>
                    </div>

                    {/* Summary counts */}
                    <div className="flex gap-3 flex-wrap">
                      <div className="flex flex-col items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 px-4 py-2 min-w-[64px]">
                        <span className="text-xl font-black text-indigo-700 dark:text-indigo-400">
                          {grouped.suggested.length}
                        </span>
                        <span className="text-xs text-indigo-600 dark:text-indigo-500 font-medium">Suggested</span>
                      </div>
                      <div className="flex flex-col items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 px-4 py-2 min-w-[64px]">
                        <span className="text-xl font-black text-amber-700 dark:text-amber-400">
                          {grouped.learning.length}
                        </span>
                        <span className="text-xs text-amber-600 dark:text-amber-500 font-medium">Learning</span>
                      </div>
                      <div className="flex flex-col items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/50 px-4 py-2 min-w-[64px]">
                        <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                          {grouped.acquired.length}
                        </span>
                        <span className="text-xs text-emerald-600 dark:text-emerald-500 font-medium">Acquired</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {totalSkills > 0 && (
                    <div className="relative z-10 mt-5">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          Overall Progress
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {grouped.acquired.length}/{totalSkills} mastered
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.round((grouped.acquired.length / totalSkills) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Background decoration */}
                  <div className="absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-violet-50/60 to-transparent dark:from-violet-900/10 pointer-events-none" />
                </div>
              )}

              {/* ── Generate CTA (when no skills) ─────────────────────── */}
              {totalSkills === 0 && !loadingSkills && (
                <div className="rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50/60 to-violet-50/40 dark:from-indigo-900/10 dark:to-violet-900/5 p-10 text-center">
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-5 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
                    <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L13.09 8.26L19 7L14.74 11.74L21 13L14.74 14.26L19 19L13.09 15.74L12 22L10.91 15.74L5 19L9.26 14.26L3 13L9.26 11.74L5 7L10.91 8.26L12 2Z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">
                    No skills yet for {selectedChild?.first_name}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-6">
                    Let our AI analyse {selectedChild?.first_name}&apos;s age, academic records, and
                    activity habits to suggest the perfect personalised skills to develop.
                  </p>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    id="generate-skills-cta-btn"
                    className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-6 py-3 text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 hover:shadow-xl transition-all duration-200 disabled:opacity-60 active:scale-95"
                  >
                    {isGenerating ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Generating suggestions...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L13.09 8.26L19 7L14.74 11.74L21 13L14.74 14.26L19 19L13.09 15.74L12 22L10.91 15.74L5 19L9.26 14.26L3 13L9.26 11.74L5 7L10.91 8.26L12 2Z" />
                        </svg>
                        Generate AI Skill Suggestions
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* ── Tab navigation ────────────────────────────────────── */}
              {(totalSkills > 0 || loadingSkills) && (
                <>
                  <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 p-1 w-full sm:w-auto">
                    {TABS.map((tab) => {
                      const count =
                        tab.key === "suggested"
                          ? grouped.suggested.length
                          : tab.key === "learning"
                          ? grouped.learning.length
                          : grouped.acquired.length;
                      return (
                        <button
                          key={tab.key}
                          id={`tab-${tab.key}`}
                          onClick={() => setActiveTab(tab.key)}
                          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                            activeTab === tab.key
                              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-sm"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                          }`}
                        >
                          <span className="hidden sm:inline">{tab.label}</span>
                          <span className="sm:hidden">
                            {tab.key === "suggested"
                              ? "AI"
                              : tab.key === "learning"
                              ? "Learning"
                              : "Acquired"}
                          </span>
                          <span
                            className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                              activeTab === tab.key
                                ? tab.key === "suggested"
                                  ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
                                  : tab.key === "learning"
                                  ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                                  : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* ── Skill cards grid ──────────────────────────────── */}
                  {loadingSkills ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => (
                        <SkillCardSkeleton key={i} />
                      ))}
                    </div>
                  ) : activeSkills.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                        {TABS.find((t) => t.key === activeTab)?.emptyMessage}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {activeSkills.map((skill) => (
                        <SkillDetailsCard
                          key={skill.id}
                          skill={skill}
                          onUpdateStatus={handleUpdateStatus}
                          isUpdating={updatingSkillId === skill.id}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

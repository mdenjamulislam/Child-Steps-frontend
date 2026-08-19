"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { childService } from "@/services/childService";
import { careerService } from "@/services/careerService";
import type { Child, CareerGuidanceRecord } from "@/types";
import CareerTimeline from "@/components/CareerTimeline";
import NotificationBell from "@/components/NotificationBell";

// -- Skeleton loader for the AI generation wait state ------------------------

function RoadmapSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Path badge skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-14 w-14 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="h-7 w-2/3 rounded-full bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800" />
          <div className="h-3 w-5/6 rounded-full bg-slate-100 dark:bg-slate-800" />
          <div className="h-3 w-4/6 rounded-full bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>

      {/* Timeline skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
        <div className="h-5 w-1/4 rounded-full bg-slate-200 dark:bg-slate-700" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700" />
              {i < 3 && <div className="w-0.5 h-16 bg-slate-100 dark:bg-slate-800 mt-1" />}
            </div>
            <div className="flex-1 space-y-2 pb-6">
              <div className="h-4 w-1/2 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800" />
              <div className="h-3 w-4/5 rounded-full bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -- Helper: calculate age in years from DOB string ---------------------------

function getAgeInYears(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : 0;
}

// -- Helper: relative time label ----------------------------------------------

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// -- Page component ------------------------------------------------------------

export default function CareerPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [history, setHistory] = useState<CareerGuidanceRecord[]>([]);
  const [latestRecord, setLatestRecord] = useState<CareerGuidanceRecord | null>(null);

  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // -- Redirect if unauthenticated ------------------------------------------
  useEffect(() => {
    if (!authLoading && !token) router.replace("/login");
  }, [authLoading, token, router]);

  // -- Load children list ---------------------------------------------------
  useEffect(() => {
    if (authLoading || !token) return;
    const init = async () => {
      try {
        setLoadingChildren(true);
        const res = await childService.getAllChildren();
        if (res.success && res.data && res.data.length > 0) {
          setChildren(res.data);
          setSelectedChild(res.data[0]);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load children.");
      } finally {
        setLoadingChildren(false);
      }
    };
    init();
  }, [authLoading, token]);

  // -- Load career history when child changes ------------------------------
  const loadHistory = useCallback(async (childId: string) => {
    try {
      setLoadingHistory(true);
      setError(null);
      const res = await careerService.getCareerHistory(childId);
      if (res.success && res.data) {
        setHistory(res.data);
        setLatestRecord(res.data[0] ?? null);
      } else {
        setHistory([]);
        setLatestRecord(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load career history.");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (selectedChild) {
      loadHistory(selectedChild.id);
    }
  }, [selectedChild, loadHistory]);

  // -- Generate new roadmap --------------------------------------------------
  const handleGenerate = async () => {
    if (!selectedChild) return;
    try {
      setGenerating(true);
      setError(null);
      setSuccessMsg(null);
      const res = await careerService.generateCareerRoadmap(selectedChild.id);
      if (res.success && res.data) {
        setLatestRecord(res.data);
        setHistory((prev) => [res.data!, ...prev]);
        setSuccessMsg("Career roadmap generated successfully!");
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate career roadmap.");
    } finally {
      setGenerating(false);
    }
  };

  // -- Child age info --------------------------------------------------------
  const childAge = selectedChild ? getAgeInYears(selectedChild.date_of_birth) : null;
  const isYoungChild = childAge !== null && childAge < 10;

  // -- Loading: init ---------------------------------------------------------
  if (authLoading || loadingChildren) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-50 overflow-hidden">

      {/* -- Sidebar -------------------------------------------------------- */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex shrink-0">
        <div className="flex h-16 items-center px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm">
            CS
          </div>
          <span className="ml-3 text-lg font-bold tracking-tight">Child Steper</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </Link>
          <Link
            href="/dashboard/career"
            aria-current="page"
            className="flex items-center gap-3 rounded-lg bg-indigo-50 px-3 py-2.5 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Career Guidance
          </Link>
          <Link
            href="/dashboard/reports"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Progress Reports
          </Link>
        </nav>

        {/* History panel */}
        {history.length > 0 && (
          <div className="border-t border-slate-100 dark:border-slate-800 p-4">
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-3">
              Recent Analyses
            </p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {history.map((rec) => (
                <button
                  key={rec.id}
                  onClick={() => setLatestRecord(rec)}
                  className={`w-full text-left rounded-lg px-3 py-2 text-xs transition-colors ${
                    latestRecord?.id === rec.id
                      ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-semibold"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <p className="truncate font-medium">{rec.recommended_path}</p>
                  <p className="text-[10px] opacity-60">{timeAgo(rec.generated_at)}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* -- Main ----------------------------------------------------------- */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">

        {/* -- Header ----------------------------------------------------- */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 sm:px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h1 className="text-lg font-bold tracking-tight">Career Development</h1>
          </div>

          <div className="flex items-center gap-3">
            {children.length > 0 && (
              <select
                value={selectedChild?.id ?? ""}
                onChange={(e) => {
                  const child = children.find((c) => c.id === e.target.value) ?? null;
                  setSelectedChild(child);
                }}
                className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </option>
                ))}
              </select>
            )}
            <NotificationBell />
          </div>
        </header>

        {/* -- Page Content ----------------------------------------------- */}
        <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">

          {/* -- Error alert -------------------------------------------- */}
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-4">
              <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
            </div>
          )}

          {/* -- Success flash ------------------------------------------- */}
          {successMsg && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4">
              <svg className="h-5 w-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">{successMsg}</p>
            </div>
          )}

          {/* -- Age notice for young children --------------------------- */}
          {isYoungChild && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
              <span className="text-2xl flex-shrink-0">??</span>
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Early Foundations Mode
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                  {selectedChild?.first_name} is {childAge} years old � the AI will focus on
                  <strong> foundational hobbies, creative exploration, and soft skills</strong> rather
                  than specific professional paths. This is perfectly normal and age-appropriate!
                </p>
              </div>
            </div>
          )}

          {/* -- Hero: Generate card ------------------------------------- */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 sm:p-8 text-white shadow-xl">
            {/* Decorative background circles */}
            <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-white/5" />

            <div className="relative">
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-200 mb-1">
                Module 11
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-2">
                AI Career Development Guidance
              </h2>
              {selectedChild && (
                <p className="text-indigo-200 text-sm mb-6">
                  Personalised roadmap for <strong className="text-white">{selectedChild.first_name}</strong>
                  {childAge !== null && ` (age ${childAge})`} � analysing academic grades & skill tags
                </p>
              )}

              <button
                onClick={handleGenerate}
                disabled={generating || !selectedChild}
                className="group relative inline-flex items-center gap-3 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-indigo-700 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                id="generate-career-btn"
              >
                {generating ? (
                  <>
                    <span className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                      <span className="relative inline-flex h-4 w-4 rounded-full bg-indigo-500" />
                    </span>
                    Generating Roadmap...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 text-indigo-600 transition-transform group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {latestRecord ? "Regenerate Roadmap" : "Generate Career Roadmap"}
                  </>
                )}
              </button>

              {latestRecord && !generating && (
                <p className="mt-3 text-xs text-indigo-300">
                  Last generated {timeAgo(latestRecord.generated_at)} � Click to create a fresh analysis
                </p>
              )}
            </div>
          </div>

          {/* -- Roadmap content / skeleton ------------------------------ */}
          {generating || loadingHistory ? (
            <RoadmapSkeleton />
          ) : latestRecord ? (
            <div className="space-y-6">

              {/* -- Recommended Path Badge ------------------------------ */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <p className="text-xs uppercase font-bold tracking-widest text-indigo-400 mb-3">
                  Recommended Career Path
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Icon orb */}
                  <div className="flex-shrink-0 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
                    <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 leading-tight">
                      {latestRecord.recommended_path}
                    </h3>
                    <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-3 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      AI-Generated � {new Date(latestRecord.generated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* -- Rationale Block ------------------------------------- */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/40">
                    <svg className="h-4 w-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h4 className="text-base font-bold text-violet-900 dark:text-violet-100">
                    Why This Path?
                  </h4>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
                  {latestRecord.rationale}
                </p>
              </div>

              {/* -- Vertical Timeline ----------------------------------- */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                      <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-100">
                      Action Roadmap
                    </h4>
                  </div>
                  {/* Difficulty legend */}
                  <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />Beginner</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />Intermediate</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-violet-500" />Advanced</span>
                  </div>
                </div>

                <CareerTimeline steps={latestRecord.action_steps} />
              </div>

            </div>
          ) : (
            /* -- Empty state -------------------------------------------- */
            children.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-12 text-center">
                <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
                  <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">No Children Found</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Please add a child profile first to generate a career roadmap.</p>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-12 text-center">
                <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 mb-4">
                  <svg className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
                  No roadmap generated yet
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Click <strong>Generate Career Roadmap</strong> above to create a personalised AI-driven career pathway for {selectedChild?.first_name}.
                </p>
              </div>
            )
          )}

        </div>
      </main>
    </div>
  );
}

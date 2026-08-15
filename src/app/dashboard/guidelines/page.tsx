"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { childService } from "@/services/childService";
import { guidelineService } from "@/services/guidelineService";
import GuidelineSkeleton from "@/components/GuidelineSkeleton";
import type { Child, GuidelineResponse } from "@/types";

// Helper to calculate precise age display
function formatPreciseAge(dateOfBirth: string): string {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  
  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  
  if (months < 0 || (months === 0 && today.getDate() < dob.getDate())) {
    years--;
    months += 12;
  }
  
  if (today.getDate() < dob.getDate()) {
    months--;
    if (months < 0) {
      months += 12;
    }
  }

  if (years === 0 && months === 0) return "Newborn";
  if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`;
  if (months === 0) return `${years} year${years !== 1 ? 's' : ''}`;
  return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
}

export default function GuidelinesPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [guidelines, setGuidelines] = useState<GuidelineResponse | null>(null);
  
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingGuidelines, setLoadingGuidelines] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local UI state to track checked items (format: "category-index")
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  // ── Auth & Initialization ──────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !token) {
      router.replace("/login");
    }
  }, [authLoading, token, router]);

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

  // ── Fetch Guidelines ───────────────────────────────────────────────────────
  const fetchGuidelines = useCallback(async (childId: string, forceRefresh = false) => {
    if (!childId) return;
    try {
      setLoadingGuidelines(true);
      setError(null);
      const res = await guidelineService.getGuidelines(childId, forceRefresh);
      if (res.success && res.data) {
        setGuidelines(res.data);
        // Reset checkboxes on new fetch
        setCheckedItems(new Set());
      }
    } catch (err: any) {
      setError(err.message || "Failed to load AI guidelines.");
    } finally {
      setLoadingGuidelines(false);
    }
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchGuidelines(selectedChildId);
    }
  }, [selectedChildId, fetchGuidelines]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const toggleCheck = (id: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedChild = children.find((c) => c.id === selectedChildId);

  // ── UI Components ──────────────────────────────────────────────────────────
  
  const GuidelineCard = ({ 
    title, 
    items, 
    categoryKey, 
    colorTheme 
  }: { 
    title: string; 
    items: string[]; 
    categoryKey: string; 
    colorTheme: { border: string; bg: string; iconBg: string; iconText: string; icon: React.ReactNode } 
  }) => (
    <div className={`rounded-2xl border ${colorTheme.border} bg-white dark:bg-slate-900 p-6 shadow-sm`}>
      <div className="flex items-center gap-4 mb-6">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${colorTheme.iconBg} ${colorTheme.iconText}`}>
          {colorTheme.icon}
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">{title}</h3>
      </div>
      
      <div className="space-y-3">
        {items.map((item, idx) => {
          const id = `${categoryKey}-${idx}`;
          const isChecked = checkedItems.has(id);
          
          return (
            <label 
              key={id} 
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                isChecked 
                  ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-900/10' 
                  : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="pt-0.5 relative flex items-center justify-center h-5 w-5 flex-shrink-0">
                <input
                  type="checkbox"
                  className="peer h-5 w-5 appearance-none rounded border-2 border-slate-300 dark:border-slate-600 checked:border-emerald-500 checked:bg-emerald-500 transition-all cursor-pointer focus:ring-2 focus:ring-emerald-500/20"
                  checked={isChecked}
                  onChange={() => toggleCheck(id)}
                />
                <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className={`text-sm leading-relaxed transition-colors ${
                isChecked 
                  ? 'text-slate-500 dark:text-slate-400 line-through' 
                  : 'text-slate-700 dark:text-slate-200'
              }`}>
                {item}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );

  // ───────────────────────────────────────────────────────────────────────────
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
      
      {/* ── Sidebar (Reused from other pages for consistency) ── */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex shrink-0">
        <div className="flex h-16 items-center px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm">CS</div>
          <span className="ml-3 text-lg font-bold tracking-tight">Child Steper</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Dashboard
          </Link>
          <Link href="/dashboard/growth" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Growth Tracker
          </Link>
          <Link href="/dashboard/milestones" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Milestones
          </Link>
          <Link href="/dashboard/vaccinations" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            Vaccinations
          </Link>
          <Link href="/dashboard/daily-log" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            Daily Log
          </Link>
          <Link href="/dashboard/guidelines" aria-current="page" className="flex items-center gap-3 rounded-lg bg-indigo-50 px-3 py-2.5 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            AI Guidelines
          </Link>
        </nav>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 sm:px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold tracking-tight hidden sm:block">AI Guidelines</h1>
          </div>

          <div className="flex items-center gap-3">
            {children.length > 1 && (
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => fetchGuidelines(selectedChildId, true)}
              disabled={loadingGuidelines}
              className="flex items-center gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-1.5 text-sm font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
            >
              <svg className={`h-4 w-4 ${loadingGuidelines ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8">
          
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 dark:border-red-900/50 dark:bg-red-900/20">
              <svg className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {children.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
              <p className="text-slate-500">Add a child profile first to generate guidelines.</p>
            </div>
          ) : (
            <>
              {selectedChild && !loadingGuidelines && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                  <div className="relative z-10">
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">
                      Guidelines for {selectedChild.first_name}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                      Age: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{formatPreciseAge(selectedChild.date_of_birth)}</span>
                    </p>
                  </div>
                  <div className="relative z-10 flex-shrink-0 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 border border-indigo-100 dark:border-indigo-800/50">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                    </span>
                    AI Powered
                  </div>
                  <div className="absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-indigo-50/50 to-transparent dark:from-indigo-900/10 pointer-events-none" />
                </div>
              )}

              {loadingGuidelines ? (
                <GuidelineSkeleton />
              ) : guidelines ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <GuidelineCard 
                    title="Physical Play & Activities" 
                    items={guidelines.physical_activity} 
                    categoryKey="physical"
                    colorTheme={{
                      border: 'border-blue-200 dark:border-blue-900/40 hover:border-blue-300 dark:hover:border-blue-800',
                      bg: 'bg-blue-50/30 dark:bg-blue-900/10',
                      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
                      iconText: 'text-blue-600 dark:text-blue-400',
                      icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    }}
                  />
                  <GuidelineCard 
                    title="Nutrition & Meal Focus" 
                    items={guidelines.nutrition} 
                    categoryKey="nutrition"
                    colorTheme={{
                      border: 'border-green-200 dark:border-green-900/40 hover:border-green-300 dark:hover:border-green-800',
                      bg: 'bg-green-50/30 dark:bg-green-900/10',
                      iconBg: 'bg-green-100 dark:bg-green-900/50',
                      iconText: 'text-green-600 dark:text-green-400',
                      icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" /></svg>
                    }}
                  />
                  <GuidelineCard 
                    title="Cognitive & Focus Milestones" 
                    items={guidelines.cognitive_focus} 
                    categoryKey="cognitive"
                    colorTheme={{
                      border: 'border-purple-200 dark:border-purple-900/40 hover:border-purple-300 dark:hover:border-purple-800',
                      bg: 'bg-purple-50/30 dark:bg-purple-900/10',
                      iconBg: 'bg-purple-100 dark:bg-purple-900/50',
                      iconText: 'text-purple-600 dark:text-purple-400',
                      icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    }}
                  />
                  <GuidelineCard 
                    title="Sleep & Rest Guidelines" 
                    items={guidelines.sleep_recommendations} 
                    categoryKey="sleep"
                    colorTheme={{
                      border: 'border-orange-200 dark:border-orange-900/40 hover:border-orange-300 dark:hover:border-orange-800',
                      bg: 'bg-orange-50/30 dark:bg-orange-900/10',
                      iconBg: 'bg-orange-100 dark:bg-orange-900/50',
                      iconText: 'text-orange-600 dark:text-orange-400',
                      icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                    }}
                  />
                </div>
              ) : null}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

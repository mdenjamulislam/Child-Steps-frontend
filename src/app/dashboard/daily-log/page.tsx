"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { childService } from "@/services/childService";
import { dailyLogService } from "@/services/dailyLogService";
import type { Child, DailyLog } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MOOD_OPTIONS = [
  { value: "happy",     label: "Happy",     emoji: "😄", color: "bg-yellow-100 border-yellow-400 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  { value: "calm",      label: "Calm",      emoji: "😌", color: "bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "fussy",     label: "Fussy",     emoji: "😤", color: "bg-orange-100 border-orange-400 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  { value: "tired",     label: "Tired",     emoji: "😴", color: "bg-purple-100 border-purple-400 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  { value: "sick",      label: "Sick",      emoji: "🤒", color: "bg-red-100 border-red-400 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  { value: "excited",   label: "Excited",   emoji: "🤩", color: "bg-pink-100 border-pink-400 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300" },
];

const EMPTY_FORM = {
  sleep_hours: "",
  diet_details: "",
  mood: "",
  physical_activity_minutes: "",
  notes: "",
};

type FormState = typeof EMPTY_FORM;

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Mini Stat Badge (used in history list)
// ─────────────────────────────────────────────────────────────────────────────

function Badge({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
      <span>{icon}</span> {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// History Card
// ─────────────────────────────────────────────────────────────────────────────

function HistoryCard({ log }: { log: DailyLog }) {
  const moodObj = MOOD_OPTIONS.find((m) => m.value === log.mood);
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
          {formatDisplayDate(log.log_date)}
        </p>
        {moodObj && (
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${moodObj.color}`}>
            {moodObj.emoji} {moodObj.label}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {log.sleep_hours !== undefined && log.sleep_hours !== null && (
          <Badge icon="😴" label={`${log.sleep_hours}h sleep`} />
        )}
        {log.physical_activity_minutes !== undefined && log.physical_activity_minutes !== null && (
          <Badge icon="🏃" label={`${log.physical_activity_minutes} min activity`} />
        )}
        {log.diet_details && (
          <Badge icon="🍽️" label={log.diet_details.slice(0, 30) + (log.diet_details.length > 30 ? "…" : "")} />
        )}
      </div>
      {log.notes && (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 italic border-t border-slate-100 dark:border-slate-800 pt-2">
          "{log.notes}"
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DailyLogPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [existingLog, setExistingLog] = useState<DailyLog | null>(null);

  const [history, setHistory] = useState<DailyLog[]>([]);

  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingLog, setLoadingLog] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Auth Guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!token) router.replace("/login");
  }, [authLoading, token]);

  // ── Load children ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading || !token) return;
    (async () => {
      try {
        setLoadingChildren(true);
        const res = await childService.getAllChildren();
        if (res.success && res.data && res.data.length > 0) {
          setChildren(res.data);
          setSelectedChildId(res.data[0].id);
        }
      } catch (e: any) {
        setError(e.message || "Failed to load children.");
      } finally {
        setLoadingChildren(false);
      }
    })();
  }, [authLoading, token]);

  // ── Load log for selected child + date ────────────────────────────────────
  const loadLog = useCallback(async (childId: string, date: string) => {
    if (!childId || !date) return;
    setLoadingLog(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const res = await dailyLogService.getLogByDate(childId, date);
      if (res.success && res.data) {
        setExistingLog(res.data);
        setForm({
          sleep_hours:               String(res.data.sleep_hours ?? ""),
          diet_details:              res.data.diet_details ?? "",
          mood:                      res.data.mood ?? "",
          physical_activity_minutes: String(res.data.physical_activity_minutes ?? ""),
          notes:                     res.data.notes ?? "",
        });
      } else {
        setExistingLog(null);
        setForm(EMPTY_FORM);
      }
    } catch {
      setExistingLog(null);
      setForm(EMPTY_FORM);
    } finally {
      setLoadingLog(false);
    }
  }, []);

  useEffect(() => {
    if (selectedChildId && selectedDate) {
      loadLog(selectedChildId, selectedDate);
    }
  }, [selectedChildId, selectedDate, loadLog]);

  // ── Load 7-day history ────────────────────────────────────────────────────
  const loadHistory = useCallback(async (childId: string) => {
    if (!childId) return;
    setLoadingHistory(true);
    try {
      const end = todayStr();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 29);
      const start = startDate.toISOString().split("T")[0];
      const res = await dailyLogService.getLogsByDateRange(childId, start, end);
      if (res.success && res.data) {
        setHistory(res.data);
      }
    } catch {
      // silent — history is non-critical
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (selectedChildId) loadHistory(selectedChildId);
  }, [selectedChildId, loadHistory]);

  // ── Handle form save ──────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId) return;

    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const payload: Partial<DailyLog> = {
        child_id: selectedChildId,
        log_date: selectedDate,
        sleep_hours:               form.sleep_hours ? Number(form.sleep_hours) : undefined,
        diet_details:              form.diet_details || undefined,
        mood:                      form.mood || undefined,
        physical_activity_minutes: form.physical_activity_minutes ? Number(form.physical_activity_minutes) : undefined,
        notes:                     form.notes || undefined,
      };

      const res = await dailyLogService.upsertLog(payload);
      if (res.success && res.data) {
        setExistingLog(res.data);
        setSaveSuccess(true);
        // Refresh history if the saved date is in the 30-day window
        loadHistory(selectedChildId);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError(res.error ?? "Failed to save log.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save log.");
    } finally {
      setSaving(false);
    }
  };

  const selectedChild = children.find((c) => c.id === selectedChildId);

  // ─────────────────────────────────────────────────────────────────────────
  // Loading skeleton
  // ─────────────────────────────────────────────────────────────────────────
  if (authLoading || loadingChildren) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading daily log…</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-50">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex">
        <div className="flex h-16 items-center px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm">CS</div>
          <span className="ml-3 text-lg font-bold tracking-tight">Child Steper</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {[
            { href: "/dashboard",              label: "Dashboard",       icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
            { href: "/dashboard/growth",       label: "Growth Tracker",  icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
            { href: "/dashboard/milestones",   label: "Milestones",      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
            { href: "/dashboard/vaccinations", label: "Vaccinations",    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
          ].map(({ href, label, icon }) => (
            <Link key={href} href={href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
              <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
              </svg>
              {label}
            </Link>
          ))}
          <Link href="/dashboard/daily-log" className="flex items-center gap-3 rounded-lg bg-violet-50 px-3 py-2.5 text-sm font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
            <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Daily Log
          </Link>
        </nav>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">

        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 sm:px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">Daily Routine & Progress</h1>
          </div>

          {/* Child + Date selectors */}
          <div className="flex items-center gap-2">
            {children.length > 1 && (
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                ))}
              </select>
            )}
            <input
              type="date"
              max={todayStr()}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
        </header>

        <div className="p-4 sm:p-8">
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">

            {/* ── LEFT: Input Form ───────────────────────────────────────────── */}
            <div className="xl:col-span-2 space-y-6">

              {/* Hero banner */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 p-6 sm:p-8 text-white shadow-lg">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">📓</span>
                    <span className="text-xs font-semibold uppercase tracking-widest text-violet-100">Daily Journal</span>
                  </div>
                  <h2 className="text-2xl font-bold">
                    {selectedChild ? `${selectedChild.first_name}'s Day` : "Log Today"}
                  </h2>
                  <p className="mt-1 text-violet-100 text-sm">
                    {formatDisplayDate(selectedDate)}
                  </p>
                  {existingLog && (
                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Entry exists — editing
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -top-6 right-16 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
              </div>

              {/* Error / Success */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
              {saveSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/20 p-4 text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Daily log saved successfully!
                </div>
              )}

              {/* No children state */}
              {children.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
                  <div className="text-4xl mb-3">👶</div>
                  <h3 className="text-lg font-semibold">No children added yet</h3>
                  <p className="text-sm text-slate-500 mt-1 mb-4">Add a child profile to start logging their daily routine.</p>
                  <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors">
                    Go to Dashboard
                  </Link>
                </div>
              ) : loadingLog ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-5">

                  {/* ── Mood Picker ──────────────────────────────────────── */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">
                      😊 How's the mood today?
                    </label>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {MOOD_OPTIONS.map((m) => (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, mood: f.mood === m.value ? "" : m.value }))}
                          className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center transition-all
                            ${form.mood === m.value
                              ? `${m.color} border-current scale-105 shadow-sm`
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                            }`}
                        >
                          <span className="text-2xl">{m.emoji}</span>
                          <span className="text-xs font-semibold leading-tight">{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Sleep & Activity ─────────────────────────────────── */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                    {/* Sleep */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
                        😴 Sleep Hours
                      </label>
                      <p className="text-xs text-slate-400 mb-3">Total hours of sleep last night</p>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          max="24"
                          step="0.5"
                          placeholder="e.g. 10"
                          value={form.sleep_hours}
                          onChange={(e) => setForm((f) => ({ ...f, sleep_hours: e.target.value }))}
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                        />
                        <span className="text-sm text-slate-400 flex-shrink-0">hrs</span>
                      </div>
                      {/* Sleep quality bar */}
                      {form.sleep_hours && (
                        <div className="mt-3">
                          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-violet-400 to-purple-500 transition-all"
                              style={{ width: `${Math.min((Number(form.sleep_hours) / 14) * 100, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {Number(form.sleep_hours) >= 10 ? "✅ Great sleep!" : Number(form.sleep_hours) >= 7 ? "🟡 Adequate" : "⚠️ Low — needs more rest"}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Physical Activity */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
                        🏃 Physical Activity
                      </label>
                      <p className="text-xs text-slate-400 mb-3">Total active play time in minutes</p>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          max="480"
                          placeholder="e.g. 60"
                          value={form.physical_activity_minutes}
                          onChange={(e) => setForm((f) => ({ ...f, physical_activity_minutes: e.target.value }))}
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                        />
                        <span className="text-sm text-slate-400 flex-shrink-0">min</span>
                      </div>
                      {form.physical_activity_minutes && (
                        <div className="mt-3">
                          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all"
                              style={{ width: `${Math.min((Number(form.physical_activity_minutes) / 120) * 100, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {Number(form.physical_activity_minutes) >= 60 ? "✅ Active day!" : Number(form.physical_activity_minutes) >= 30 ? "🟡 Good effort" : "⚠️ More activity recommended"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Diet Details ──────────────────────────────────────── */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
                      🍽️ Diet & Meals
                    </label>
                    <p className="text-xs text-slate-400 mb-3">What did your child eat today? Meals, snacks, hydration, appetite notes.</p>
                    <textarea
                      rows={3}
                      placeholder="e.g. Breakfast: oatmeal & banana. Lunch: rice & chicken soup. Snack: apple slices. Good appetite overall."
                      value={form.diet_details}
                      onChange={(e) => setForm((f) => ({ ...f, diet_details: e.target.value }))}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none resize-none"
                    />
                  </div>

                  {/* ── General Notes ─────────────────────────────────────── */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
                      📝 Notes & Observations
                    </label>
                    <p className="text-xs text-slate-400 mb-3">Anything noteworthy — behaviour, symptoms, new skills, medications, etc.</p>
                    <textarea
                      rows={4}
                      placeholder="e.g. Said a new word today! Seemed a little tired after lunch. No fever, all good."
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Save button */}
                  <button
                    type="submit"
                    disabled={saving || !selectedChildId}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/30 hover:from-violet-700 hover:to-purple-700 transition-all disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving…
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {existingLog ? "Update Log" : "Save Daily Log"}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* ── RIGHT: 30-Day History ──────────────────────────────────────── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
                  Past 30 Days
                </h2>
                <span className="rounded-full bg-violet-100 dark:bg-violet-900/30 px-2.5 py-0.5 text-xs font-bold text-violet-700 dark:text-violet-300">
                  {history.length} entries
                </span>
              </div>

              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-7 w-7 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
                </div>
              ) : history.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
                  <div className="text-3xl mb-2">📭</div>
                  <p className="text-sm text-slate-500">No logs in the past 30 days yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Start by filling the form on the left.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
                  {history.map((log) => (
                    <button
                      key={log.id}
                      type="button"
                      onClick={() => setSelectedDate(log.log_date)}
                      className="w-full text-left"
                    >
                      <HistoryCard log={log} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

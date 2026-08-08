"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { childService } from "@/services/childService";
import { vaccinationService } from "@/services/vaccinationService";
import VaccinationModal from "@/components/VaccinationModal";
import type { Child, VaccinationRecord, MarkAdministeredPayload } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function isOverdue(record: VaccinationRecord): boolean {
  if (record.status === "administered" || record.status === "skipped") return false;
  return new Date(record.scheduled_date) < new Date(new Date().toDateString());
}

function isUpcoming(record: VaccinationRecord): boolean {
  if (record.status !== "scheduled") return false;
  const scheduled = new Date(record.scheduled_date);
  const today = new Date(new Date().toDateString());
  const in30 = new Date(today);
  in30.setDate(today.getDate() + 30);
  return scheduled >= today && scheduled <= in30;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ageLabel(months: number): string {
  if (months === 0) return "At Birth";
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""}`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (m === 0) return `${y} year${y !== 1 ? "s" : ""}`;
  return `${y}y ${m}m`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

function StatCard({ label, count, icon, colorClass, bgClass, borderClass }: StatCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${borderClass} ${bgClass} p-5 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-semibold uppercase tracking-wider ${colorClass} opacity-80`}>
            {label}
          </p>
          <p className={`mt-1 text-4xl font-bold ${colorClass}`}>{count}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">vaccines</p>
        </div>
        <div className={`rounded-xl p-3 ${bgClass} border ${borderClass}`}>
          {icon}
        </div>
      </div>
      {/* Decorative blob */}
      <div className={`absolute -bottom-4 -right-4 h-20 w-20 rounded-full ${bgClass} opacity-40`} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Timeline Row
// ─────────────────────────────────────────────────────────────────────────────

interface RowProps {
  record: VaccinationRecord;
  onMark: (record: VaccinationRecord) => void;
}

function ScheduledRow({ record, onMark }: RowProps) {
  const overdue = isOverdue(record);
  return (
    <div className={`group flex items-center gap-4 rounded-xl border p-4 transition-all hover:shadow-sm
      ${overdue
        ? "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-900/10"
        : "border-blue-200 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-900/10"
      }`}
    >
      {/* Status dot */}
      <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full
        ${overdue ? "bg-red-100 dark:bg-red-900/30" : "bg-blue-100 dark:bg-blue-900/30"}`}
      >
        {overdue ? (
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 dark:text-slate-50 truncate">
          {record.vaccine?.name ?? "Unknown Vaccine"}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
          {record.vaccine?.description ?? ""}
        </p>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium
            ${overdue
              ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
              : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
            }`}
          >
            {overdue ? "⚠ Overdue" : "🔵 Upcoming"}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Due: {formatDate(record.scheduled_date)}
          </span>
          {record.vaccine && (
            <span className="text-xs text-slate-400">
              Age: {ageLabel(record.vaccine.recommended_age_months)}
            </span>
          )}
        </div>
      </div>

      {/* Action */}
      <button
        onClick={() => onMark(record)}
        title="Mark as administered"
        className={`flex-shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all
          ${overdue
            ? "bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-200"
            : "bg-blue-500 text-white hover:bg-blue-600 shadow-sm shadow-blue-200"
          }`}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        <span className="hidden sm:inline">Mark Done</span>
      </button>
    </div>
  );
}

function AdministeredRow({ record }: { record: VaccinationRecord }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/10 p-4">
      {/* Check circle */}
      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 dark:text-slate-50 truncate">
          {record.vaccine?.name ?? "Unknown Vaccine"}
        </p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            ✓ Administered
          </span>
          {record.administered_date && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {formatDate(record.administered_date)}
            </span>
          )}
          {record.administered_by && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              by {record.administered_by}
            </span>
          )}
        </div>
        {record.notes && (
          <p className="mt-1 text-xs text-slate-400 italic truncate">
            "{record.notes}"
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section Header
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({
  title, count, colorClass, icon,
}: { title: string; count: number; colorClass: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className={`h-8 w-8 flex items-center justify-center rounded-lg ${colorClass}`}>
        {icon}
      </div>
      <h3 className="font-bold text-slate-900 dark:text-slate-50 text-base">{title}</h3>
      <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-bold ${colorClass}`}>
        {count}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function VaccinationsPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [records, setRecords] = useState<VaccinationRecord[]>([]);

  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [initializing, setInitializing] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [modalRecord, setModalRecord] = useState<VaccinationRecord | null>(null);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.replace("/login");
    }
  }, [authLoading, token]);

  // ── Fetch children list ───────────────────────────────────────────────────
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

  // ── Fetch vaccination schedule whenever child changes ─────────────────────
  const fetchSchedule = useCallback(async (childId: string) => {
    if (!childId) return;
    try {
      setLoadingRecords(true);
      setError(null);

      const res = await vaccinationService.getSchedule(childId);

      if (res.success && res.data) {
        // If no records yet, auto-initialize
        if (res.data.length === 0) {
          setInitializing(true);
          const initRes = await vaccinationService.initializeSchedule(childId);
          setInitializing(false);
          if (initRes.success) {
            // Re-fetch after initialization
            const refetch = await vaccinationService.getSchedule(childId);
            setRecords(refetch.data ?? []);
          }
        } else {
          setRecords(res.data);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load vaccination schedule.");
      setInitializing(false);
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchSchedule(selectedChildId);
    }
  }, [selectedChildId, fetchSchedule]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const today = new Date(new Date().toDateString());
    const in30 = new Date(today);
    in30.setDate(today.getDate() + 30);

    let completed = 0;
    let overdue = 0;
    let upcoming = 0;

    for (const r of records) {
      if (r.status === "administered") {
        completed++;
      } else if (new Date(r.scheduled_date) < today) {
        overdue++;
      } else if (new Date(r.scheduled_date) <= in30) {
        upcoming++;
      }
    }
    return { completed, overdue, upcoming };
  }, [records]);

  // ── Partition records into sections ───────────────────────────────────────
  const { overdueList, upcomingList, futureList, completedList } = useMemo(() => {
    const today = new Date(new Date().toDateString());
    const in30 = new Date(today);
    in30.setDate(today.getDate() + 30);

    const overdueList: VaccinationRecord[] = [];
    const upcomingList: VaccinationRecord[] = [];
    const futureList: VaccinationRecord[] = [];
    const completedList: VaccinationRecord[] = [];

    for (const r of records) {
      if (r.status === "administered" || r.status === "skipped") {
        completedList.push(r);
      } else {
        const d = new Date(r.scheduled_date);
        if (d < today) overdueList.push(r);
        else if (d <= in30) upcomingList.push(r);
        else futureList.push(r);
      }
    }

    return { overdueList, upcomingList, futureList, completedList };
  }, [records]);

  // ── Handle mark administered submit ──────────────────────────────────────
  const handleMarkAdministered = async (
    recordId: string,
    payload: MarkAdministeredPayload
  ): Promise<VaccinationRecord> => {
    const res = await vaccinationService.markAdministered(recordId, payload);
    if (!res.success || !res.data) {
      throw new Error(res.error ?? "Failed to update record.");
    }
    return res.data;
  };

  const handleModalSuccess = useCallback((updated: VaccinationRecord) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
  }, []);

  // ── Selected child name ───────────────────────────────────────────────────
  const selectedChild = children.find((c) => c.id === selectedChildId);

  // ─────────────────────────────────────────────────────────────────────────
  // Loading states
  // ─────────────────────────────────────────────────────────────────────────
  if (authLoading || loadingChildren) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading vaccinations...</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Main UI
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-50">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex">
        <div className="flex h-16 items-center px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm">
            CS
          </div>
          <span className="ml-3 text-lg font-bold tracking-tight">Child Steper</span>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Dashboard
          </Link>
          <Link href="/dashboard/growth" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Growth Tracker
          </Link>
          <Link href="/dashboard/milestones" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Milestones
          </Link>
          <Link href="/dashboard/vaccinations" className="flex items-center gap-3 rounded-lg bg-teal-50 px-3 py-2.5 text-sm font-medium text-teal-700 dark:bg-teal-500/10 dark:text-teal-400 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            Vaccinations
          </Link>
        </nav>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">

        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 sm:px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Vaccination Schedule
            </h1>
          </div>

          {/* Child Selector */}
          {children.length > 1 && (
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </option>
              ))}
            </select>
          )}
        </header>

        <div className="p-4 sm:p-8 space-y-8">

          {/* ── Hero Banner ──────────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-600 p-6 sm:p-8 text-white shadow-lg">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">💉</span>
                <span className="text-sm font-semibold uppercase tracking-wider text-teal-100">
                  Immunization Tracker
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">
                {selectedChild
                  ? `${selectedChild.first_name}'s Vaccines`
                  : "Vaccination Schedule"}
              </h2>
              <p className="mt-1 text-teal-100 text-sm max-w-md">
                Keep your child protected. Track every dose on schedule and never miss an important immunization.
              </p>
              {initializing && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Setting up schedule…
                </div>
              )}
            </div>
            {/* Decorative blobs */}
            <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -top-8 right-24 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
          </div>

          {/* ── Error ────────────────────────────────────────────────────── */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* ── Stat Cards ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Completed"
              count={stats.completed}
              colorClass="text-emerald-700 dark:text-emerald-400"
              bgClass="bg-emerald-50 dark:bg-emerald-900/20"
              borderClass="border-emerald-200 dark:border-emerald-800/40"
              icon={
                <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              }
            />
            <StatCard
              label="Overdue"
              count={stats.overdue}
              colorClass="text-red-700 dark:text-red-400"
              bgClass="bg-red-50 dark:bg-red-900/20"
              borderClass="border-red-200 dark:border-red-800/40"
              icon={
                <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              label="Upcoming (30 days)"
              count={stats.upcoming}
              colorClass="text-blue-700 dark:text-blue-400"
              bgClass="bg-blue-50 dark:bg-blue-900/20"
              borderClass="border-blue-200 dark:border-blue-800/40"
              icon={
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
          </div>

          {/* ── Timeline ─────────────────────────────────────────────────── */}
          {loadingRecords ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
              <p className="text-sm text-slate-500">Loading schedule…</p>
            </div>
          ) : children.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
              <div className="text-4xl mb-3">👶</div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No children added yet</h3>
              <p className="text-sm text-slate-500 mt-1 mb-4">Add a child profile first to initialize their vaccination schedule.</p>
              <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors">
                Go to Dashboard
              </Link>
            </div>
          ) : records.length === 0 && !initializing ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
              <div className="text-4xl mb-3">💉</div>
              <p className="text-sm text-slate-500">No vaccination records found.</p>
            </div>
          ) : (
            <div className="space-y-8">

              {/* Overdue */}
              {overdueList.length > 0 && (
                <section>
                  <SectionHeader
                    title="Overdue"
                    count={overdueList.length}
                    colorClass="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    icon={
                      <svg className="h-4 w-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    }
                  />
                  <div className="space-y-2">
                    {overdueList.map((r) => (
                      <ScheduledRow key={r.id} record={r} onMark={setModalRecord} />
                    ))}
                  </div>
                </section>
              )}

              {/* Upcoming / Next 30 days */}
              {upcomingList.length > 0 && (
                <section>
                  <SectionHeader
                    title="Upcoming — Next 30 Days"
                    count={upcomingList.length}
                    colorClass="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    icon={
                      <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    }
                  />
                  <div className="space-y-2">
                    {upcomingList.map((r) => (
                      <ScheduledRow key={r.id} record={r} onMark={setModalRecord} />
                    ))}
                  </div>
                </section>
              )}

              {/* Future / Scheduled */}
              {futureList.length > 0 && (
                <section>
                  <SectionHeader
                    title="Scheduled (Future)"
                    count={futureList.length}
                    colorClass="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    icon={
                      <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  />
                  <div className="space-y-2">
                    {futureList.map((r) => (
                      <ScheduledRow key={r.id} record={r} onMark={setModalRecord} />
                    ))}
                  </div>
                </section>
              )}

              {/* Completed */}
              {completedList.length > 0 && (
                <section>
                  <SectionHeader
                    title="Completed"
                    count={completedList.length}
                    colorClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    icon={
                      <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    }
                  />
                  <div className="space-y-2">
                    {completedList.map((r) => (
                      <AdministeredRow key={r.id} record={r} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── Vaccination Modal ─────────────────────────────────────────────── */}
      <VaccinationModal
        isOpen={modalRecord !== null}
        record={modalRecord}
        onClose={() => setModalRecord(null)}
        onSuccess={handleModalSuccess}
        onSubmit={handleMarkAdministered}
      />
    </div>
  );
}

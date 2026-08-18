"use client";

import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import { childService } from "@/services/childService";
import { educationService } from "@/services/educationService";
import AddEducationRecordForm from "@/components/AddEducationRecordForm";
import type { Child, EducationalRecord } from "@/types";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Colour palette for the bar chart bars (cycles by subject index) */
const CHART_COLORS = [
  "#6366f1", // indigo
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ec4899", // pink
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#14b8a6", // teal
  "#f97316", // orange
];

// ── Pure Helpers ──────────────────────────────────────────────────────────────

/** Converts a score_or_grade string to a numeric 0-100 value, or null. */
function scoreToNumber(raw: string): number | null {
  const s = raw.trim();
  // "92%" or "92.5%"
  const pctMatch = s.match(/^(\d+(\.\d+)?)%$/);
  if (pctMatch) return Math.min(parseFloat(pctMatch[1]), 100);
  // "78/100" or "45/50"
  const fracMatch = s.match(/^(\d+(\.\d+)?)\s*\/\s*(\d+(\.\d+)?)$/);
  if (fracMatch) {
    const num = parseFloat(fracMatch[1]);
    const den = parseFloat(fracMatch[3]);
    if (den > 0) return Math.min((num / den) * 100, 100);
  }
  // Letter grades → numeric equivalent
  const letter = s.toUpperCase();
  const letterMap: Record<string, number> = {
    "A+": 98, A: 95, "A-": 92,
    "B+": 88, B: 85, "B-": 82,
    "C+": 78, C: 75, "C-": 72,
    "D+": 68, D: 65, "D-": 62,
    F: 50,
  };
  if (letter in letterMap) return letterMap[letter];
  // Plain number "85"
  const num = parseFloat(s);
  if (!isNaN(num)) return Math.min(num, 100);
  return null;
}

/** Groups records by academic_year. Returns keys sorted latest-first. */
function groupByYear(records: EducationalRecord[]): Record<string, EducationalRecord[]> {
  return records.reduce<Record<string, EducationalRecord[]>>((acc, r) => {
    if (!acc[r.academic_year]) acc[r.academic_year] = [];
    acc[r.academic_year].push(r);
    return acc;
  }, {});
}

/** Returns the display label for the logger (teacher / parent). */
function loggerLabel(record: EducationalRecord): string {
  if (record.logger?.full_name) return record.logger.full_name;
  if (record.logger?.email) return record.logger.email;
  return "Unknown";
}

/** Format ISO timestamp to a friendly date string. */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Grade level display badge colour */
function gradeBadgeClass(gradeLevel: string): string {
  const lower = gradeLevel.toLowerCase();
  if (lower.includes("pre") || lower.includes("k")) return "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300";
  const num = parseInt(gradeLevel.replace(/\D/g, ""), 10);
  if (isNaN(num)) return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
  if (num <= 3) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
  if (num <= 6) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (num <= 9) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300";
}

/** Score badge colour based on numeric value */
function scoreBadgeClass(score: string): string {
  const n = scoreToNumber(score);
  if (n === null) return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
  if (n >= 90) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (n >= 75) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
  if (n >= 60) return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
  return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Loading skeleton card */
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl bg-white dark:bg-gray-800 p-5 shadow-soft border border-gray-100 dark:border-gray-700">
      <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-700 rounded-full mb-3" />
      <div className="h-5 w-2/3 bg-gray-200 dark:bg-gray-700 rounded-full mb-2" />
      <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-full" />
    </div>
  );
}

/** Empty state illustration */
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="mb-4 text-6xl select-none">📚</div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        No academic records yet
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">
        Start tracking your child's educational progress by adding the first
        academic record.
      </p>
      <button
        onClick={onAdd}
        className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 text-sm font-semibold shadow-sm transition-colors"
      >
        + Add First Record
      </button>
    </div>
  );
}

/** Delete confirmation modal */
function DeleteConfirmModal({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-glass-lg border border-gray-100 dark:border-gray-700">
        <div className="text-3xl mb-3 text-center">🗑️</div>
        <h3 className="text-center text-base font-bold text-gray-900 dark:text-white mb-1">
          Delete this record?
        </h3>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-5">
          This action cannot be undone. The academic record will be permanently
          removed.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 py-2 text-sm font-medium
              text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white py-2 text-sm font-semibold
              transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Custom Tooltip for Recharts ───────────────────────────────────────────────

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 shadow-glass text-xs">
      <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-0.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600 dark:text-gray-400">{entry.name}:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {entry.value.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EducationDashboardPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [records, setRecords] = useState<EducationalRecord[]>([]);

  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [childrenError, setChildrenError] = useState("");
  const [recordsError, setRecordsError] = useState("");

  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EducationalRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showToast = useCallback(
    (type: "success" | "error", msg: string) => {
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      setToast({ type, msg });
      toastTimeout.current = setTimeout(() => setToast(null), 3500);
    },
    []
  );

  // ── Load children on auth ──────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        setLoadingChildren(true);
        const res = await childService.getAllChildren();
        if (res.success && res.data) {
          setChildren(res.data);
          if (res.data.length > 0) setSelectedChild(res.data[0]);
        }
      } catch (err: any) {
        setChildrenError(err.message || "Failed to load children profiles.");
      } finally {
        setLoadingChildren(false);
      }
    })();
  }, [authLoading, token, router]);

  // ── Load records when selected child changes ───────────────────────────────
  useEffect(() => {
    if (!selectedChild) return;
    (async () => {
      try {
        setLoadingRecords(true);
        setRecordsError("");
        setSelectedYear(null);
        const res = await educationService.getHistory(selectedChild.id);
        if (res.success && res.data) {
          setRecords(res.data);
          // Auto-select the most recent year
          const years = [...new Set(res.data.map((r) => r.academic_year))].sort(
            (a, b) => b.localeCompare(a)
          );
          if (years.length > 0) setSelectedYear(years[0]);
        } else {
          setRecords([]);
        }
      } catch (err: any) {
        setRecordsError(err.message || "Failed to load academic records.");
      } finally {
        setLoadingRecords(false);
      }
    })();
  }, [selectedChild]);

  // ── Derived Data ───────────────────────────────────────────────────────────

  const grouped = useMemo(() => groupByYear(records), [records]);
  const years = useMemo(
    () => Object.keys(grouped).sort((a, b) => b.localeCompare(a)),
    [grouped]
  );
  const activeRecords = useMemo(
    () => (selectedYear ? (grouped[selectedYear] ?? []) : []),
    [grouped, selectedYear]
  );

  /** Build bar-chart data: one entry per grade level, one bar per subject */
  const chartData = useMemo(() => {
    if (!activeRecords.length) return { data: [], subjects: [] };

    // Collect unique subjects in this year-view
    const subjectSet = new Set<string>();
    activeRecords.forEach((r) => subjectSet.add(r.subject));
    const subjects = [...subjectSet];

    // Group by grade_level
    const byGrade: Record<string, Record<string, number[]>> = {};
    activeRecords.forEach((r) => {
      if (!byGrade[r.grade_level]) byGrade[r.grade_level] = {};
      if (!byGrade[r.grade_level][r.subject]) byGrade[r.grade_level][r.subject] = [];
      const n = scoreToNumber(r.score_or_grade);
      if (n !== null) byGrade[r.grade_level][r.subject].push(n);
    });

    const data = Object.entries(byGrade).map(([grade, subjectMap]) => {
      const entry: Record<string, string | number> = { grade_level: grade };
      subjects.forEach((sub) => {
        const vals = subjectMap[sub];
        if (vals && vals.length > 0) {
          entry[sub] = parseFloat(
            (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
          );
        }
      });
      return entry;
    });

    return { data, subjects };
  }, [activeRecords]);

  /** Records with teacher feedback */
  const feedbackRecords = useMemo(
    () => activeRecords.filter((r) => r.teacher_feedback),
    [activeRecords]
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleRecordAdded = useCallback(
    (newRecord: EducationalRecord) => {
      setRecords((prev) => [newRecord, ...prev]);
      setShowForm(false);
      setSelectedYear(newRecord.academic_year);
      showToast("success", "Academic record added successfully!");
    },
    [showToast]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await educationService.deleteRecord(deleteTarget.id);
      setRecords((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
      showToast("success", "Record deleted.");
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete record.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, showToast]);

  // ── Overview Stats ─────────────────────────────────────────────────────────
  const overallAvg = useMemo(() => {
    const nums = activeRecords
      .map((r) => scoreToNumber(r.score_or_grade))
      .filter((n): n is number => n !== null);
    if (!nums.length) return null;
    return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1);
  }, [activeRecords]);

  // ── Loading / Auth Guards ──────────────────────────────────────────────────
  if (authLoading || loadingChildren) {
    return (
      <div className="min-h-screen bg-gradient-hero dark:bg-gray-950 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-glass-lg text-sm font-medium animate-slide-up
          ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          <span>{toast.type === "success" ? "✅" : "⚠️"}</span>
          {toast.msg}
        </div>
      )}

      {/* ── Delete modal ───────────────────────────────────────────────────── */}
      {deleteTarget && (
        <DeleteConfirmModal
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                ← Back
              </Link>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <div className="flex items-center gap-2">
                <span className="text-xl">🎓</span>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  Educational Progress
                </h1>
              </div>
            </div>
            {selectedChild && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800
                  text-white px-4 py-2 text-sm font-semibold shadow-sm transition-colors"
              >
                <span>+</span>
                <span className="hidden sm:inline">Add Record</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* ── Error States ────────────────────────────────────────────────── */}
        {childrenError && (
          <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            ⚠️ {childrenError}
          </div>
        )}

        {children.length === 0 && !loadingChildren && (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">👶</p>
            <p className="text-gray-500 dark:text-gray-400">
              No children found. Add a child profile first.
            </p>
            <Link
              href="/dashboard"
              className="inline-block mt-4 text-indigo-600 hover:underline text-sm"
            >
              Go to Dashboard →
            </Link>
          </div>
        )}

        {children.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* ── Sidebar ───────────────────────────────────────────────────── */}
            <aside className="w-full lg:w-72 flex-shrink-0 space-y-4">
              {/* Child selector */}
              <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-soft p-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  Children
                </h2>
                <div className="space-y-1">
                  {children.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedChild(c);
                        setShowForm(false);
                      }}
                      className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors text-sm
                        ${
                          selectedChild?.id === c.id
                            ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                    >
                      <span
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                        ${
                          selectedChild?.id === c.id
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {c.first_name.charAt(0).toUpperCase()}
                      </span>
                      <span className="truncate">
                        {c.first_name} {c.last_name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Academic Year selector */}
              {years.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-soft p-4">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                    Academic Years
                  </h2>
                  <div className="space-y-1">
                    {years.map((yr) => {
                      const count = grouped[yr]?.length ?? 0;
                      return (
                        <button
                          key={yr}
                          onClick={() => setSelectedYear(yr)}
                          className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors text-sm
                            ${
                              selectedYear === yr
                                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                        >
                          <span>📅 {yr}</span>
                          <span
                            className={`text-xs rounded-full px-2 py-0.5
                              ${
                                selectedYear === yr
                                  ? "bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                              }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Summary card */}
              {activeRecords.length > 0 && (
                <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-4 text-white shadow-soft">
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-75 mb-2">
                    {selectedYear} Overview
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-2xl font-bold">{activeRecords.length}</p>
                      <p className="text-xs opacity-75">Records</p>
                    </div>
                    {overallAvg !== null && (
                      <div>
                        <p className="text-2xl font-bold">{overallAvg}%</p>
                        <p className="text-xs opacity-75">Avg. Score</p>
                      </div>
                    )}
                    <div>
                      <p className="text-2xl font-bold">
                        {chartData.subjects.length}
                      </p>
                      <p className="text-xs opacity-75">Subjects</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{feedbackRecords.length}</p>
                      <p className="text-xs opacity-75">Feedback</p>
                    </div>
                  </div>
                </div>
              )}
            </aside>

            {/* ── Main Content ──────────────────────────────────────────────── */}
            <main className="flex-1 min-w-0 space-y-6">
              {/* Add Record Form Panel */}
              {showForm && selectedChild && (
                <div className="rounded-2xl bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 shadow-glass p-6 animate-slide-up">
                  <AddEducationRecordForm
                    child={selectedChild}
                    onSuccess={handleRecordAdded}
                    onCancel={() => setShowForm(false)}
                  />
                </div>
              )}

              {/* Loading skeleton */}
              {loadingRecords && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              )}

              {/* Records error */}
              {recordsError && !loadingRecords && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                  ⚠️ {recordsError}
                </div>
              )}

              {/* Empty state */}
              {!loadingRecords && !recordsError && records.length === 0 && !showForm && (
                <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-soft">
                  <EmptyState onAdd={() => setShowForm(true)} />
                </div>
              )}

              {/* ── Subject Performance Chart ──────────────────────────────── */}
              {!loadingRecords && chartData.data.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-soft p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-bold text-gray-900 dark:text-white">
                        Subject Performance
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Average scores by subject — {selectedYear}
                      </p>
                    </div>
                    <span className="text-2xl select-none">📊</span>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={chartData.data}
                      margin={{ top: 5, right: 10, left: -15, bottom: 5 }}
                      barCategoryGap="25%"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e5e7eb"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="grade_level"
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                      />
                      {chartData.subjects.map((subject, idx) => (
                        <Bar
                          key={subject}
                          dataKey={subject}
                          name={subject}
                          fill={CHART_COLORS[idx % CHART_COLORS.length]}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={48}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* ── Academic Records Table / Cards ────────────────────────── */}
              {!loadingRecords && activeRecords.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-soft overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">
                      All Records
                      <span className="ml-2 text-xs font-normal text-gray-400">
                        {activeRecords.length} entries
                      </span>
                    </h2>
                  </div>

                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase tracking-wider text-gray-400">
                          <th className="px-5 py-3 text-left font-semibold">Grade</th>
                          <th className="px-5 py-3 text-left font-semibold">Subject</th>
                          <th className="px-5 py-3 text-left font-semibold">Score</th>
                          <th className="px-5 py-3 text-left font-semibold">Logged By</th>
                          <th className="px-5 py-3 text-left font-semibold">Date</th>
                          <th className="px-5 py-3 text-right font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {activeRecords.map((record) => (
                          <tr
                            key={record.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                          >
                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${gradeBadgeClass(record.grade_level)}`}
                              >
                                {record.grade_level}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-gray-800 dark:text-gray-200 font-medium">
                              {record.subject}
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${scoreBadgeClass(record.score_or_grade)}`}
                              >
                                {record.score_or_grade}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">
                              {loggerLabel(record)}
                            </td>
                            <td className="px-5 py-3.5 text-gray-400 text-xs">
                              {formatDate(record.created_at)}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                onClick={() => setDeleteTarget(record)}
                                title="Delete record"
                                className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                    {activeRecords.map((record) => (
                      <div key={record.id} className="px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap gap-1.5 mb-1.5">
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${gradeBadgeClass(record.grade_level)}`}
                              >
                                {record.grade_level}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-bold ${scoreBadgeClass(record.score_or_grade)}`}
                              >
                                {record.score_or_grade}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {record.subject}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {loggerLabel(record)} · {formatDate(record.created_at)}
                            </p>
                          </div>
                          <button
                            onClick={() => setDeleteTarget(record)}
                            className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors flex-shrink-0 text-lg"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Teacher Feedback Feed ─────────────────────────────────── */}
              {!loadingRecords && feedbackRecords.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-soft overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span>💬</span>
                      Teacher Feedback
                      <span className="text-xs font-normal text-gray-400">
                        {feedbackRecords.length} remarks
                      </span>
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {feedbackRecords.map((record) => (
                      <div key={record.id} className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                            {loggerLabel(record).charAt(0).toUpperCase()}
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Meta row */}
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1.5">
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {loggerLabel(record)}
                              </span>
                              <span className="text-xs text-gray-400">
                                · {formatDate(record.created_at)}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${gradeBadgeClass(record.grade_level)}`}
                              >
                                {record.grade_level}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                {record.subject}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-bold ${scoreBadgeClass(record.score_or_grade)}`}
                              >
                                {record.score_or_grade}
                              </span>
                            </div>

                            {/* Feedback text */}
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                              &ldquo;{record.teacher_feedback}&rdquo;
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

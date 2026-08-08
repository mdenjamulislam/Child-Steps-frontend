"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { childService } from "@/services/childService";
import { growthMilestoneService } from "@/services/growthMilestoneService";
import type { Child, GrowthRecord } from "@/types";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  Activity,
  Ruler,
  Weight as WeightIcon,
  CircleDot,
  Plus,
  ArrowLeft,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

export default function GrowthTrackerPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [records, setRecords] = useState<GrowthRecord[]>([]);

  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [heightCm, setHeightCm] = useState<string>("");
  const [weightKg, setWeightKg] = useState<string>("");
  const [headCircumferenceCm, setHeadCircumferenceCm] = useState<string>("");
  const [recordDate, setRecordDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [submittedBmi, setSubmittedBmi] = useState<number | null>(null);

  // Fetch children list on mount
  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      router.replace("/login");
      return;
    }

    const fetchChildren = async () => {
      try {
        setLoadingChildren(true);
        const res = await childService.getAllChildren();
        if (res.success && res.data && res.data.length > 0) {
          setChildren(res.data);
          setSelectedChildId(res.data[0].id);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load children list.");
      } finally {
        setLoadingChildren(false);
      }
    };
    fetchChildren();
  }, [authLoading, token]);

  // Fetch growth records whenever selected child changes
  const fetchGrowthHistory = async (childId: string) => {
    if (!childId) return;
    try {
      setLoadingRecords(true);
      setError(null);
      const res = await growthMilestoneService.getGrowthHistory(childId);
      if (res.success && res.data) {
        setRecords(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch growth history.");
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    if (selectedChildId) {
      fetchGrowthHistory(selectedChildId);
    }
  }, [selectedChildId]);

  // Live BMI calculation preview
  const liveBmi = useMemo(() => {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm);
    if (!isNaN(w) && !isNaN(h) && h > 0 && w > 0) {
      const hM = h / 100;
      return (w / (hM * hM)).toFixed(2);
    }
    return null;
  }, [weightKg, heightCm]);

  // Selected child object
  const activeChild = useMemo(
    () => children.find((c) => c.id === selectedChildId),
    [children, selectedChildId]
  );

  // Form submission
  const handleSubmitRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId) {
      setError("Please select a child profile first.");
      return;
    }

    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm);

    if (isNaN(w) || w <= 0) {
      setError("Please enter a valid weight (kg).");
      return;
    }
    if (isNaN(h) || h <= 0) {
      setError("Please enter a valid height (cm).");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMsg(null);

      const hc = headCircumferenceCm ? parseFloat(headCircumferenceCm) : undefined;

      const res = await growthMilestoneService.addGrowthRecord({
        child_id: selectedChildId,
        weight_kg: w,
        height_cm: h,
        head_circumference_cm: hc,
        record_date: recordDate,
      });

      if (res.success && res.data) {
        setSubmittedBmi(res.data.bmi);
        setSuccessMsg(`Growth record added! Calculated BMI: ${res.data.bmi}`);
        // Reset form inputs
        setHeightCm("");
        setWeightKg("");
        setHeadCircumferenceCm("");
        setRecordDate(new Date().toISOString().split("T")[0]);
        // Refresh growth history chart
        await fetchGrowthHistory(selectedChildId);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save growth record.");
    } finally {
      setSubmitting(false);
    }
  };

  // Format date string for chart X-Axis
  const chartData = useMemo(() => {
    return records.map((rec) => {
      const d = new Date(rec.record_date);
      const formattedDate = !isNaN(d.getTime())
        ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : rec.record_date;
      return {
        ...rec,
        displayDate: formattedDate,
        weight_kg: Number(rec.weight_kg),
        height_cm: Number(rec.height_cm),
        head_circumference_cm: rec.head_circumference_cm
          ? Number(rec.head_circumference_cm)
          : null,
        bmi: Number(rec.bmi),
      };
    });
  }, [records]);

  // BMI Category Helper
  const getBmiCategory = (bmi: number) => {
    if (bmi < 14) return { label: "Underweight", color: "text-amber-600 bg-amber-50 border-amber-200" };
    if (bmi <= 18.5) return { label: "Healthy Weight", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
    if (bmi <= 21) return { label: "Above Average", color: "text-indigo-600 bg-indigo-50 border-indigo-200" };
    return { label: "High", color: "text-purple-600 bg-purple-50 border-purple-200" };
  };

  const latestRecord = records.length > 0 ? records[records.length - 1] : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 pb-16">
      {/* Header Bar */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 sm:px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Growth & Development Tracker
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Physical measurements, growth curves, and BMI tracking
            </p>
          </div>
        </div>

        {/* Child Selector */}
        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-semibold text-slate-500 sm:inline-block dark:text-slate-400">
            Active Child:
          </span>
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            disabled={loadingChildren || children.length === 0}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {children.length === 0 ? (
              <option value="">No children found</option>
            ) : (
              children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </option>
              ))
            )}
          </select>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-8 py-8 space-y-8">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-6 sm:p-8 text-white shadow-xl">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <TrendingUp className="h-3.5 w-3.5" /> Physical Growth Analytics
            </div>
            <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight">
              {activeChild
                ? `${activeChild.first_name}'s Growth Journey`
                : "Child Growth Tracking"}
            </h2>
            <p className="mt-2 text-sm text-indigo-100 opacity-90">
              Log height, weight, and head circumference over time. Automatically calculate BMI and monitor developmental growth trends.
            </p>

            {/* Quick Metrics */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-white/15 backdrop-blur-md p-3 border border-white/20">
                <p className="text-xs text-indigo-100 font-medium">Latest Height</p>
                <p className="text-xl font-extrabold mt-0.5">
                  {latestRecord ? `${latestRecord.height_cm} cm` : "--"}
                </p>
              </div>
              <div className="rounded-2xl bg-white/15 backdrop-blur-md p-3 border border-white/20">
                <p className="text-xs text-indigo-100 font-medium">Latest Weight</p>
                <p className="text-xl font-extrabold mt-0.5">
                  {latestRecord ? `${latestRecord.weight_kg} kg` : "--"}
                </p>
              </div>
              <div className="rounded-2xl bg-white/15 backdrop-blur-md p-3 border border-white/20">
                <p className="text-xs text-indigo-100 font-medium">Calculated BMI</p>
                <p className="text-xl font-extrabold mt-0.5">
                  {latestRecord ? latestRecord.bmi : "--"}
                </p>
              </div>
              <div className="rounded-2xl bg-white/15 backdrop-blur-md p-3 border border-white/20">
                <p className="text-xs text-indigo-100 font-medium">Total Records</p>
                <p className="text-xl font-extrabold mt-0.5">{records.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Grid: Left = Form, Right = Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Form Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Log Measurements
                </h3>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full dark:bg-indigo-950 dark:text-indigo-400">
                  New Entry
                </span>
              </div>

              <form onSubmit={handleSubmitRecord} className="mt-5 space-y-4">
                {/* Date Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Measurement Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={recordDate}
                      onChange={(e) => setRecordDate(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 shadow-sm transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Height Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Height (cm) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      placeholder="e.g. 85.5"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 shadow-sm transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-medium text-slate-400">
                      cm
                    </span>
                  </div>
                </div>

                {/* Weight Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Weight (kg) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      placeholder="e.g. 12.4"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 shadow-sm transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-medium text-slate-400">
                      kg
                    </span>
                  </div>
                </div>

                {/* Head Circumference Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Head Circumference (cm){" "}
                    <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 46.2"
                      value={headCircumferenceCm}
                      onChange={(e) => setHeadCircumferenceCm(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 shadow-sm transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-medium text-slate-400">
                      cm
                    </span>
                  </div>
                </div>

                {/* Live Calculated BMI Display Box */}
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                        Calculated BMI Formula
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        weight (kg) / (height (m))²
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                        {liveBmi || "--"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !selectedChildId}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 hover:shadow-lg disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" /> Saving
                      Measurement...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" /> Add Growth Record
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Visual Chart & History Table Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Chart Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    Growth Trends Over Time
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Plotting Height (cm) and Weight (kg) progress
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full dark:bg-indigo-950 dark:text-indigo-400">
                    <CircleDot className="h-3 w-3" /> Height (cm)
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full dark:bg-emerald-950 dark:text-emerald-400">
                    <CircleDot className="h-3 w-3" /> Weight (kg)
                  </span>
                </div>
              </div>

              {/* Chart Body */}
              <div className="mt-6 h-80 w-full">
                {loadingRecords ? (
                  <div className="flex h-full items-center justify-center">
                    <RefreshCw className="h-7 w-7 animate-spin text-indigo-500" />
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="flex flex-col h-full items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl dark:border-slate-800">
                    <TrendingUp className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      No growth records logged yet
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Use the form on the left to add physical height and weight measurements for this child.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                      <XAxis
                        dataKey="displayDate"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="#6366f1"
                        fontSize={12}
                        tickLine={false}
                        domain={["auto", "auto"]}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#10b981"
                        fontSize={12}
                        tickLine={false}
                        domain={["auto", "auto"]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#1e293b",
                          borderRadius: "12px",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="height_cm"
                        name="Height (cm)"
                        stroke="#6366f1"
                        strokeWidth={3}
                        dot={{ r: 5, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 7 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="weight_kg"
                        name="Weight (kg)"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 5, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Growth Measurement Logs Table */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center justify-between">
                <span>Measurement History Log</span>
                <span className="text-xs text-slate-500 font-normal">
                  {records.length} entries
                </span>
              </h3>

              {records.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">
                  No measurement history available.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-3 rounded-l-xl">Date</th>
                        <th className="px-4 py-3">Height</th>
                        <th className="px-4 py-3">Weight</th>
                        <th className="px-4 py-3">Head Circ.</th>
                        <th className="px-4 py-3">BMI</th>
                        <th className="px-4 py-3 rounded-r-xl">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {records.slice().reverse().map((rec) => {
                        const bmiInfo = getBmiCategory(rec.bmi);
                        return (
                          <tr key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                            <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                              {rec.record_date}
                            </td>
                            <td className="px-4 py-3.5 font-semibold text-indigo-600 dark:text-indigo-400">
                              {rec.height_cm} cm
                            </td>
                            <td className="px-4 py-3.5 font-semibold text-emerald-600 dark:text-emerald-400">
                              {rec.weight_kg} kg
                            </td>
                            <td className="px-4 py-3.5">
                              {rec.head_circumference_cm ? `${rec.head_circumference_cm} cm` : "--"}
                            </td>
                            <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-100">
                              {rec.bmi}
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${bmiInfo.color}`}
                              >
                                {bmiInfo.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

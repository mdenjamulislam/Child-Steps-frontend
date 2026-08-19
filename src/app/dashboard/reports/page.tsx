"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import { childService } from "@/services/childService";
import { reportService } from "@/services/reportService";
import type { Child, ProgressReportSummary } from "@/types";
import NotificationBell from "@/components/NotificationBell";

// ── Colors for Charts ────────────────────────────────────────────────────────
const COLORS = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  emerald: "#10b981",
  rose: "#f43f5e",
  amber: "#f59e0b",
  slate: "#cbd5e1",
  teal: "#14b8a6",
};

// ── Page Component ───────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [report, setReport] = useState<ProgressReportSummary | null>(null);

  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Auth & Init ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !token) {
      router.replace("/login");
    }
  }, [authLoading, token, router]);

  useEffect(() => {
    if (authLoading || !token) return;
    const init = async () => {
      try {
        setLoadingChildren(true);
        const res = await childService.getAllChildren();
        if (res.success && res.data && res.data.length > 0) {
          setChildren(res.data);
          setSelectedChildId(res.data[0].id);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load children profiles.");
      } finally {
        setLoadingChildren(false);
      }
    };
    init();
  }, [authLoading, token]);

  // ── Fetch Report ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedChildId) return;
    const fetchReport = async () => {
      try {
        setLoadingReport(true);
        setError(null);
        const res = await reportService.getReportSummary(selectedChildId);
        if (res.success && res.data) {
          setReport(res.data);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load the progress report.");
        setReport(null);
      } finally {
        setLoadingReport(false);
      }
    };
    fetchReport();
  }, [selectedChildId]);

  // ── Print Handler ──────────────────────────────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  // ── Loading States ─────────────────────────────────────────────────────────
  if (authLoading || loadingChildren) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-50 overflow-hidden">
      
      {/* ── Sidebar (Hidden on Print) ─────────────────────────────────────── */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex shrink-0 print:hidden">
        <div className="flex h-16 items-center px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm">CS</div>
          <span className="ml-3 text-lg font-bold tracking-tight">Child Steper</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
            Dashboard
          </Link>
          <Link href="/dashboard/reports" aria-current="page" className="flex items-center gap-3 rounded-lg bg-indigo-50 px-3 py-2.5 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Progress Reports
          </Link>
        </nav>
      </aside>

      {/* ── Main Content Area ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        
        {/* ── Top Header (Hidden on Print) ───────────────────────────────── */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 sm:px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80 print:hidden">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight">Progress Reports</h1>
          </div>
          <div className="flex items-center gap-4">
            {children.length > 0 && (
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
            <NotificationBell />
          </div>
        </header>

        {/* ── Report Dashboard ────────────────────────────────────────────── */}
        <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 print:p-0 print:m-0 print:max-w-full">
          
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 print:hidden">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {loadingReport ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mb-4" />
              Loading report data...
            </div>
          ) : report ? (
            <>
              {/* ── Report Header ───────────────────────────────────────── */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:border-none print:shadow-none print:p-0 print:mb-8">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">
                    {report.childName}&apos;s Progress Report
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Comprehensive unified overview of growth, routines, academics, and skills.
                  </p>
                  <p className="text-xs text-slate-400 mt-2 print:block hidden">
                    Generated on {new Date().toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors print:hidden"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print / Save PDF
                </button>
              </div>

              {/* ── Grid Layout ─────────────────────────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4">
                
                {/* ── Growth Metrics Card ─────────────────────────────── */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between print:border-slate-300">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
                    <span className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </span>
                    Growth Metrics
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Total Weight Gain</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                          {report.growth.weightGain !== null ? `+${report.growth.weightGain} kg` : "N/A"}
                        </p>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        From {report.growth.startWeight ?? "-"} to {report.growth.latestWeight ?? "-"}
                      </div>
                    </div>

                    <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Total Height Gain</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                          {report.growth.heightGain !== null ? `+${report.growth.heightGain} cm` : "N/A"}
                        </p>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        From {report.growth.startHeight ?? "-"} to {report.growth.latestHeight ?? "-"}
                      </div>
                    </div>

                    <div className="pt-2">
                      <p className="text-sm font-medium text-slate-500">Current BMI</p>
                      <p className={`text-xl font-bold mt-1 ${
                        report.growth.bmi && (report.growth.bmi < 14 || report.growth.bmi > 20) 
                          ? "text-amber-500" : "text-emerald-500"
                      }`}>
                        {report.growth.bmi !== null ? report.growth.bmi : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Routine Chart (Sleep/Activity) ──────────────────── */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:border-slate-300">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-violet-900 dark:text-violet-100">
                      <span className="h-8 w-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      Routine & Habits (30 Days)
                    </h3>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-50">{report.routines.avgSleepOver30Days} hrs</p>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg Sleep</p>
                    </div>
                  </div>

                  <div className="h-[250px] w-full">
                    {report.routines.dailyData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={report.routines.dailyData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.slate} opacity={0.3} />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: COLORS.slate }} tickFormatter={(val) => val.split("-").slice(1).join("/")} />
                          <YAxis yAxisId="left" tick={{ fontSize: 10, fill: COLORS.slate }} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: COLORS.slate }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Line yAxisId="left" type="monotone" name="Sleep (hrs)" dataKey="sleep" stroke={COLORS.violet} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                          <Line yAxisId="right" type="monotone" name="Activity (mins)" dataKey="activity" stroke={COLORS.amber} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                        No routine data for the past 30 days.
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Academic Radar Chart ────────────────────────────── */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:border-slate-300">
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-rose-900 dark:text-rose-100">
                    <span className="h-8 w-8 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </span>
                    Academic Overview
                  </h3>
                  
                  <p className="text-sm font-medium text-slate-500 mb-4">
                    Average Score: <span className="text-rose-600 font-bold">{report.academics.avgScore ?? "N/A"}</span>
                  </p>

                  <div className="h-[220px] w-full">
                    {report.academics.subjectScores.length > 2 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={report.academics.subjectScores}>
                          <PolarGrid stroke={COLORS.slate} opacity={0.3} />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: COLORS.slate }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                          <Radar name="Score" dataKey="score" stroke={COLORS.rose} fill={COLORS.rose} fillOpacity={0.4} />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    ) : report.academics.subjectScores.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={report.academics.subjectScores} margin={{ top: 10, bottom: 0, left: -20, right: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                          <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                          <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                          <Bar dataKey="score" fill={COLORS.rose} radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                        No academic records logged.
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Vaccinations & Skills (Completion Gauges) ───────── */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:border-slate-300 grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Immunization */}
                  <div>
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-teal-900 dark:text-teal-100">
                      <span className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-teal-600 dark:text-teal-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </span>
                      Immunization Progress
                    </h3>

                    <div className="relative h-40 w-full flex items-center justify-center">
                      {report.vaccinations.totalScheduled > 0 ? (
                        <>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: "Administered", value: report.vaccinations.totalAdministered },
                                  { name: "Pending", value: report.vaccinations.totalScheduled - report.vaccinations.totalAdministered },
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={70}
                                startAngle={180}
                                endAngle={0}
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                              >
                                <Cell fill={COLORS.teal} />
                                <Cell fill={COLORS.slate} fillOpacity={0.2} />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[10px] text-center">
                            <span className="text-3xl font-black text-slate-900 dark:text-white">
                              {report.vaccinations.percentComplete}%
                            </span>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Complete</p>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-slate-400">No vaccines scheduled.</p>
                      )}
                    </div>
                    
                    <div className="text-center mt-2">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {report.vaccinations.totalAdministered} of {report.vaccinations.totalScheduled} administered
                      </p>
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
                      <span className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </span>
                      Skill Mastery
                    </h3>
                    
                    <div className="space-y-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-sm font-semibold">
                          <span className="text-emerald-600 dark:text-emerald-400">Acquired ({report.skills.totalAcquired})</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
                          <div 
                            className="bg-emerald-500 h-3 rounded-full" 
                            style={{ width: `${Math.min(100, (report.skills.totalAcquired / Math.max(1, (report.skills.totalAcquired + report.skills.totalLearning + report.skills.totalSuggested))) * 100)}%` }} 
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-sm font-semibold">
                          <span className="text-amber-600 dark:text-amber-400">Learning ({report.skills.totalLearning})</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
                          <div 
                            className="bg-amber-400 h-3 rounded-full" 
                            style={{ width: `${Math.min(100, (report.skills.totalLearning / Math.max(1, (report.skills.totalAcquired + report.skills.totalLearning + report.skills.totalSuggested))) * 100)}%` }} 
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-sm font-semibold">
                          <span className="text-indigo-600 dark:text-indigo-400">Suggested ({report.skills.totalSuggested})</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
                          <div 
                            className="bg-indigo-400 h-3 rounded-full opacity-60" 
                            style={{ width: `${Math.min(100, (report.skills.totalSuggested / Math.max(1, (report.skills.totalAcquired + report.skills.totalLearning + report.skills.totalSuggested))) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                    
                  </div>

                </div>

              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center print:hidden">
              <p className="text-slate-500">No children profiles found. Please add a child to view reports.</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

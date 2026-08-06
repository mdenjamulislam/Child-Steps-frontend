"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { childService } from "@/services/childService";
import { growthMilestoneService } from "@/services/growthMilestoneService";
import type {
  Child,
  ChildMilestoneItem,
  MilestoneCategory,
  MilestoneStatus,
} from "@/types";
import {
  Award,
  CheckCircle,
  Clock,
  Circle,
  Calendar,
  Sparkles,
  ArrowLeft,
  Filter,
  Brain,
  Activity,
  MessageSquare,
  Heart,
  Search,
  Check,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const CATEGORIES: { label: string; value: MilestoneCategory | "All"; icon: React.ElementType }[] = [
  { label: "All Areas", value: "All", icon: Sparkles },
  { label: "Cognitive", value: "Cognitive", icon: Brain },
  { label: "Motor Skills", value: "Motor Skills", icon: Activity },
  { label: "Language", value: "Language", icon: MessageSquare },
  { label: "Social-Emotional", value: "Social-Emotional", icon: Heart },
];

export default function MilestonesDashboardPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [milestones, setMilestones] = useState<ChildMilestoneItem[]>([]);

  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<MilestoneCategory | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch children list on mount
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setLoadingChildren(true);
        const res = await childService.getAllChildren();
        if (res.success && res.data && res.data.length > 0) {
          setChildren(res.data);
          setSelectedChildId(res.data[0].id);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch children.");
      } finally {
        setLoadingChildren(false);
      }
    };
    fetchChildren();
  }, []);

  // Fetch milestones checklist for selected child
  const fetchMilestones = async (childId: string) => {
    if (!childId) return;
    try {
      setLoadingMilestones(true);
      setError(null);
      const res = await growthMilestoneService.getChildMilestones(childId);
      if (res.success && res.data) {
        setMilestones(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load child milestones.");
    } finally {
      setLoadingMilestones(false);
    }
  };

  useEffect(() => {
    if (selectedChildId) {
      fetchMilestones(selectedChildId);
    }
  }, [selectedChildId]);

  const activeChild = useMemo(
    () => children.find((c) => c.id === selectedChildId),
    [children, selectedChildId]
  );

  // Update milestone status on backend
  const handleStatusChange = async (
    milestoneId: string,
    newStatus: MilestoneStatus,
    achievedDate?: string,
    notes?: string
  ) => {
    if (!selectedChildId) return;
    try {
      setUpdatingId(milestoneId);
      setError(null);

      const targetDate =
        newStatus === "achieved"
          ? achievedDate || new Date().toISOString().split("T")[0]
          : null;

      const res = await growthMilestoneService.updateChildMilestone(
        selectedChildId,
        milestoneId,
        {
          status: newStatus,
          achieved_date: targetDate,
          notes: notes,
        }
      );

      if (res.success) {
        // Update local state optimistically
        setMilestones((prev) =>
          prev.map((m) =>
            m.id === milestoneId
              ? {
                  ...m,
                  status: newStatus,
                  achieved_date: targetDate,
                  notes: notes !== undefined ? notes : m.notes,
                }
              : m
          )
        );

        const mItem = milestones.find((m) => m.id === milestoneId);
        setSuccessMsg(
          `Updated "${mItem?.title || "Milestone"}" to ${newStatus.replace("-", " ")}.`
        );
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update milestone status.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtered milestones based on category tab & search query
  const filteredMilestones = useMemo(() => {
    return milestones.filter((item) => {
      const matchesTab = activeTab === "All" || item.category === activeTab;
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesTab && matchesSearch;
    });
  }, [milestones, activeTab, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = milestones.length;
    const achieved = milestones.filter((m) => m.status === "achieved").length;
    const inProgress = milestones.filter((m) => m.status === "in-progress").length;
    const notStarted = milestones.filter((m) => m.status === "not-started").length;
    const percentage = total > 0 ? Math.round((achieved / total) * 100) : 0;
    return { total, achieved, inProgress, notStarted, percentage };
  }, [milestones]);

  const getCategoryColor = (category: MilestoneCategory) => {
    switch (category) {
      case "Cognitive":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300";
      case "Motor Skills":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300";
      case "Language":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300";
      case "Social-Emotional":
        return "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-300";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

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
              Milestone Checklist & Dashboard
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track developmental achievements across Cognitive, Motor, Language & Social skills
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
        {/* Banner with Progress Bar */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-6 sm:p-8 text-white shadow-xl">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <Award className="h-3.5 w-3.5" /> Developmental Milestones
            </div>
            <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight">
              {activeChild
                ? `${activeChild.first_name}'s Developmental Progress`
                : "Child Milestones Checklist"}
            </h2>
            <p className="mt-2 text-sm text-indigo-100 opacity-90">
              Celebrate key milestones as your child grows. Update progress dynamically and record special achievement dates.
            </p>

            {/* Overall Progress Stats */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-100 uppercase tracking-wider">
                <span>Overall Completion</span>
                <span>{stats.percentage}% Achieved ({stats.achieved} / {stats.total})</span>
              </div>
              <div className="h-3.5 w-full rounded-full bg-black/20 p-0.5 backdrop-blur-md overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-700 ease-out"
                  style={{ width: `${stats.percentage}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="rounded-2xl bg-white/15 backdrop-blur-md p-3 border border-white/20 text-center">
                  <p className="text-xl font-extrabold text-emerald-300">{stats.achieved}</p>
                  <p className="text-xs text-indigo-100 font-medium">Achieved</p>
                </div>
                <div className="rounded-2xl bg-white/15 backdrop-blur-md p-3 border border-white/20 text-center">
                  <p className="text-xl font-extrabold text-amber-300">{stats.inProgress}</p>
                  <p className="text-xs text-indigo-100 font-medium">In Progress</p>
                </div>
                <div className="rounded-2xl bg-white/15 backdrop-blur-md p-3 border border-white/20 text-center">
                  <p className="text-xl font-extrabold text-slate-300">{stats.notStarted}</p>
                  <p className="text-xs text-indigo-100 font-medium">Not Started</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
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

        {/* Filter Controls & Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeTab === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setActiveTab(cat.value as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20 dark:bg-indigo-500"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search milestones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs font-medium text-slate-800 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Milestones Cards Grid */}
        {loadingMilestones ? (
          <div className="flex h-64 items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : filteredMilestones.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
            <Award className="h-12 w-12 text-slate-300 mb-3" />
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">
              No milestones match your selection
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Try switching category tabs or clearing your search term.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMilestones.map((milestone) => {
              const isUpdating = updatingId === milestone.id;

              return (
                <div
                  key={milestone.id}
                  className={`flex flex-col justify-between rounded-3xl border p-6 bg-white shadow-sm transition hover:shadow-md dark:bg-slate-900 ${
                    milestone.status === "achieved"
                      ? "border-emerald-200 dark:border-emerald-900/50"
                      : milestone.status === "in-progress"
                      ? "border-amber-200 dark:border-amber-900/50"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div>
                    {/* Top Row: Category Badge & Target Age */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(
                          milestone.category
                        )}`}
                      >
                        {milestone.category}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Target: ~{milestone.target_age_months} months
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-50 mb-2">
                      {milestone.title}
                    </h3>

                    {/* Description */}
                    {milestone.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                        {milestone.description}
                      </p>
                    )}
                  </div>

                  {/* Dynamic Status Action Controls */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    {/* Status Button Group */}
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                      <button
                        onClick={() =>
                          handleStatusChange(
                            milestone.id,
                            "not-started",
                            milestone.achieved_date || undefined,
                            milestone.notes || undefined
                          )
                        }
                        disabled={isUpdating}
                        className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold transition ${
                          milestone.status === "not-started"
                            ? "bg-white text-slate-700 shadow-sm dark:bg-slate-700 dark:text-slate-200"
                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                        }`}
                      >
                        <Circle className="h-3 w-3" /> Not Started
                      </button>

                      <button
                        onClick={() =>
                          handleStatusChange(
                            milestone.id,
                            "in-progress",
                            milestone.achieved_date || undefined,
                            milestone.notes || undefined
                          )
                        }
                        disabled={isUpdating}
                        className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold transition ${
                          milestone.status === "in-progress"
                            ? "bg-amber-500 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                        }`}
                      >
                        <Clock className="h-3 w-3" /> In Progress
                      </button>

                      <button
                        onClick={() =>
                          handleStatusChange(
                            milestone.id,
                            "achieved",
                            milestone.achieved_date || new Date().toISOString().split("T")[0],
                            milestone.notes || undefined
                          )
                        }
                        disabled={isUpdating}
                        className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold transition ${
                          milestone.status === "achieved"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                        }`}
                      >
                        <CheckCircle className="h-3 w-3" /> Achieved
                      </button>
                    </div>

                    {/* If marked Achieved, display date picker input */}
                    {milestone.status === "achieved" && (
                      <div className="flex items-center gap-2 bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50">
                        <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                            Achievement Date
                          </label>
                          <input
                            type="date"
                            value={
                              milestone.achieved_date ||
                              new Date().toISOString().split("T")[0]
                            }
                            onChange={(e) =>
                              handleStatusChange(
                                milestone.id,
                                "achieved",
                                e.target.value,
                                milestone.notes || undefined
                              )
                            }
                            className="w-full bg-transparent text-xs font-semibold text-emerald-900 dark:text-emerald-100 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { childService } from "../../services/childService";
import type { Child } from "../../types";
import ChildFormModal from "../../components/ChildFormModal";

// --- Demo Data for Dashboard UI ---
const DEMO_ACTIVITIES = [
  { id: 1, title: "First Steps Milestone Achieved", child: "Emma", time: "2 hours ago", type: "success", color: "bg-emerald-500" },
  { id: 2, title: "Upcoming Pediatrician Visit", child: "Liam", time: "Tomorrow at 10 AM", type: "warning", color: "bg-amber-500" },
  { id: 3, title: "Added 3 new vocabulary words", child: "Emma", time: "Yesterday", type: "info", color: "bg-indigo-500" },
  { id: 4, title: "Growth Spurt Detected", child: "Liam", time: "3 days ago", type: "success", color: "bg-emerald-500" },
];

const DEMO_PROGRESS = [
  { category: "Cognitive", percentage: 85, color: "bg-indigo-500" },
  { category: "Motor Skills", percentage: 70, color: "bg-emerald-500" },
  { category: "Language", percentage: 60, color: "bg-amber-500" },
  { category: "Social", percentage: 90, color: "bg-pink-500" },
];

export default function DashboardPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const res = await childService.getAllChildren();
      if (res.success && res.data) {
        setChildren(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load children profiles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wait for AuthContext to finish rehydrating before making API calls
    if (authLoading) return;

    if (!token) {
      // No valid session — redirect to login
      router.replace("/login");
      return;
    }

    fetchChildren();
  }, [authLoading, token]);

  const handleAddChild = () => {
    setEditingChild(null);
    setIsModalOpen(true);
  };

  const handleEditChild = (child: Child) => {
    setEditingChild(child);
    setIsModalOpen(true);
  };

  const handleDeleteChild = async (id: string) => {
    if (!confirm("Are you sure you want to delete this profile?")) return;
    try {
      await childService.deleteChild(id);
      setChildren((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete child profile");
    }
  };

  const handleFormSubmit = async (data: Partial<Child>) => {
    if (editingChild) {
      const res = await childService.updateChild(editingChild.id, data);
      if (res.success && res.data) {
        setChildren((prev) =>
          prev.map((c) => (c.id === editingChild.id ? res.data! : c))
        );
      }
    } else {
      const res = await childService.createChild(data);
      if (res.success && res.data) {
        setChildren((prev) => [res.data!, ...prev]);
      }
    }
  };

  const calculateAge = (dobString: string) => {
    const dob = new Date(dobString);
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

    if (years === 0) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else if (months === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    }

    return `${years}y ${months}m`;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-50">

      {/* SIDEBAR (Desktop) */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex">
        <div className="flex h-16 items-center px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
            CS
          </div>
          <span className="ml-3 text-lg font-bold tracking-tight">Child Steper</span>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-lg bg-indigo-50 px-3 py-2.5 text-sm font-medium text-indigo-700 transition dark:bg-indigo-500/10 dark:text-indigo-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Dashboard
          </Link>
          <Link href="/dashboard/growth" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Growth Tracker
          </Link>
          <Link href="/dashboard/milestones" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Milestones
          </Link>
          <Link href="/dashboard/vaccinations" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            Vaccinations
          </Link>
          <Link href="/dashboard/daily-log" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            Daily Log
          </Link>
        </nav>

        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-700">
              <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=Parent&backgroundColor=e2e8f0`} alt="Avatar" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Parent User</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">parent@example.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">

        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Dashboard Overview</h1>
          <div className="flex items-center gap-4">
            <button className="relative rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300">
              <span className="absolute right-1 top-1 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
              </span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </button>
            <button
              onClick={handleAddChild}
              className="flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 hover:shadow"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Child
            </button>
          </div>
        </header>

        <div className="p-8">

          {/* Welcome Banner */}
          <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-white shadow-lg relative">
            <div className="relative z-10 w-full md:w-2/3">
              <h2 className="mb-2 text-3xl font-bold">Welcome back, Parent! 👋</h2>
              <p className="mb-6 text-indigo-100 opacity-90">Track your children's development, manage upcoming milestones, and celebrate every new step they take.</p>
              <div className="flex gap-4">
                <div className="rounded-xl bg-white/20 backdrop-blur-sm px-4 py-2 border border-white/10">
                  <div className="text-2xl font-bold">{children.length}</div>
                  <div className="text-xs font-medium uppercase tracking-wider text-indigo-100">Children</div>
                </div>
                <div className="rounded-xl bg-white/20 backdrop-blur-sm px-4 py-2 border border-white/10">
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-xs font-medium uppercase tracking-wider text-indigo-100">Milestones</div>
                </div>
              </div>
            </div>

            {/* Decorative background circle */}
            <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl mix-blend-overlay"></div>
            <div className="absolute -top-12 right-12 h-32 w-32 rounded-full bg-white/20 blur-2xl mix-blend-overlay"></div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

            {/* Left Column: Children Profiles & Charts */}
            <div className="lg:col-span-2 space-y-8">

              {/* Children Section */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Your Children Profiles</h3>
                  <button onClick={handleAddChild} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                    + Add New
                  </button>
                </div>

                {error && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                    {error}
                  </div>
                )}

                {children.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900/50">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
                      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-50">No profiles yet</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add a child profile to start tracking development.</p>
                  </div>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2">
                    {children.map((child, index) => {
                      const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500'];
                      const iconColor = colors[index % colors.length];

                      return (
                        <div
                          key={child.id}
                          className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-500/50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white font-bold text-lg shadow-inner ${iconColor}`}>
                                {child.first_name.charAt(0)}
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-slate-900 dark:text-slate-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {child.first_name} {child.last_name}
                                </h4>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                  {calculateAge(child.date_of_birth)} old
                                </p>
                              </div>
                            </div>

                            <div className="relative">
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEditChild(child)}
                                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteChild(child.id)}
                                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="mt-5 grid grid-cols-2 gap-2 text-sm border-t border-slate-100 pt-4 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              <span className="capitalize text-slate-600 dark:text-slate-300">{child.gender}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                              <span className="text-slate-600 dark:text-slate-300">{child.blood_group || "N/A"}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Demo Development Chart */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="mb-6 text-lg font-bold text-slate-900 dark:text-slate-50">Overall Development Tracking</h3>
                <div className="space-y-6">
                  {DEMO_PROGRESS.map((prog, idx) => (
                    <div key={idx}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{prog.category}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{prog.percentage}%</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full ${prog.color} transition-all duration-1000 ease-out`}
                          style={{ width: `${prog.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

            </div>

            {/* Right Column: Recent Activity & Reminders */}
            <div className="space-y-8 lg:col-span-1">

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Recent Activity</h3>
                  <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">View All</button>
                </div>

                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent dark:before:via-slate-800">
                  {DEMO_ACTIVITIES.map((activity, i) => (
                    <div key={activity.id} className="relative flex items-start gap-4">
                      <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm ring-4 ring-white dark:ring-slate-900 ${activity.color}`}>
                        {activity.type === 'success' && <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                        {activity.type === 'warning' && <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        {activity.type === 'info' && <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                      </div>
                      <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:bg-slate-100 dark:border-slate-800/60 dark:bg-slate-800/30 dark:hover:bg-slate-800">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{activity.title}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-medium text-indigo-600 dark:text-indigo-400">{activity.child}</span>
                          <span>•</span>
                          <span>{activity.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Quick Actions Card */}
              <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm dark:border-slate-800 dark:from-indigo-950/20 dark:to-slate-900">
                <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-50">Quick Tools</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex flex-col items-center justify-center rounded-xl bg-white p-4 shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition dark:border-slate-800 dark:bg-slate-800 dark:hover:border-indigo-500/50">
                    <span className="mb-2 text-2xl">📸</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Add Memory</span>
                  </button>
                  <button className="flex flex-col items-center justify-center rounded-xl bg-white p-4 shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition dark:border-slate-800 dark:bg-slate-800 dark:hover:border-indigo-500/50">
                    <span className="mb-2 text-2xl">⚖️</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Log Growth</span>
                  </button>
                  <button className="flex flex-col items-center justify-center rounded-xl bg-white p-4 shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition dark:border-slate-800 dark:bg-slate-800 dark:hover:border-indigo-500/50">
                    <span className="mb-2 text-2xl">🏥</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Vaccination</span>
                  </button>
                  <button className="flex flex-col items-center justify-center rounded-xl bg-white p-4 shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition dark:border-slate-800 dark:bg-slate-800 dark:hover:border-indigo-500/50">
                    <span className="mb-2 text-2xl">📊</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Export Report</span>
                  </button>
                </div>
              </section>

            </div>
          </div>
        </div>

      </main>

      <ChildFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingChild}
      />
    </div>
  );
}

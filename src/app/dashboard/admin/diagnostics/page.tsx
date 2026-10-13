"use client";
import RoleGuard from "@/components/RoleGuard";
export default function AdminDiagnosticsPage() {
  return (
    <RoleGuard allowedRoles={["super_admin","admin","manager","staff"]}>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">System Diagnostics</h1>
        <p className="text-slate-500 dark:text-slate-400">Monitor system health, API status, and error logs.</p>
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center text-slate-400">Diagnostics panel coming soon.</div>
      </div>
    </RoleGuard>
  );
}
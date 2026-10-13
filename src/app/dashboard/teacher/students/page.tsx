"use client";

import RoleGuard from "@/components/RoleGuard";

export default function TeacherStudentsPage() {
  return (
    <RoleGuard allowedRoles={["teacher"]}>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">My Students</h1>
        <p className="text-slate-500 dark:text-slate-400">View and manage your assigned students.</p>
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center text-slate-400">
          Student list coming soon.
        </div>
      </div>
    </RoleGuard>
  );
}
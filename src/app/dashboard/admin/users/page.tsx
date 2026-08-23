"use client";

import React, { useState } from "react";
import RoleGuard from "@/components/RoleGuard";

export default function AdminUsersPortal() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("admin");

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Invite sent to ${email} with role ${role}`);
    setEmail("");
  };

  return (
    <RoleGuard allowedRoles={["super_admin"]}>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Admin Creation Portal</h1>
          <p className="text-slate-500">Invite new administrators, managers, or staff members to the system.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm max-w-md">
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                placeholder="staff@childstepper.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              Send Invite
            </button>
          </form>
        </div>
      </div>
    </RoleGuard>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { childService } from "../../services/childService";
import type { Child } from "../../types";
import ChildFormModal from "../../components/ChildFormModal";

export default function DashboardPage() {
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
    fetchChildren();
  }, []);

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
    
    return `${years} yr${years !== 1 ? 's' : ''}, ${months} mo${months !== 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-zinc-500">Loading profiles...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8 dark:bg-black">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Child Profiles
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Manage and track your children's development.
            </p>
          </div>
          <button
            onClick={handleAddChild}
            className="flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Child
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {children.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white py-24 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">No profiles found</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Get started by adding a new child profile.</p>
            <button
              onClick={handleAddChild}
              className="mt-4 rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Add your first child
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => (
              <div
                key={child.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                      {child.first_name} {child.last_name}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {calculateAge(child.date_of_birth)}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {child.first_name.charAt(0)}{child.last_name.charAt(0)}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Gender</span>
                    <span className="font-medium text-zinc-900 capitalize dark:text-zinc-200">{child.gender}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Blood Group</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-200">{child.blood_group || "N/A"}</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800/50">
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                    View Progress
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditChild(child)}
                      className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                    </button>
                    <button
                      onClick={() => handleDeleteChild(child.id)}
                      className="rounded p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      title="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ChildFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingChild}
      />
    </div>
  );
}

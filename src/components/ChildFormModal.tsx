import React, { useState, useEffect } from "react";
import type { Child } from "../types";

interface ChildFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Child>) => Promise<void>;
  initialData?: Child | null;
}

export default function ChildFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: ChildFormModalProps) {
  const [formData, setFormData] = useState<{
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: "male" | "female" | "other";
    blood_group: string;
  }>({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "male",
    blood_group: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        first_name: initialData.first_name || "",
        last_name: initialData.last_name || "",
        date_of_birth: initialData.date_of_birth || "",
        gender: initialData.gender || "male",
        blood_group: initialData.blood_group || "",
      });
    } else {
      setFormData({
        first_name: "",
        last_name: "",
        date_of_birth: "",
        gender: "male",
        blood_group: "",
      });
    }
    setError("");
  }, [initialData, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation: Date of birth cannot be in the future
    if (new Date(formData.date_of_birth) > new Date()) {
      setError("Date of birth cannot be in the future");
      return;
    }

    try {
      setLoading(true);
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save child profile");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {initialData ? "Edit Child Profile" : "Add Child Profile"}
        </h2>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                required
                value={formData.first_name}
                onChange={handleChange}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                required
                value={formData.last_name}
                onChange={handleChange}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Date of Birth *
            </label>
            <input
              type="date"
              name="date_of_birth"
              required
              max={new Date().toISOString().split("T")[0]}
              value={formData.date_of_birth}
              onChange={handleChange}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Gender *
              </label>
              <select
                name="gender"
                required
                value={formData.gender}
                onChange={handleChange}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Blood Group
              </label>
              <select
                name="blood_group"
                value={formData.blood_group}
                onChange={handleChange}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
              >
                <option value="">Select...</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-full px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {loading ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import type { VaccinationRecord, MarkAdministeredPayload } from "../types";

interface VaccinationModalProps {
  isOpen: boolean;
  record: VaccinationRecord | null;
  onClose: () => void;
  onSuccess: (updated: VaccinationRecord) => void;
  onSubmit: (
    recordId: string,
    payload: MarkAdministeredPayload
  ) => Promise<VaccinationRecord>;
}

export default function VaccinationModal({
  isOpen,
  record,
  onClose,
  onSuccess,
  onSubmit,
}: VaccinationModalProps) {
  const today = new Date().toISOString().split("T")[0];

  const [administeredDate, setAdministeredDate] = useState(today);
  const [administeredBy, setAdministeredBy] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset form whenever the modal opens for a new record
  useEffect(() => {
    if (isOpen && record) {
      setAdministeredDate(today);
      setAdministeredBy(record.administered_by ?? "");
      setNotes(record.notes ?? "");
      setError("");
    }
  }, [isOpen, record]);

  if (!isOpen || !record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!administeredBy.trim()) {
      setError("Please enter who administered the vaccine.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const updated = await onSubmit(record.id, {
        administered_date: administeredDate,
        administered_by: administeredBy.trim(),
        notes: notes.trim() || undefined,
      });
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update vaccination record.");
    } finally {
      setLoading(false);
    }
  };

  const vaccineName = record.vaccine?.name ?? "Vaccine";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">💉</span>
                <span className="text-xs font-semibold uppercase tracking-widest text-emerald-100">
                  Mark as Administered
                </span>
              </div>
              <h2 className="text-xl font-bold text-white leading-tight">
                {vaccineName}
              </h2>
              {record.vaccine?.description && (
                <p className="mt-1 text-sm text-emerald-100 opacity-90 line-clamp-2">
                  {record.vaccine.description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 flex-shrink-0 rounded-full p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scheduled date chip */}
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Scheduled: {new Date(record.scheduled_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Date Administered */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Date Administered <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              max={today}
              value={administeredDate}
              onChange={(e) => setAdministeredDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-colors"
            />
          </div>

          {/* Administered By */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Administered By <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Doctor or clinic name"
              value={administeredBy}
              onChange={(e) => setAdministeredBy(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-colors"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Notes{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Any side effects, reactions, or additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Confirm
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

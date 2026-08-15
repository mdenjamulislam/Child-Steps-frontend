"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { VaccinationRecord, MarkAdministeredPayload } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface VaccinationModalProps {
  /** Controls visibility */
  isOpen: boolean;
  /** The vaccination record to log against (null when modal is closed) */
  record: VaccinationRecord | null;
  /** Called when the user cancels or the modal should close */
  onClose: () => void;
  /** Called with the updated record after a successful submission */
  onSuccess: (updated: VaccinationRecord) => void;
  /** The actual API call — should throw on failure */
  onSubmit: (
    recordId: string,
    payload: MarkAdministeredPayload
  ) => Promise<VaccinationRecord>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function formatLongDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ageLabel(months: number): string {
  if (months === 0) return "at birth";
  if (months < 12) return `at ${months} month${months !== 1 ? "s" : ""}`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m === 0
    ? `at ${y} year${y !== 1 ? "s" : ""}`
    : `at ${y}y ${m}m`;
}

// ─────────────────────────────────────────────────────────────────────────────
// VaccinationModal
// ─────────────────────────────────────────────────────────────────────────────

export default function VaccinationModal({
  isOpen,
  record,
  onClose,
  onSuccess,
  onSubmit,
}: VaccinationModalProps) {
  const today = todayISO();

  const [administeredDate, setAdministeredDate] = useState(today);
  const [administeredBy, setAdministeredBy] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Reset form whenever a new record is opened ──────────────────────────────
  useEffect(() => {
    if (isOpen && record) {
      setAdministeredDate(today);
      setAdministeredBy(record.administered_by ?? "");
      setNotes(record.notes ?? "");
      setError("");
      setLoading(false);
    }
  }, [isOpen, record, today]);

  // ── Close on Escape key ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // ── Backdrop click handler ──────────────────────────────────────────────────
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  if (!isOpen || !record) return null;

  const vaccineName = record.vaccine?.name ?? "Vaccine";
  const vaccineDesc = record.vaccine?.description;
  const ageStr = record.vaccine
    ? ageLabel(record.vaccine.recommended_age_months)
    : null;

  // ── Form submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!administeredBy.trim()) {
      setError("Please enter the name of the doctor or clinic that administered the vaccine.");
      return;
    }

    if (!administeredDate) {
      setError("Please select the date the vaccine was administered.");
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
      setError(
        err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    /* ── Backdrop ──────────────────────────────────────────────────────────── */
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vacc-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm p-4 transition-all"
      onClick={handleBackdropClick}
    >
      {/* ── Panel ──────────────────────────────────────────────────────────── */}
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

        {/* ── Header gradient ─────────────────────────────────────────────── */}
        <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 px-6 py-5 overflow-hidden">

          {/* Decorative blobs */}
          <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-4 right-16 h-16 w-16 rounded-full bg-white/15 blur-xl" />

          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl" aria-hidden="true">💉</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-100">
                    Log Administration
                  </span>
                </div>
                <h2
                  id="vacc-modal-title"
                  className="text-xl font-bold text-white leading-tight"
                >
                  {vaccineName}
                </h2>
                {vaccineDesc && (
                  <p className="mt-1 text-sm text-emerald-100/90 line-clamp-2">
                    {vaccineDesc}
                  </p>
                )}
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="ml-4 flex-shrink-0 rounded-full p-1.5 text-white/70 hover:text-white hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Meta chips */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Scheduled: {formatLongDate(record.scheduled_date)}
              </span>
              {ageStr && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Recommended {ageStr}
                </span>
              )}
              {record.vaccine?.doses_required && record.vaccine.doses_required > 1 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  {record.vaccine.doses_required} doses required
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Form body ───────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5" noValidate>

          {/* Error banner */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3.5"
            >
              <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Date Administered */}
          <div>
            <label
              htmlFor="vacc-date"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Date Administered
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                id="vacc-date"
                type="date"
                required
                max={today}
                value={administeredDate}
                onChange={(e) => setAdministeredDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Administered By */}
          <div>
            <label
              htmlFor="vacc-by"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Administered By
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                id="vacc-by"
                type="text"
                required
                placeholder="e.g. Dr. Smith or City Health Clinic"
                value={administeredBy}
                onChange={(e) => setAdministeredBy(e.target.value)}
                maxLength={200}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-colors"
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Name of the doctor, nurse, or clinic that administered the vaccine.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="vacc-notes"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Notes
              <span className="ml-1.5 text-xs font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="vacc-notes"
              rows={3}
              placeholder="Any side effects, reactions, next appointment details, or additional observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-colors resize-none"
            />
            {notes.length > 0 && (
              <p className="mt-1 text-xs text-slate-400 text-right">
                {notes.length} / 1000
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              id="vacc-modal-submit"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-200 dark:shadow-emerald-900/30 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Confirm Administration
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

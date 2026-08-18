"use client";

import React, { useState } from "react";
import { educationService } from "@/services/educationService";
import type {
  Child,
  EducationalRecord,
  AddEducationRecordPayload,
} from "@/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const ACADEMIC_YEAR_OPTIONS: string[] = (() => {
  const years: string[] = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear + 1; y >= currentYear - 6; y--) {
    years.push(`${y}-${y + 1}`);
  }
  return years;
})();

const GRADE_LEVEL_OPTIONS = [
  "Pre-K",
  "Kindergarten",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
];

const SUBJECT_OPTIONS = [
  "Mathematics",
  "Science",
  "English / Literature",
  "Social Studies / History",
  "Arts",
  "Physical Education",
  "Music",
  "Computer Science",
  "Foreign Language",
  "Religious Studies",
  "Other",
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormState {
  academic_year: string;
  grade_level: string;
  subject: string;
  subject_custom: string;
  score_or_grade: string;
  teacher_feedback: string;
}

interface FormErrors {
  academic_year?: string;
  grade_level?: string;
  subject?: string;
  score_or_grade?: string;
}

interface AddEducationRecordFormProps {
  /** The child for whom we are adding a record */
  child: Child;
  /** Called after a record is successfully saved */
  onSuccess: (record: EducationalRecord) => void;
  /** Called when the user dismisses the form/modal */
  onCancel: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.academic_year) {
    errors.academic_year = "Please select an academic year.";
  }
  if (!form.grade_level) {
    errors.grade_level = "Please select a grade level.";
  }

  const finalSubject =
    form.subject === "Other" ? form.subject_custom.trim() : form.subject;
  if (!finalSubject) {
    errors.subject =
      form.subject === "Other"
        ? "Please enter the subject name."
        : "Please select a subject.";
  }

  if (!form.score_or_grade.trim()) {
    errors.score_or_grade = "Please enter a score or grade.";
  }

  return errors;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddEducationRecordForm({
  child,
  onSuccess,
  onCancel,
}: AddEducationRecordFormProps) {
  const [form, setForm] = useState<FormState>({
    academic_year: "",
    grade_level: "",
    subject: "",
    subject_custom: "",
    score_or_grade: "",
    teacher_feedback: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Field Change Handlers ─────────────────────────────────────────────────

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field-level error on change
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const finalSubject =
      form.subject === "Other" ? form.subject_custom.trim() : form.subject;

    const payload: AddEducationRecordPayload = {
      child_id: child.id,
      academic_year: form.academic_year,
      grade_level: form.grade_level,
      subject: finalSubject,
      score_or_grade: form.score_or_grade.trim(),
      teacher_feedback: form.teacher_feedback.trim() || undefined,
    };

    try {
      setLoading(true);
      const res = await educationService.addRecord(payload);

      if (res.success && res.data) {
        setSuccessMsg("Academic record saved successfully! 🎉");
        // Reset form
        setForm({
          academic_year: "",
          grade_level: "",
          subject: "",
          subject_custom: "",
          score_or_grade: "",
          teacher_feedback: "",
        });
        setErrors({});
        setTimeout(() => {
          setSuccessMsg(null);
          onSuccess(res.data!);
        }, 1200);
      } else {
        setErrorMsg(res.error || "Failed to save record. Please try again.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Add Academic Record
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Recording for{" "}
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            {child.first_name} {child.last_name}
          </span>
        </p>
      </div>

      {/* Success notification */}
      {successMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300 animate-fade-in">
          <span className="text-base">✅</span>
          {successMsg}
        </div>
      )}

      {/* Error notification */}
      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300 animate-fade-in">
          <span className="text-base">⚠️</span>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Row: Academic Year + Grade Level */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Academic Year */}
          <div>
            <label
              htmlFor="edu-academic_year"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Academic Year <span className="text-red-500">*</span>
            </label>
            <select
              id="edu-academic_year"
              name="academic_year"
              value={form.academic_year}
              onChange={handleChange}
              disabled={loading}
              className={`w-full rounded-xl border px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors
                disabled:opacity-60 disabled:cursor-not-allowed
                ${
                  errors.academic_year
                    ? "border-red-400 focus:ring-red-400"
                    : "border-gray-300 dark:border-gray-600"
                }`}
            >
              <option value="">Select year…</option>
              {ACADEMIC_YEAR_OPTIONS.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
            {errors.academic_year && (
              <p className="mt-1 text-xs text-red-500">{errors.academic_year}</p>
            )}
          </div>

          {/* Grade Level */}
          <div>
            <label
              htmlFor="edu-grade_level"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Grade Level <span className="text-red-500">*</span>
            </label>
            <select
              id="edu-grade_level"
              name="grade_level"
              value={form.grade_level}
              onChange={handleChange}
              disabled={loading}
              className={`w-full rounded-xl border px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors
                disabled:opacity-60 disabled:cursor-not-allowed
                ${
                  errors.grade_level
                    ? "border-red-400 focus:ring-red-400"
                    : "border-gray-300 dark:border-gray-600"
                }`}
            >
              <option value="">Select grade…</option>
              {GRADE_LEVEL_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            {errors.grade_level && (
              <p className="mt-1 text-xs text-red-500">{errors.grade_level}</p>
            )}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label
            htmlFor="edu-subject"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Subject <span className="text-red-500">*</span>
          </label>
          <select
            id="edu-subject"
            name="subject"
            value={form.subject}
            onChange={handleChange}
            disabled={loading}
            className={`w-full rounded-xl border px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white
              focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors
              disabled:opacity-60 disabled:cursor-not-allowed
              ${
                errors.subject
                  ? "border-red-400 focus:ring-red-400"
                  : "border-gray-300 dark:border-gray-600"
              }`}
          >
            <option value="">Choose subject…</option>
            {SUBJECT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {/* Custom subject input when "Other" is selected */}
          {form.subject === "Other" && (
            <input
              id="edu-subject_custom"
              name="subject_custom"
              type="text"
              placeholder="Enter subject name"
              value={form.subject_custom}
              onChange={handleChange}
              disabled={loading}
              maxLength={100}
              className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors
                disabled:opacity-60 disabled:cursor-not-allowed
                ${
                  errors.subject
                    ? "border-red-400 focus:ring-red-400"
                    : "border-gray-300 dark:border-gray-600"
                }`}
            />
          )}
          {errors.subject && (
            <p className="mt-1 text-xs text-red-500">{errors.subject}</p>
          )}
        </div>

        {/* Score or Grade */}
        <div>
          <label
            htmlFor="edu-score_or_grade"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Score or Grade <span className="text-red-500">*</span>
          </label>
          <input
            id="edu-score_or_grade"
            name="score_or_grade"
            type="text"
            placeholder="e.g. 92%, A+, B, 78/100"
            value={form.score_or_grade}
            onChange={handleChange}
            disabled={loading}
            maxLength={20}
            className={`w-full rounded-xl border px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white
              placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors
              disabled:opacity-60 disabled:cursor-not-allowed
              ${
                errors.score_or_grade
                  ? "border-red-400 focus:ring-red-400"
                  : "border-gray-300 dark:border-gray-600"
              }`}
          />
          {errors.score_or_grade && (
            <p className="mt-1 text-xs text-red-500">{errors.score_or_grade}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            Supports percentages (85%), letter grades (A), or numeric (78/100)
          </p>
        </div>

        {/* Teacher Feedback */}
        <div>
          <label
            htmlFor="edu-teacher_feedback"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Teacher Feedback / Comments{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="edu-teacher_feedback"
            name="teacher_feedback"
            rows={4}
            placeholder="E.g. Shows excellent problem-solving skills. Could improve attention during group activities…"
            value={form.teacher_feedback}
            onChange={handleChange}
            disabled={loading}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-3 py-2.5 text-sm
              bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors resize-none
              disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 sm:flex-none rounded-xl border border-gray-300 dark:border-gray-600 px-6 py-2.5 text-sm font-medium
              text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
              transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold
              bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white
              transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving…
              </>
            ) : (
              <>
                <span>📚</span>
                Save Record
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

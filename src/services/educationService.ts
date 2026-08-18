// ── Education Service ─────────────────────────────────────────────────────────
// Typed service layer for all educational-record API calls.
// All methods return ApiResponse<T> — the caller handles error UI.

import { apiClient } from "../lib/apiClient";
import type {
  EducationalRecord,
  AddEducationRecordPayload,
  UpdateEducationRecordPayload,
  ApiResponse,
} from "../types";

export const educationService = {
  /**
   * Creates a new academic/educational record for a child.
   * Requires: child_id, academic_year, grade_level, subject, score_or_grade.
   * Optional: teacher_feedback.
   * The logged_by field is automatically set server-side to the authenticated user.
   */
  addRecord: (payload: AddEducationRecordPayload) =>
    apiClient.post<ApiResponse<EducationalRecord>>("/education", payload),

  /**
   * Retrieves all educational records for a specific child.
   * Records are sorted by academic_year DESC, then created_at DESC.
   * Each record includes joined logger profile information.
   */
  getHistory: (childId: string) =>
    apiClient.get<ApiResponse<EducationalRecord[]>>(`/education/${childId}`),

  /**
   * Partially updates an existing educational record.
   * Only the supplied fields are modified; others remain unchanged.
   * Access: original logger, child's parent, or admin.
   */
  updateRecord: (recordId: string, payload: UpdateEducationRecordPayload) =>
    apiClient.put<ApiResponse<EducationalRecord>>(
      `/education/${recordId}`,
      payload
    ),

  /**
   * Permanently deletes an educational record by its ID.
   * Access: original logger, child's parent, or admin.
   */
  deleteRecord: (recordId: string) =>
    apiClient.delete<ApiResponse<null>>(`/education/${recordId}`),
};

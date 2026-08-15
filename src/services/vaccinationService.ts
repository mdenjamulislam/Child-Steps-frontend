// ── Vaccination Service ───────────────────────────────────────────────────────
// Typed service layer for all vaccination-related API calls.
// All methods return ApiResponse<T> — the caller is responsible for error handling.

import { apiClient } from "../lib/apiClient";
import type {
  VaccinationRecord,
  MarkAdministeredPayload,
  ApiResponse,
} from "../types";

export const vaccinationService = {
  /**
   * Initializes the vaccination schedule for a child by seeding records from
   * the master vaccines catalog. Each record's scheduled_date is calculated as:
   *   scheduled_date = date_of_birth + recommended_age_months
   *
   * Idempotent — safe to call multiple times. Existing records are never
   * overwritten (UNIQUE constraint on child_id + vaccine_id).
   */
  initializeSchedule: (childId: string) =>
    apiClient.post<ApiResponse<VaccinationRecord[]>>(
      `/vaccinations/initialize/${childId}`,
      {}
    ),

  /**
   * Retrieves the complete chronological vaccination timeline for a child.
   * Each record includes joined vaccine info (name, description, doses_required,
   * recommended_age_months).
   */
  getSchedule: (childId: string) =>
    apiClient.get<ApiResponse<VaccinationRecord[]>>(
      `/vaccinations/${childId}`
    ),

  /**
   * Marks a vaccination record as 'administered' (or 'skipped').
   * Sends: administered_date, administered_by (clinic/doctor), and optional notes.
   */
  markAdministered: (recordId: string, payload: MarkAdministeredPayload) =>
    apiClient.put<ApiResponse<VaccinationRecord>>(
      `/vaccinations/record/${recordId}`,
      payload
    ),

  /**
   * Resets a vaccination record back to 'scheduled' status, clearing all
   * administered_date, administered_by, and notes fields.
   * Useful for correcting an incorrectly logged vaccination.
   */
  resetRecord: (recordId: string) =>
    apiClient.delete<ApiResponse<VaccinationRecord>>(
      `/vaccinations/record/${recordId}`
    ),
};

import { apiClient } from "../lib/apiClient";
import type {
  VaccinationRecord,
  MarkAdministeredPayload,
  ApiResponse,
} from "../types";

export const vaccinationService = {
  /**
   * Initializes the vaccination schedule for a child.
   * Fetches all vaccines from the catalog and creates vaccination_records.
   * Idempotent — safe to call multiple times (duplicates are ignored).
   */
  initializeSchedule: (childId: string) =>
    apiClient.post<ApiResponse<VaccinationRecord[]>>(
      `/vaccinations/initialize/${childId}`,
      {}
    ),

  /**
   * Retrieves the complete chronological vaccination timeline for a child.
   * Each record includes joined vaccine info (name, description, etc.).
   */
  getSchedule: (childId: string) =>
    apiClient.get<ApiResponse<VaccinationRecord[]>>(
      `/vaccinations/${childId}`
    ),

  /**
   * Marks a vaccination record as administered.
   * Sends administered_date, administered_by, and optional notes.
   */
  markAdministered: (recordId: string, payload: MarkAdministeredPayload) =>
    apiClient.put<ApiResponse<VaccinationRecord>>(
      `/vaccinations/record/${recordId}`,
      payload
    ),
};

import { apiClient } from "@/lib/apiClient";
import type { ApiResponse, ProgressReportSummary } from "@/types";

export const reportService = {
  /**
   * GET /api/reports/summary/:childId
   * Retrieves the complete synthesized progress report for a child.
   */
  async getReportSummary(childId: string): Promise<ApiResponse<ProgressReportSummary>> {
    return apiClient.get<ApiResponse<ProgressReportSummary>>(`/reports/summary/${childId}`);
  },
};

import type { ApiResponse, CareerGuidanceRecord } from "../types";
import { apiClient } from "../lib/apiClient";

// -- Career Development Service (Module 11) -----------------------------------

export const careerService = {
  /**
   * POST /api/career/generate/:childId
   * Triggers the AI career roadmap generation for the specified child.
   * Only the authenticated parent who owns the child can call this.
   */
  async generateCareerRoadmap(
    childId: string
  ): Promise<ApiResponse<CareerGuidanceRecord>> {
    return apiClient.post<ApiResponse<CareerGuidanceRecord>>(
      `/career/generate/${childId}`,
      {}
    );
  },

  /**
   * GET /api/career/:childId
   * Retrieves the saved career guidance history logs for a specific child,
   * ordered by most recently generated first.
   */
  async getCareerHistory(
    childId: string
  ): Promise<ApiResponse<CareerGuidanceRecord[]>> {
    return apiClient.get<ApiResponse<CareerGuidanceRecord[]>>(
      `/career/${childId}`
    );
  },
};

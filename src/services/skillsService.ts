import { apiClient } from "@/lib/apiClient";
import type {
  ApiResponse,
  ChildSkill,
  GetSkillsResponse,
  SkillStatus,
} from "@/types";

// ── Skills Service ────────────────────────────────────────────────────────────

export const skillsService = {
  /**
   * POST /api/skills/generate/:childId
   * Triggers the OpenRouter AI to generate 3 personalised skill suggestions
   * for the given child and saves them to the database.
   */
  async generateSuggestions(
    childId: string
  ): Promise<ApiResponse<ChildSkill[]>> {
    return apiClient.post<ApiResponse<ChildSkill[]>>(
      `/skills/generate/${childId}`,
      {}
    );
  },

  /**
   * GET /api/skills/:childId
   * Returns all skill records for a child, with a `grouped` breakdown by status.
   */
  async getSkills(childId: string): Promise<GetSkillsResponse> {
    return apiClient.get<GetSkillsResponse>(`/skills/${childId}`);
  },

  /**
   * PUT /api/skills/:skillId/status
   * Transitions a skill's status: suggested → learning → acquired.
   */
  async updateStatus(
    skillId: string,
    status: SkillStatus
  ): Promise<ApiResponse<ChildSkill>> {
    return apiClient.put<ApiResponse<ChildSkill>>(
      `/skills/${skillId}/status`,
      { status }
    );
  },
};

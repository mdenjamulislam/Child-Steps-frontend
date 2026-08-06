import { apiClient } from "../lib/apiClient";
import type {
  GrowthRecord,
  Milestone,
  ChildMilestoneItem,
  MilestoneStatus,
  ApiResponse,
} from "../types";

export interface AddGrowthPayload {
  child_id: string;
  weight_kg: number;
  height_cm: number;
  head_circumference_cm?: number | null;
  record_date?: string;
}

export interface UpdateMilestonePayload {
  status: MilestoneStatus;
  achieved_date?: string | null;
  notes?: string | null;
}

export const growthMilestoneService = {
  /**
   * Post new growth measurement record for a child.
   */
  addGrowthRecord: (payload: AddGrowthPayload) =>
    apiClient.post<ApiResponse<GrowthRecord>>("/growth", payload),

  /**
   * Get historical growth measurements for a child.
   */
  getGrowthHistory: (childId: string) =>
    apiClient.get<ApiResponse<GrowthRecord[]>>(`/growth/${childId}`),

  /**
   * Get standard master milestones catalog.
   */
  getMilestoneCatalog: (category?: string) => {
    const query = category ? `?category=${encodeURIComponent(category)}` : "";
    return apiClient.get<ApiResponse<Milestone[]>>(`/milestones/catalog${query}`);
  },

  /**
   * Get combined milestones checklist for a specific child.
   */
  getChildMilestones: (childId: string) =>
    apiClient.get<ApiResponse<ChildMilestoneItem[]>>(`/milestones/child/${childId}`),

  /**
   * Update child milestone status and completion date.
   */
  updateChildMilestone: (
    childId: string,
    milestoneId: string,
    payload: UpdateMilestonePayload
  ) =>
    apiClient.put<ApiResponse<any>>(
      `/milestones/child/${childId}/${milestoneId}`,
      payload
    ),
};

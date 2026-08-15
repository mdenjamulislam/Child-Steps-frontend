import type { ApiResponse, GuidelineResponse } from "../types";

const API_URL = "http://localhost:5000/api";

export const guidelineService = {
  /**
   * Fetch AI-generated developmental guidelines for a specific child.
   * @param childId The ID of the child
   * @param forceRefresh Optional flag to bypass the backend cache
   */
  async getGuidelines(childId: string, forceRefresh = false): Promise<ApiResponse<GuidelineResponse>> {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No authentication token found.");

    const url = new URL(`${API_URL}/guidelines/${childId}`);
    if (forceRefresh) {
      url.searchParams.append("refresh", "true");
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch guidelines.");
    }

    return data;
  },
};

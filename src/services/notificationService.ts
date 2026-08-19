import { apiClient } from "@/lib/apiClient";
import type { ApiResponse, NotificationRecord } from "@/types";

export const notificationService = {
  /**
   * GET /api/notifications
   * Retrieves all notifications for the authenticated user, ordered by read status and date.
   */
  async getNotifications(): Promise<ApiResponse<NotificationRecord[]>> {
    return apiClient.get<ApiResponse<NotificationRecord[]>>("/notifications");
  },

  /**
   * PUT /api/notifications/:id/read
   * Marks a single notification as read.
   */
  async markAsRead(id: string): Promise<ApiResponse<NotificationRecord>> {
    return apiClient.put<ApiResponse<NotificationRecord>>(`/notifications/${id}/read`, {});
  },

  /**
   * PUT /api/notifications/read-all
   * Marks all notifications for the user as read.
   */
  async markAllAsRead(): Promise<ApiResponse<void>> {
    return apiClient.put<ApiResponse<void>>("/notifications/read-all", {});
  },

  /**
   * POST /api/notifications/run-check
   * Manually triggers the background routine to check for new alerts.
   */
  async runCheck(): Promise<ApiResponse<{ generated: number }>> {
    return apiClient.post<ApiResponse<{ generated: number }>>("/notifications/run-check", {});
  },
};

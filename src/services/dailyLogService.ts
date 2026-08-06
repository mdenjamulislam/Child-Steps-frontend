import { apiClient } from "../lib/apiClient";
import type { DailyLog, ApiResponse } from "../types";

export const dailyLogService = {
  upsertLog: (data: Partial<DailyLog>) => 
    apiClient.post<ApiResponse<DailyLog>>("/daily-logs", data),

  getLogsByDateRange: (childId: string, startDate: string, endDate: string) => 
    apiClient.get<ApiResponse<DailyLog[]>>(`/daily-logs/child/${childId}?start_date=${startDate}&end_date=${endDate}`),

  getLogByDate: (childId: string, date: string) => 
    apiClient.get<ApiResponse<DailyLog>>(`/daily-logs/child/${childId}/date/${date}`),
};

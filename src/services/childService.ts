import { apiClient } from "../lib/apiClient";
import type { Child, ApiResponse } from "../types";

export const childService = {
  getAllChildren: () => apiClient.get<ApiResponse<Child[]>>("/children"),

  getChildById: (id: string) => apiClient.get<ApiResponse<Child>>(`/children/${id}`),

  createChild: (data: Partial<Child>) => apiClient.post<ApiResponse<Child>>("/children", data),

  updateChild: (id: string, data: Partial<Child>) =>
    apiClient.put<ApiResponse<Child>>(`/children/${id}`, data),

  deleteChild: (id: string) => apiClient.delete<ApiResponse<null>>(`/children/${id}`),
};

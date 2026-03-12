import apiClient from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type {
  Salesperson,
  SalespersonListParams,
  CreateSalespersonRequest,
  UpdateSalespersonRequest,
} from "@/types/salesperson";

/**
 * 営業担当者一覧を取得
 */
export async function getSalespersons(
  params?: SalespersonListParams
): Promise<ApiResponse<Salesperson[]>> {
  const searchParams = new URLSearchParams();

  if (params?.page) {
    searchParams.append("page", String(params.page));
  }
  if (params?.limit) {
    searchParams.append("limit", String(params.limit));
  }
  if (params?.role) {
    searchParams.append("role", params.role);
  }
  if (params?.managerId) {
    searchParams.append("managerId", params.managerId);
  }
  if (params?.isActive !== undefined) {
    searchParams.append("isActive", String(params.isActive));
  }
  if (params?.search) {
    searchParams.append("search", params.search);
  }

  const queryString = searchParams.toString();
  const endpoint = `/v1/salespersons${queryString ? `?${queryString}` : ""}`;

  return apiClient.get<Salesperson[]>(endpoint);
}

/**
 * 営業担当者詳細を取得
 */
export async function getSalesperson(id: string): Promise<ApiResponse<Salesperson>> {
  return apiClient.get<Salesperson>(`/v1/salespersons/${id}`);
}

/**
 * 営業担当者を作成
 */
export async function createSalesperson(
  data: CreateSalespersonRequest
): Promise<ApiResponse<Salesperson>> {
  return apiClient.post<Salesperson>("/v1/salespersons", data);
}

/**
 * 営業担当者を更新
 */
export async function updateSalesperson(
  id: string,
  data: UpdateSalespersonRequest
): Promise<ApiResponse<Salesperson>> {
  return apiClient.patch<Salesperson>(`/v1/salespersons/${id}`, data);
}

/**
 * 営業担当者を削除（論理削除）
 */
export async function deleteSalesperson(id: string): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`/v1/salespersons/${id}`);
}

/**
 * マネージャー候補一覧を取得（manager/adminロールのみ）
 */
export async function getManagerCandidates(): Promise<ApiResponse<Salesperson[]>> {
  const searchParams = new URLSearchParams();
  searchParams.append("isActive", "true");

  return apiClient.get<Salesperson[]>(`/v1/salespersons?${searchParams.toString()}`);
}

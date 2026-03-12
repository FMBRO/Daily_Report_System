/**
 * 顧客関連APIサービス
 */

import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type { Customer, CustomerListParams } from "@/types/customer";

/**
 * 顧客一覧を取得
 */
export async function getCustomers(
  params?: CustomerListParams
): Promise<ApiResponse<Customer[]>> {
  const queryParams = new URLSearchParams();

  if (params?.page) {
    queryParams.append("page", String(params.page));
  }
  if (params?.limit) {
    queryParams.append("limit", String(params.limit));
  }
  if (params?.isActive !== undefined) {
    queryParams.append("isActive", String(params.isActive));
  }
  if (params?.search) {
    queryParams.append("search", params.search);
  }

  const queryString = queryParams.toString();
  const endpoint = `/v1/customers${queryString ? `?${queryString}` : ""}`;

  return apiClient.get<Customer[]>(endpoint);
}

/**
 * 顧客詳細を取得
 */
export async function getCustomer(id: string): Promise<ApiResponse<Customer>> {
  return apiClient.get<Customer>(`/v1/customers/${id}`);
}

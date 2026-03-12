import apiClient from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type {
  Customer,
  CustomerListParams,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from "@/types/customer";

/**
 * 顧客一覧を取得
 */
export async function getCustomers(
  params?: CustomerListParams
): Promise<ApiResponse<Customer[]>> {
  const searchParams = new URLSearchParams();

  if (params?.page) {
    searchParams.append("page", params.page.toString());
  }
  if (params?.limit) {
    searchParams.append("limit", params.limit.toString());
  }
  if (params?.isActive !== undefined) {
    searchParams.append("isActive", params.isActive.toString());
  }
  if (params?.search) {
    searchParams.append("search", params.search);
  }

  const queryString = searchParams.toString();
  const endpoint = `/v1/customers${queryString ? `?${queryString}` : ""}`;

  return apiClient.get<Customer[]>(endpoint);
}

/**
 * 顧客詳細を取得
 */
export async function getCustomer(id: string): Promise<ApiResponse<Customer>> {
  return apiClient.get<Customer>(`/v1/customers/${id}`);
}

/**
 * 顧客を作成
 */
export async function createCustomer(
  data: CreateCustomerRequest
): Promise<ApiResponse<Customer>> {
  return apiClient.post<Customer>("/v1/customers", data);
}

/**
 * 顧客を更新
 */
export async function updateCustomer(
  id: string,
  data: UpdateCustomerRequest
): Promise<ApiResponse<Customer>> {
  return apiClient.patch<Customer>(`/v1/customers/${id}`, data);
}

/**
 * 顧客を削除（論理削除）
 */
export async function deleteCustomer(id: string): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`/v1/customers/${id}`);
}

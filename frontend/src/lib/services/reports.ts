/**
 * 日報関連APIサービス
 */

import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginationInfo } from "@/types/api";
import type { DailyReportSummary, ReportListParams } from "@/types/report";

export interface PaginatedReports {
  reports: DailyReportSummary[];
}

export interface ReportsResponse {
  data: DailyReportSummary[];
  pagination: PaginationInfo;
}

/**
 * 日報一覧を取得
 */
export async function getReports(
  params: ReportListParams
): Promise<ApiResponse<DailyReportSummary[]>> {
  const queryParams = new URLSearchParams();

  if (params.page) {
    queryParams.append("page", String(params.page));
  }
  if (params.limit) {
    queryParams.append("limit", String(params.limit));
  }
  if (params.status) {
    queryParams.append("status", params.status);
  }
  if (params.salespersonId) {
    queryParams.append("salespersonId", params.salespersonId);
  }
  if (params.dateFrom) {
    queryParams.append("dateFrom", params.dateFrom);
  }
  if (params.dateTo) {
    queryParams.append("dateTo", params.dateTo);
  }

  const queryString = queryParams.toString();
  const endpoint = `/v1/reports${queryString ? `?${queryString}` : ""}`;

  return apiClient.get<DailyReportSummary[]>(endpoint);
}

/**
 * 日報詳細を取得
 */
export async function getReport(id: string): Promise<ApiResponse<DailyReportSummary>> {
  return apiClient.get<DailyReportSummary>(`/v1/reports/${id}`);
}

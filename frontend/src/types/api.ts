/**
 * API共通レスポンス型
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  pagination?: PaginationInfo;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ListParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

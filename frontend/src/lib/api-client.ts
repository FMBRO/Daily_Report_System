import type { ApiResponse, ApiError } from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const TOKEN_KEY = "daily_report_tokens";

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      return null;
    }
    const tokens = JSON.parse(stored);
    return tokens?.accessToken ?? null;
  } catch {
    return null;
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { requireAuth = true, headers: customHeaders, ...restOptions } = options;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...customHeaders,
    };

    if (requireAuth) {
      const token = getAccessToken();
      if (token) {
        (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
      }
    }

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...restOptions,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        const error: ApiError = {
          success: false,
          error: {
            code: data.error?.code || "UNKNOWN_ERROR",
            message: data.error?.message || "An unknown error occurred",
            details: data.error?.details,
          },
        };

        if (response.status === 401) {
          // Unauthorized - clear tokens and redirect to login
          if (typeof window !== "undefined") {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem("daily_report_user");
            window.location.href = "/login";
          }
        }

        throw error;
      }

      return data as ApiResponse<T>;
    } catch (error) {
      if ((error as ApiError).error) {
        throw error;
      }

      const apiError: ApiError = {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: "ネットワークエラーが発生しました。接続を確認してください。",
        },
      };
      throw apiError;
    }
  }

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "GET",
    });
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(
    endpoint: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "DELETE",
    });
  }
}

export const apiClient = new ApiClient();

export default apiClient;

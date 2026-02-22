import type { NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import type { Observable } from "rxjs";
import { map } from "rxjs/operators";
import type { ApiSuccessResponse, PaginationDto } from "../dto/api-response.dto";

/**
 * ページネーション付きデータのインターフェース
 */
export interface PaginatedData<T> {
  data: T[];
  pagination: PaginationDto;
}

/**
 * レスポンス変換インターセプター
 * すべての成功レスポンスを共通形式に変換する
 */
@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // すでに共通形式の場合はそのまま返す
        if (data && typeof data === "object" && "success" in data) {
          return data;
        }

        // ページネーション付きデータの場合
        if (this.isPaginatedData(data)) {
          return {
            success: true as const,
            data: data.data,
            pagination: data.pagination,
          };
        }

        // 通常のデータの場合
        return {
          success: true as const,
          data,
        };
      })
    );
  }

  /**
   * ページネーション付きデータかどうかを判定
   */
  private isPaginatedData(data: unknown): data is PaginatedData<unknown> {
    return (
      data !== null &&
      typeof data === "object" &&
      "data" in data &&
      "pagination" in data &&
      Array.isArray((data as PaginatedData<unknown>).data)
    );
  }
}

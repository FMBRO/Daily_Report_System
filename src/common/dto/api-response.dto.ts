import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * ページネーション情報
 */
export class PaginationDto {
  @ApiProperty({ description: "現在のページ番号", example: 1 })
  current_page!: number;

  @ApiProperty({ description: "1ページあたりの件数", example: 20 })
  per_page!: number;

  @ApiProperty({ description: "総ページ数", example: 5 })
  total_pages!: number;

  @ApiProperty({ description: "総件数", example: 100 })
  total_count!: number;
}

/**
 * エラー詳細
 */
export class ErrorDetailDto {
  @ApiProperty({ description: "エラーコード", example: "VALIDATION_ERROR" })
  code!: string;

  @ApiProperty({
    description: "エラーメッセージ",
    example: "入力内容に誤りがあります",
  })
  message!: string;

  @ApiPropertyOptional({
    description: "フィールド別エラー詳細",
    example: { email: ["メールアドレスは必須です"] },
  })
  details?: Record<string, string[]>;
}

/**
 * 成功レスポンス（インターフェース）
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  pagination?: PaginationDto;
}

/**
 * エラーレスポンス（インターフェース）
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

/**
 * 成功レスポンスを生成するヘルパー関数
 */
export function createSuccessResponse<T>(
  data: T,
  pagination?: PaginationDto
): ApiSuccessResponse<T> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return response;
}

/**
 * エラーレスポンスを生成するヘルパー関数
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: Record<string, string[]>
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
}

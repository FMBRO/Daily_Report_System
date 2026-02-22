import type { ExceptionFilter, ArgumentsHost } from "@nestjs/common";
import { Catch, HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { Response } from "express";
import { createErrorResponse } from "../dto/api-response.dto";

/**
 * エラーコードマッピング
 */
const ERROR_CODE_MAP: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: "BAD_REQUEST",
  [HttpStatus.UNAUTHORIZED]: "UNAUTHORIZED",
  [HttpStatus.FORBIDDEN]: "FORBIDDEN",
  [HttpStatus.NOT_FOUND]: "NOT_FOUND",
  [HttpStatus.UNPROCESSABLE_ENTITY]: "VALIDATION_ERROR",
  [HttpStatus.INTERNAL_SERVER_ERROR]: "INTERNAL_ERROR",
};

/**
 * グローバルHTTP例外フィルター
 * すべてのHTTP例外を共通レスポンス形式に変換する
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "サーバー内部エラーが発生しました";
    let code = "INTERNAL_ERROR";
    let details: Record<string, string[]> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === "object") {
        const responseObj = exceptionResponse as Record<string, unknown>;

        // class-validatorのエラーメッセージを処理
        if (Array.isArray(responseObj.message)) {
          message = "入力内容に誤りがあります";
          details = this.formatValidationErrors(responseObj.message as string[]);
        } else if (typeof responseObj.message === "string") {
          message = responseObj.message;
        }

        // カスタムエラーコードがあれば使用
        if (typeof responseObj.code === "string") {
          code = responseObj.code;
        }
      }

      // デフォルトのエラーコードを設定
      if (code === "INTERNAL_ERROR" && ERROR_CODE_MAP[status]) {
        code = ERROR_CODE_MAP[status];
      }
    } else {
      // 予期しないエラーをログに記録
      this.logger.error("Unexpected error:", exception);
    }

    const errorResponse = createErrorResponse(code, message, details);
    response.status(status).json(errorResponse);
  }

  /**
   * class-validatorのエラーメッセージをフィールド別に整形
   */
  private formatValidationErrors(messages: string[]): Record<string, string[]> {
    const details: Record<string, string[]> = {};

    for (const message of messages) {
      // メッセージからフィールド名を抽出する（簡易実装）
      // 例: "email must be an email" -> field: "email"
      const parts = message.split(" ");
      const field = parts[0] || "unknown";

      if (!details[field]) {
        details[field] = [];
      }
      details[field].push(message);
    }

    return details;
  }
}

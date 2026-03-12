/**
 * コメント関連APIサービス
 */

import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type { Comment, CommentTargetType, CreateCommentRequest } from "@/types/report";

export interface CreateCommentData {
  targetType: CommentTargetType;
  targetId: string;
  content: string;
}

/**
 * コメント一覧を取得
 */
export async function getComments(
  targetType: CommentTargetType,
  targetId: string
): Promise<ApiResponse<Comment[]>> {
  const basePath = targetType === "problem" ? "problems" : "plans";
  return apiClient.get<Comment[]>(`/v1/${basePath}/${targetId}/comments`);
}

/**
 * コメントを投稿
 */
export async function createComment(
  data: CreateCommentData
): Promise<ApiResponse<Comment>> {
  const { targetType, targetId, content } = data;
  const basePath = targetType === "problem" ? "problems" : "plans";
  const requestBody: CreateCommentRequest = { content };
  return apiClient.post<Comment>(`/v1/${basePath}/${targetId}/comments`, requestBody);
}

/**
 * コメントを削除
 */
export async function deleteComment(commentId: string): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`/v1/comments/${commentId}`);
}

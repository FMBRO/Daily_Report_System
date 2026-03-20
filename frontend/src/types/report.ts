/**
 * 日報関連型
 */

import type { SalespersonSummary } from "./salesperson";
import type { CustomerSummary } from "./customer";

export type ReportStatus = "draft" | "submitted";
export type ProblemPriority = "low" | "medium" | "high";
export type CommentTargetType = "problem" | "plan";

export interface DailyReport {
  id: string;
  salespersonId: string;
  salesperson?: SalespersonSummary;
  reportDate: string;
  status: ReportStatus;
  visits?: Visit[];
  problems?: Problem[];
  plans?: Plan[];
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyReportSummary {
  id: string;
  reportDate: string;
  status: ReportStatus;
  salesperson?: SalespersonSummary;
  visitCount: number;
  problemCount: number;
  planCount: number;
}

export interface Visit {
  id: string;
  reportId: string;
  customerId: string;
  customer?: CustomerSummary;
  visitTime: string;
  purpose: string;
  content: string;
  result?: string;
  nextAction?: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface Problem {
  id: string;
  reportId: string;
  content: string;
  priority: ProblemPriority;
  orderIndex: number;
  comments?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  reportId: string;
  content: string;
  targetDate?: string;
  orderIndex: number;
  comments?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  targetType: CommentTargetType;
  targetId: string;
  authorId: string;
  author?: SalespersonSummary;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportListParams {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  salespersonId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateReportRequest {
  reportDate: string;
}

export interface UpdateReportRequest {
  status?: ReportStatus;
}

export interface CreateVisitRequest {
  customerId: string;
  visitTime: string;
  purpose: string;
  content: string;
  result?: string;
  nextAction?: string;
}

export interface UpdateVisitRequest {
  customerId?: string;
  visitTime?: string;
  purpose?: string;
  content?: string;
  result?: string;
  nextAction?: string;
}

export interface CreateProblemRequest {
  content: string;
  priority: ProblemPriority;
}

export interface UpdateProblemRequest {
  content?: string;
  priority?: ProblemPriority;
}

export interface CreatePlanRequest {
  content: string;
  targetDate?: string;
}

export interface UpdatePlanRequest {
  content?: string;
  targetDate?: string;
}

export interface CreateCommentRequest {
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

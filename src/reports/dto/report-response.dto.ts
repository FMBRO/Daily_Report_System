import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { ReportStatus, Priority } from "@prisma/client";
import { PaginationDto } from "../../common/dto";

/**
 * 営業担当者シンプルDTO
 */
export class SalespersonSimpleDto {
  @ApiProperty({ description: "営業ID", example: 1 })
  salesperson_id!: number;

  @ApiProperty({ description: "氏名", example: "田中 太郎" })
  name!: string;
}

/**
 * 営業担当者詳細DTO（メール含む）
 */
export class SalespersonWithEmailDto extends SalespersonSimpleDto {
  @ApiProperty({ description: "メールアドレス", example: "tanaka@example.com" })
  email!: string;
}

/**
 * 顧客シンプルDTO
 */
export class CustomerSimpleDto {
  @ApiProperty({ description: "顧客ID", example: 1 })
  customer_id!: number;

  @ApiProperty({ description: "顧客名", example: "株式会社ABC" })
  customer_name!: string;
}

/**
 * 訪問DTO（詳細用）
 */
export class VisitDetailDto {
  @ApiProperty({ description: "訪問ID", example: 1 })
  visit_id!: number;

  @ApiProperty({ description: "顧客情報", type: CustomerSimpleDto })
  customer!: CustomerSimpleDto;

  @ApiPropertyOptional({ description: "訪問時刻", example: "10:00" })
  visit_time?: string | null;

  @ApiPropertyOptional({ description: "訪問目的", example: "定期訪問" })
  visit_purpose?: string | null;

  @ApiProperty({ description: "訪問内容", example: "新製品の提案を行った。" })
  visit_content!: string;

  @ApiPropertyOptional({ description: "結果", example: "次回見積提出予定" })
  result?: string | null;
}

/**
 * コメントDTO
 */
export class CommentDto {
  @ApiProperty({ description: "コメントID", example: 1 })
  comment_id!: number;

  @ApiProperty({ description: "コメント投稿者", type: SalespersonSimpleDto })
  commenter!: SalespersonSimpleDto;

  @ApiProperty({ description: "コメント内容", example: "来週のミーティングで対策を検討しましょう" })
  content!: string;

  @ApiProperty({ description: "作成日時", example: "2026-02-15T19:00:00+09:00" })
  created_at!: string;
}

/**
 * ProblemDTO（詳細用）
 */
export class ProblemDetailDto {
  @ApiProperty({ description: "Problem ID", example: 1 })
  problem_id!: number;

  @ApiProperty({ description: "課題・相談内容", example: "競合他社が価格攻勢をかけてきている" })
  content!: string;

  @ApiProperty({ description: "優先度", enum: ["high", "medium", "low"], example: "high" })
  priority!: Priority;

  @ApiProperty({ description: "コメント一覧", type: [CommentDto] })
  comments!: CommentDto[];
}

/**
 * PlanDTO（詳細用）
 */
export class PlanDetailDto {
  @ApiProperty({ description: "Plan ID", example: 1 })
  plan_id!: number;

  @ApiProperty({ description: "明日やること", example: "A社に見積書を提出する" })
  content!: string;

  @ApiProperty({ description: "コメント一覧", type: [CommentDto] })
  comments!: CommentDto[];
}

/**
 * 日報一覧アイテムDTO
 */
export class ReportListItemDto {
  @ApiProperty({ description: "日報ID", example: 1 })
  report_id!: number;

  @ApiProperty({ description: "営業担当者", type: SalespersonSimpleDto })
  salesperson!: SalespersonSimpleDto;

  @ApiProperty({ description: "報告日", example: "2026-02-15" })
  report_date!: string;

  @ApiProperty({ description: "ステータス", enum: ["draft", "submitted"], example: "submitted" })
  status!: ReportStatus;

  @ApiProperty({ description: "訪問件数", example: 3 })
  visit_count!: number;

  @ApiProperty({ description: "Problem件数", example: 1 })
  problem_count!: number;

  @ApiProperty({ description: "Plan件数", example: 2 })
  plan_count!: number;

  @ApiProperty({ description: "作成日時", example: "2026-02-15T09:00:00+09:00" })
  created_at!: string;

  @ApiProperty({ description: "更新日時", example: "2026-02-15T18:00:00+09:00" })
  updated_at!: string;
}

/**
 * 日報一覧レスポンスDTO
 */
export class ReportListResponseDto {
  @ApiProperty({ description: "成功フラグ", example: true })
  success!: boolean;

  @ApiProperty({ description: "日報一覧", type: [ReportListItemDto] })
  data!: ReportListItemDto[];

  @ApiProperty({ description: "ページネーション情報", type: PaginationDto })
  pagination!: PaginationDto;
}

/**
 * 日報詳細DTO
 */
export class ReportDetailDto {
  @ApiProperty({ description: "日報ID", example: 1 })
  report_id!: number;

  @ApiProperty({ description: "営業担当者", type: SalespersonWithEmailDto })
  salesperson!: SalespersonWithEmailDto;

  @ApiProperty({ description: "報告日", example: "2026-02-15" })
  report_date!: string;

  @ApiProperty({ description: "ステータス", enum: ["draft", "submitted"], example: "submitted" })
  status!: ReportStatus;

  @ApiProperty({ description: "訪問一覧", type: [VisitDetailDto] })
  visits!: VisitDetailDto[];

  @ApiProperty({ description: "Problem一覧", type: [ProblemDetailDto] })
  problems!: ProblemDetailDto[];

  @ApiProperty({ description: "Plan一覧", type: [PlanDetailDto] })
  plans!: PlanDetailDto[];

  @ApiProperty({ description: "作成日時", example: "2026-02-15T09:00:00+09:00" })
  created_at!: string;

  @ApiProperty({ description: "更新日時", example: "2026-02-15T18:00:00+09:00" })
  updated_at!: string;
}

/**
 * 日報詳細レスポンスDTO
 */
export class ReportDetailResponseDto {
  @ApiProperty({ description: "成功フラグ", example: true })
  success!: boolean;

  @ApiProperty({ description: "日報詳細", type: ReportDetailDto })
  data!: ReportDetailDto;
}

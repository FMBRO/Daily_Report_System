import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from "@nestjs/common";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS DI requires runtime class reference
import { PrismaService } from "../prisma";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import type {
  CreateVisitDto,
  UpdateVisitDto,
  VisitListResponseDto,
  VisitDetailResponseDto,
  VisitDeleteResponseDto,
  VisitDto,
} from "./dto";

@Injectable()
export class VisitsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 時刻文字列(HH:mm)をDateオブジェクトに変換
   */
  private parseTime(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
    return date;
  }

  /**
   * DateオブジェクトをHH:mm形式の文字列に変換
   */
  private formatTime(date: Date): string {
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  /**
   * 訪問データをDTOに変換
   */
  private toVisitDto(visit: {
    id: number;
    visitTime: Date | null;
    visitPurpose: string | null;
    visitContent: string;
    result: string | null;
    createdAt: Date;
    updatedAt: Date;
    customer: {
      id: number;
      customerName: string;
    };
  }): VisitDto {
    return {
      visit_id: visit.id,
      customer: {
        customer_id: visit.customer.id,
        customer_name: visit.customer.customerName,
      },
      visit_time: visit.visitTime ? this.formatTime(visit.visitTime) : null,
      visit_purpose: visit.visitPurpose,
      visit_content: visit.visitContent,
      result: visit.result,
      created_at: visit.createdAt.toISOString(),
      updated_at: visit.updatedAt.toISOString(),
    };
  }

  /**
   * 日報の所有権と編集可能状態をチェック
   */
  private async checkReportAccess(
    reportId: number,
    user: AuthenticatedUser,
    requireEditable: boolean = false
  ): Promise<{ salespersonId: number; status: string }> {
    const report = await this.prisma.dailyReport.findUnique({
      where: { id: reportId },
      select: {
        salespersonId: true,
        status: true,
      },
    });

    if (!report) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "日報が見つかりません",
      });
    }

    // 所有権チェック（adminは全員の日報にアクセス可能）
    if (user.role !== "admin" && report.salespersonId !== user.id) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "この日報にアクセスする権限がありません",
      });
    }

    // 編集可能状態チェック
    if (requireEditable && report.status === "submitted") {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "提出済みの日報は編集できません",
      });
    }

    return report;
  }

  /**
   * 訪問記録の所有権チェック
   */
  private async checkVisitAccess(
    visitId: number,
    user: AuthenticatedUser,
    requireEditable: boolean = false
  ): Promise<{
    id: number;
    reportId: number;
    report: { salespersonId: number; status: string };
  }> {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      select: {
        id: true,
        reportId: true,
        dailyReport: {
          select: {
            salespersonId: true,
            status: true,
          },
        },
      },
    });

    if (!visit) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "訪問記録が見つかりません",
      });
    }

    // 所有権チェック（adminは全員の日報にアクセス可能）
    if (user.role !== "admin" && visit.dailyReport.salespersonId !== user.id) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "この訪問記録にアクセスする権限がありません",
      });
    }

    // 編集可能状態チェック
    if (requireEditable && visit.dailyReport.status === "submitted") {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "提出済みの日報は編集できません",
      });
    }

    return {
      id: visit.id,
      reportId: visit.reportId,
      report: visit.dailyReport,
    };
  }

  /**
   * 顧客の存在確認
   */
  private async checkCustomerExists(customerId: number): Promise<void> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });

    if (!customer) {
      throw new UnprocessableEntityException({
        code: "VALIDATION_ERROR",
        message: "指定された顧客が存在しません",
      });
    }
  }

  /**
   * 訪問記録一覧を取得する
   */
  async findAll(reportId: number, user: AuthenticatedUser): Promise<VisitListResponseDto> {
    // 日報のアクセス権チェック
    await this.checkReportAccess(reportId, user);

    // 訪問記録を取得
    const visits = await this.prisma.visit.findMany({
      where: { reportId },
      select: {
        id: true,
        visitTime: true,
        visitPurpose: true,
        visitContent: true,
        result: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            id: true,
            customerName: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });

    return {
      success: true,
      data: visits.map((v) => this.toVisitDto(v)),
    };
  }

  /**
   * 訪問記録を作成する
   */
  async create(
    reportId: number,
    dto: CreateVisitDto,
    user: AuthenticatedUser
  ): Promise<VisitDetailResponseDto> {
    // 日報のアクセス権と編集可能状態チェック
    await this.checkReportAccess(reportId, user, true);

    // 顧客の存在確認
    await this.checkCustomerExists(dto.customer_id);

    // 訪問記録を作成
    const visit = await this.prisma.visit.create({
      data: {
        reportId,
        customerId: dto.customer_id,
        visitTime: dto.visit_time ? this.parseTime(dto.visit_time) : null,
        visitPurpose: dto.visit_purpose ?? null,
        visitContent: dto.visit_content,
        result: dto.result ?? null,
      },
      select: {
        id: true,
        visitTime: true,
        visitPurpose: true,
        visitContent: true,
        result: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            id: true,
            customerName: true,
          },
        },
      },
    });

    return {
      success: true,
      data: this.toVisitDto(visit),
    };
  }

  /**
   * 訪問記録を更新する
   */
  async update(
    visitId: number,
    dto: UpdateVisitDto,
    user: AuthenticatedUser
  ): Promise<VisitDetailResponseDto> {
    // 訪問記録のアクセス権と編集可能状態チェック
    await this.checkVisitAccess(visitId, user, true);

    // 顧客IDが指定されている場合は存在確認
    if (dto.customer_id !== undefined) {
      await this.checkCustomerExists(dto.customer_id);
    }

    // 更新データの構築
    const updateData: {
      customerId?: number;
      visitTime?: Date | null;
      visitPurpose?: string | null;
      visitContent?: string;
      result?: string | null;
    } = {};

    if (dto.customer_id !== undefined) {
      updateData.customerId = dto.customer_id;
    }
    if (dto.visit_time !== undefined) {
      updateData.visitTime = dto.visit_time ? this.parseTime(dto.visit_time) : null;
    }
    if (dto.visit_purpose !== undefined) {
      updateData.visitPurpose = dto.visit_purpose;
    }
    if (dto.visit_content !== undefined) {
      updateData.visitContent = dto.visit_content;
    }
    if (dto.result !== undefined) {
      updateData.result = dto.result;
    }

    // 訪問記録を更新
    const visit = await this.prisma.visit.update({
      where: { id: visitId },
      data: updateData,
      select: {
        id: true,
        visitTime: true,
        visitPurpose: true,
        visitContent: true,
        result: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            id: true,
            customerName: true,
          },
        },
      },
    });

    return {
      success: true,
      data: this.toVisitDto(visit),
    };
  }

  /**
   * 訪問記録を削除する
   */
  async remove(visitId: number, user: AuthenticatedUser): Promise<VisitDeleteResponseDto> {
    // 訪問記録のアクセス権と編集可能状態チェック
    await this.checkVisitAccess(visitId, user, true);

    // 訪問記録を削除
    await this.prisma.visit.delete({
      where: { id: visitId },
    });

    return {
      success: true,
      message: "訪問記録を削除しました",
    };
  }
}

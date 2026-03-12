import { Controller, Get, Param, ParseIntPipe, Query, UseGuards, Request } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
} from "@nestjs/swagger";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS DI requires runtime class reference
import { ReportsService } from "./reports.service";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS validation requires runtime class reference
import { ReportQueryDto, ReportListResponseDto, ReportDetailResponseDto } from "./dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";

@ApiTags("日報")
@Controller("reports")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * 日報一覧取得
   */
  @Get()
  @ApiOperation({
    summary: "日報一覧取得",
    description:
      "日報の一覧を取得する。salesは自分の日報のみ、managerは部下の日報も、adminは全ての日報を閲覧可能。",
  })
  @ApiResponse({
    status: 200,
    description: "取得成功",
    type: ReportListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  @ApiForbiddenResponse({
    description: "権限エラー（閲覧権限がない営業担当者の日報を指定）",
  })
  async findAll(
    @Query() query: ReportQueryDto,
    @Request() req: { user: AuthenticatedUser }
  ): Promise<ReportListResponseDto> {
    return this.reportsService.findAll(query, req.user);
  }

  /**
   * 日報詳細取得
   */
  @Get(":id")
  @ApiOperation({
    summary: "日報詳細取得",
    description:
      "指定した日報の詳細を取得する。salesは自分の日報のみ、managerは部下の日報も、adminは全ての日報を閲覧可能。",
  })
  @ApiParam({
    name: "id",
    description: "日報ID",
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "取得成功",
    type: ReportDetailResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  @ApiForbiddenResponse({
    description: "権限エラー（閲覧権限がない日報を指定）",
  })
  @ApiNotFoundResponse({
    description: "日報が見つからない",
  })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: { user: AuthenticatedUser }
  ): Promise<ReportDetailResponseDto> {
    return this.reportsService.findOne(id, req.user);
  }
}

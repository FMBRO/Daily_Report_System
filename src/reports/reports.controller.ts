import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS DI requires runtime class reference
import { ReportsService } from "./reports.service";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS validation requires runtime class reference
import {
  ReportQueryDto,
  ReportListResponseDto,
  ReportDetailResponseDto,
  UpdateReportDto,
  UpdateReportResponseDto,
  DeleteReportResponseDto,
} from "./dto";
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

  /**
   * 日報更新
   */
  @Put(":id")
  @ApiOperation({
    summary: "日報更新",
    description: "指定した日報を更新する。自分の日報のみ更新可能。提出済み日報は更新不可。",
  })
  @ApiParam({
    name: "id",
    description: "日報ID",
    type: Number,
    example: 1,
  })
  @ApiBody({ type: UpdateReportDto })
  @ApiResponse({
    status: 200,
    description: "更新成功",
    type: UpdateReportResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  @ApiForbiddenResponse({
    description: "権限エラー（他人の日報、または提出済み日報の更新）",
  })
  @ApiNotFoundResponse({
    description: "日報が見つからない",
  })
  @ApiUnprocessableEntityResponse({
    description: "バリデーションエラー（日付重複など）",
  })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateReportDto,
    @Request() req: { user: AuthenticatedUser }
  ): Promise<UpdateReportResponseDto> {
    return this.reportsService.update(id, dto, req.user);
  }

  /**
   * 日報削除
   */
  @Delete(":id")
  @ApiOperation({
    summary: "日報削除",
    description: "指定した日報を削除する。自分の日報のみ削除可能。提出済み日報は削除不可。",
  })
  @ApiParam({
    name: "id",
    description: "日報ID",
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "削除成功",
    type: DeleteReportResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  @ApiForbiddenResponse({
    description: "権限エラー（他人の日報、または提出済み日報の削除）",
  })
  @ApiNotFoundResponse({
    description: "日報が見つからない",
  })
  async remove(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: { user: AuthenticatedUser }
  ): Promise<DeleteReportResponseDto> {
    return this.reportsService.remove(id, req.user);
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiBearerAuth,
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
import { VisitsService } from "./visits.service";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS validation requires runtime class reference
import {
  CreateVisitDto,
  UpdateVisitDto,
  VisitListResponseDto,
  VisitDetailResponseDto,
  VisitDeleteResponseDto,
} from "./dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";

@ApiTags("訪問記録")
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  /**
   * 訪問記録一覧取得
   */
  @Get("reports/:reportId/visits")
  @ApiOperation({
    summary: "訪問記録一覧取得",
    description: "指定した日報の訪問記録一覧を取得する。",
  })
  @ApiParam({
    name: "reportId",
    description: "日報ID",
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "取得成功",
    type: VisitListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  @ApiForbiddenResponse({
    description: "権限エラー（他人の日報にアクセス）",
  })
  @ApiNotFoundResponse({
    description: "日報が見つからない",
  })
  async findAll(
    @Param("reportId", ParseIntPipe) reportId: number,
    @Request() req: { user: AuthenticatedUser }
  ): Promise<VisitListResponseDto> {
    return this.visitsService.findAll(reportId, req.user);
  }

  /**
   * 訪問記録登録
   */
  @Post("reports/:reportId/visits")
  @ApiOperation({
    summary: "訪問記録登録",
    description: "指定した日報に訪問記録を登録する。",
  })
  @ApiParam({
    name: "reportId",
    description: "日報ID",
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 201,
    description: "登録成功",
    type: VisitDetailResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  @ApiForbiddenResponse({
    description: "権限エラー（他人の日報への追加、または提出済み日報への追加）",
  })
  @ApiNotFoundResponse({
    description: "日報が見つからない",
  })
  @ApiUnprocessableEntityResponse({
    description: "バリデーションエラー（顧客IDが存在しない等）",
  })
  async create(
    @Param("reportId", ParseIntPipe) reportId: number,
    @Body() dto: CreateVisitDto,
    @Request() req: { user: AuthenticatedUser }
  ): Promise<VisitDetailResponseDto> {
    return this.visitsService.create(reportId, dto, req.user);
  }

  /**
   * 訪問記録更新
   */
  @Put("visits/:id")
  @ApiOperation({
    summary: "訪問記録更新",
    description: "指定した訪問記録を更新する。",
  })
  @ApiParam({
    name: "id",
    description: "訪問ID",
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "更新成功",
    type: VisitDetailResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  @ApiForbiddenResponse({
    description: "権限エラー（他人の訪問記録の更新、または提出済み日報の訪問記録の更新）",
  })
  @ApiNotFoundResponse({
    description: "訪問記録が見つからない",
  })
  @ApiUnprocessableEntityResponse({
    description: "バリデーションエラー（顧客IDが存在しない等）",
  })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateVisitDto,
    @Request() req: { user: AuthenticatedUser }
  ): Promise<VisitDetailResponseDto> {
    return this.visitsService.update(id, dto, req.user);
  }

  /**
   * 訪問記録削除
   */
  @Delete("visits/:id")
  @ApiOperation({
    summary: "訪問記録削除",
    description: "指定した訪問記録を削除する。",
  })
  @ApiParam({
    name: "id",
    description: "訪問ID",
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "削除成功",
    type: VisitDeleteResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  @ApiForbiddenResponse({
    description: "権限エラー（他人の訪問記録の削除、または提出済み日報の訪問記録の削除）",
  })
  @ApiNotFoundResponse({
    description: "訪問記録が見つからない",
  })
  async remove(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: { user: AuthenticatedUser }
  ): Promise<VisitDeleteResponseDto> {
    return this.visitsService.remove(id, req.user);
  }
}

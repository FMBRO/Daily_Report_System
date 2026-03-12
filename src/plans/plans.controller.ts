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
import { PlansService } from "./plans.service";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS validation requires runtime class reference
import {
  CreatePlanDto,
  UpdatePlanDto,
  PlanListResponseDto,
  PlanDetailResponseDto,
  PlanDeleteResponseDto,
} from "./dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";

@ApiTags("計画")
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  /**
   * Plan一覧取得
   */
  @Get("reports/:reportId/plans")
  @ApiOperation({
    summary: "計画一覧取得",
    description: "指定した日報の計画一覧を取得する。",
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
    type: PlanListResponseDto,
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
  ): Promise<PlanListResponseDto> {
    return this.plansService.findAll(reportId, req.user);
  }

  /**
   * Plan登録
   */
  @Post("reports/:reportId/plans")
  @ApiOperation({
    summary: "計画登録",
    description: "指定した日報に計画を登録する。",
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
    type: PlanDetailResponseDto,
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
    description: "バリデーションエラー（必須項目未入力等）",
  })
  async create(
    @Param("reportId", ParseIntPipe) reportId: number,
    @Body() dto: CreatePlanDto,
    @Request() req: { user: AuthenticatedUser }
  ): Promise<PlanDetailResponseDto> {
    return this.plansService.create(reportId, dto, req.user);
  }

  /**
   * Plan更新
   */
  @Put("plans/:id")
  @ApiOperation({
    summary: "計画更新",
    description: "指定した計画を更新する。",
  })
  @ApiParam({
    name: "id",
    description: "Plan ID",
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "更新成功",
    type: PlanDetailResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  @ApiForbiddenResponse({
    description: "権限エラー（他人の計画の更新、または提出済み日報の計画の更新）",
  })
  @ApiNotFoundResponse({
    description: "計画が見つからない",
  })
  @ApiUnprocessableEntityResponse({
    description: "バリデーションエラー",
  })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePlanDto,
    @Request() req: { user: AuthenticatedUser }
  ): Promise<PlanDetailResponseDto> {
    return this.plansService.update(id, dto, req.user);
  }

  /**
   * Plan削除
   */
  @Delete("plans/:id")
  @ApiOperation({
    summary: "計画削除",
    description: "指定した計画を削除する。関連するコメントも削除される。",
  })
  @ApiParam({
    name: "id",
    description: "Plan ID",
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "削除成功",
    type: PlanDeleteResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  @ApiForbiddenResponse({
    description: "権限エラー（他人の計画の削除、または提出済み日報の計画の削除）",
  })
  @ApiNotFoundResponse({
    description: "計画が見つからない",
  })
  async remove(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: { user: AuthenticatedUser }
  ): Promise<PlanDeleteResponseDto> {
    return this.plansService.remove(id, req.user);
  }
}

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
import { ProblemsService } from "./problems.service";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS validation requires runtime class reference
import {
  CreateProblemDto,
  UpdateProblemDto,
  ProblemListResponseDto,
  ProblemDetailResponseDto,
  ProblemDeleteResponseDto,
} from "./dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";

@ApiTags("課題・相談")
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  /**
   * Problem一覧取得
   */
  @Get("reports/:reportId/problems")
  @ApiOperation({
    summary: "課題・相談一覧取得",
    description: "指定した日報の課題・相談一覧を取得する。",
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
    type: ProblemListResponseDto,
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
  ): Promise<ProblemListResponseDto> {
    return this.problemsService.findAll(reportId, req.user);
  }

  /**
   * Problem登録
   */
  @Post("reports/:reportId/problems")
  @ApiOperation({
    summary: "課題・相談登録",
    description: "指定した日報に課題・相談を登録する。",
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
    type: ProblemDetailResponseDto,
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
    @Body() dto: CreateProblemDto,
    @Request() req: { user: AuthenticatedUser }
  ): Promise<ProblemDetailResponseDto> {
    return this.problemsService.create(reportId, dto, req.user);
  }

  /**
   * Problem更新
   */
  @Put("problems/:id")
  @ApiOperation({
    summary: "課題・相談更新",
    description: "指定した課題・相談を更新する。",
  })
  @ApiParam({
    name: "id",
    description: "Problem ID",
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "更新成功",
    type: ProblemDetailResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  @ApiForbiddenResponse({
    description: "権限エラー（他人の課題・相談の更新、または提出済み日報の課題・相談の更新）",
  })
  @ApiNotFoundResponse({
    description: "課題・相談が見つからない",
  })
  @ApiUnprocessableEntityResponse({
    description: "バリデーションエラー",
  })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateProblemDto,
    @Request() req: { user: AuthenticatedUser }
  ): Promise<ProblemDetailResponseDto> {
    return this.problemsService.update(id, dto, req.user);
  }

  /**
   * Problem削除
   */
  @Delete("problems/:id")
  @ApiOperation({
    summary: "課題・相談削除",
    description: "指定した課題・相談を削除する。関連するコメントも削除される。",
  })
  @ApiParam({
    name: "id",
    description: "Problem ID",
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "削除成功",
    type: ProblemDeleteResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  @ApiForbiddenResponse({
    description: "権限エラー（他人の課題・相談の削除、または提出済み日報の課題・相談の削除）",
  })
  @ApiNotFoundResponse({
    description: "課題・相談が見つからない",
  })
  async remove(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: { user: AuthenticatedUser }
  ): Promise<ProblemDeleteResponseDto> {
    return this.problemsService.remove(id, req.user);
  }
}

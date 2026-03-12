import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
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
import { CommentsService } from "./comments.service";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS validation requires runtime class reference
import {
  CreateCommentDto,
  CommentListResponseDto,
  CommentDetailResponseDto,
  CommentDeleteResponseDto,
} from "./dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";

@ApiTags("コメント")
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * Problemコメント一覧取得
   */
  @Get("problems/:id/comments")
  @ApiOperation({
    summary: "Problemコメント取得",
    description: "指定したProblemのコメント一覧を取得する。",
  })
  @ApiParam({
    name: "id",
    description: "Problem ID",
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "取得成功",
    type: CommentListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  @ApiForbiddenResponse({
    description: "権限エラー（他人の日報へのアクセス）",
  })
  @ApiNotFoundResponse({
    description: "課題・相談が見つからない",
  })
  async findByProblem(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: { user: AuthenticatedUser }
  ): Promise<CommentListResponseDto> {
    return this.commentsService.findByProblem(id, req.user);
  }

  /**
   * Problemコメント投稿
   */
  @Post("problems/:id/comments")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Problemコメント投稿",
    description:
      "Problemにコメントを投稿する。上長は部下の日報にのみコメント可能。adminは全ての日報にコメント可能。",
  })
  @ApiParam({
    name: "id",
    description: "Problem ID",
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 201,
    description: "投稿成功",
    type: CommentDetailResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  @ApiForbiddenResponse({
    description: "権限エラー（営業担当者による投稿、または担当外の日報への投稿）",
  })
  @ApiNotFoundResponse({
    description: "課題・相談が見つからない",
  })
  @ApiUnprocessableEntityResponse({
    description: "バリデーションエラー（内容未入力等）",
  })
  async createForProblem(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: CreateCommentDto,
    @Request() req: { user: AuthenticatedUser }
  ): Promise<CommentDetailResponseDto> {
    return this.commentsService.createForProblem(id, dto, req.user);
  }

  /**
   * Planコメント一覧取得
   */
  @Get("plans/:id/comments")
  @ApiOperation({
    summary: "Planコメント取得",
    description: "指定したPlanのコメント一覧を取得する。",
  })
  @ApiParam({
    name: "id",
    description: "Plan ID",
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "取得成功",
    type: CommentListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  @ApiForbiddenResponse({
    description: "権限エラー（他人の日報へのアクセス）",
  })
  @ApiNotFoundResponse({
    description: "計画が見つからない",
  })
  async findByPlan(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: { user: AuthenticatedUser }
  ): Promise<CommentListResponseDto> {
    return this.commentsService.findByPlan(id, req.user);
  }

  /**
   * Planコメント投稿
   */
  @Post("plans/:id/comments")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Planコメント投稿",
    description:
      "Planにコメントを投稿する。上長は部下の日報にのみコメント可能。adminは全ての日報にコメント可能。",
  })
  @ApiParam({
    name: "id",
    description: "Plan ID",
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 201,
    description: "投稿成功",
    type: CommentDetailResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  @ApiForbiddenResponse({
    description: "権限エラー（営業担当者による投稿、または担当外の日報への投稿）",
  })
  @ApiNotFoundResponse({
    description: "計画が見つからない",
  })
  @ApiUnprocessableEntityResponse({
    description: "バリデーションエラー（内容未入力等）",
  })
  async createForPlan(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: CreateCommentDto,
    @Request() req: { user: AuthenticatedUser }
  ): Promise<CommentDetailResponseDto> {
    return this.commentsService.createForPlan(id, dto, req.user);
  }

  /**
   * コメント削除
   */
  @Delete("comments/:id")
  @ApiOperation({
    summary: "コメント削除",
    description:
      "コメントを削除する。上長は自分のコメントのみ削除可能。adminは全てのコメントを削除可能。",
  })
  @ApiParam({
    name: "id",
    description: "Comment ID",
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "削除成功",
    type: CommentDeleteResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  @ApiForbiddenResponse({
    description: "権限エラー（営業担当者による削除、または他人のコメントの削除）",
  })
  @ApiNotFoundResponse({
    description: "コメントが見つからない",
  })
  async remove(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: { user: AuthenticatedUser }
  ): Promise<CommentDeleteResponseDto> {
    return this.commentsService.remove(id, req.user);
  }
}

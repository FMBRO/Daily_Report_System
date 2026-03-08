import {
  Controller,
  Get,
  Post,
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
import { SalespersonsService } from "./salespersons.service";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS validation requires runtime class reference
import {
  SalespersonQueryDto,
  SalespersonListResponseDto,
  SalespersonDetailResponseDto,
  CreateSalespersonDto,
  UpdateSalespersonDto,
  CreateSalespersonResponseDto,
  UpdateSalespersonResponseDto,
  DeleteSalespersonResponseDto,
} from "./dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";

@ApiTags("営業担当者")
@Controller("salespersons")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SalespersonsController {
  constructor(private readonly salespersonsService: SalespersonsService) {}

  /**
   * 営業担当者一覧取得
   */
  @Get()
  @ApiOperation({
    summary: "営業担当者一覧取得",
    description: "営業担当者の一覧を取得する",
  })
  @ApiResponse({
    status: 200,
    description: "取得成功",
    type: SalespersonListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  async findAll(@Query() query: SalespersonQueryDto): Promise<SalespersonListResponseDto> {
    return this.salespersonsService.findAll(query);
  }

  /**
   * 営業担当者詳細取得
   */
  @Get(":id")
  @ApiOperation({
    summary: "営業担当者詳細取得",
    description: "指定した営業担当者の詳細を取得する",
  })
  @ApiParam({
    name: "id",
    description: "営業ID",
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "取得成功",
    type: SalespersonDetailResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  @ApiNotFoundResponse({
    description: "営業担当者が見つからない",
  })
  async findOne(@Param("id", ParseIntPipe) id: number): Promise<SalespersonDetailResponseDto> {
    return this.salespersonsService.findOne(id);
  }

  /**
   * 営業担当者登録
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({
    summary: "営業担当者登録",
    description: "新規の営業担当者を登録する（管理者のみ）",
  })
  @ApiResponse({
    status: 201,
    description: "登録成功",
    type: CreateSalespersonResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  @ApiForbiddenResponse({
    description: "権限エラー（管理者権限が必要）",
  })
  @ApiUnprocessableEntityResponse({
    description: "バリデーションエラー（メール重複、パスワード不足など）",
  })
  async create(@Body() dto: CreateSalespersonDto): Promise<CreateSalespersonResponseDto> {
    return this.salespersonsService.create(dto);
  }

  /**
   * 営業担当者更新
   */
  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({
    summary: "営業担当者更新",
    description: "指定した営業担当者の情報を更新する（管理者のみ）",
  })
  @ApiParam({
    name: "id",
    description: "営業ID",
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "更新成功",
    type: UpdateSalespersonResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  @ApiForbiddenResponse({
    description: "権限エラー（管理者権限が必要）",
  })
  @ApiNotFoundResponse({
    description: "営業担当者が見つからない",
  })
  @ApiUnprocessableEntityResponse({
    description: "バリデーションエラー（メール重複など）",
  })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateSalespersonDto
  ): Promise<UpdateSalespersonResponseDto> {
    return this.salespersonsService.update(id, dto);
  }

  /**
   * 営業担当者削除
   */
  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({
    summary: "営業担当者削除",
    description: "指定した営業担当者を削除する（論理削除、管理者のみ）",
  })
  @ApiParam({
    name: "id",
    description: "営業ID",
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "削除成功",
    type: DeleteSalespersonResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  @ApiForbiddenResponse({
    description: "権限エラー（管理者権限が必要、または自分自身を削除しようとした）",
  })
  @ApiNotFoundResponse({
    description: "営業担当者が見つからない",
  })
  @ApiUnprocessableEntityResponse({
    description: "バリデーションエラー（部下が存在する）",
  })
  async remove(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: { user: AuthenticatedUser }
  ): Promise<DeleteSalespersonResponseDto> {
    return this.salespersonsService.remove(id, req.user.id);
  }
}

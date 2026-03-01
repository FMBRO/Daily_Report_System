import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from "@nestjs/swagger";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS DI requires runtime class reference
import { SalespersonsService } from "./salespersons.service";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS validation requires runtime class reference
import {
  SalespersonQueryDto,
  SalespersonListResponseDto,
  SalespersonDetailResponseDto,
} from "./dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

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
}

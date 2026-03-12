import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS DI requires runtime class reference
import { CustomersService } from "./customers.service";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS validation requires runtime class reference
import {
  CreateCustomerDto,
  CustomerQueryDto,
  CustomerListResponseDto,
  CustomerDetailResponseDto,
  UpdateCustomerDto,
} from "./dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("顧客")
@Controller("customers")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  /**
   * 顧客一覧取得
   */
  @Get()
  @ApiOperation({
    summary: "顧客一覧取得",
    description: "顧客の一覧を取得する",
  })
  @ApiResponse({
    status: 200,
    description: "取得成功",
    type: CustomerListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  async findAll(@Query() query: CustomerQueryDto): Promise<CustomerListResponseDto> {
    return this.customersService.findAll(query);
  }

  /**
   * 顧客詳細取得
   */
  @Get(":id")
  @ApiOperation({
    summary: "顧客詳細取得",
    description: "指定した顧客の詳細を取得する",
  })
  @ApiParam({
    name: "id",
    description: "顧客ID",
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "取得成功",
    type: CustomerDetailResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  @ApiNotFoundResponse({
    description: "顧客が見つからない",
  })
  async findOne(@Param("id", ParseIntPipe) id: number): Promise<CustomerDetailResponseDto> {
    return this.customersService.findOne(id);
  }

  /**
   * 顧客登録
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "顧客登録",
    description: "新しい顧客を登録する（管理者のみ）",
  })
  @ApiBody({ type: CreateCustomerDto })
  @ApiCreatedResponse({
    description: "登録成功",
    type: CustomerDetailResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  @ApiForbiddenResponse({
    description: "権限エラー（管理者以外）",
  })
  @ApiUnprocessableEntityResponse({
    description: "バリデーションエラー",
  })
  async create(@Body() dto: CreateCustomerDto): Promise<CustomerDetailResponseDto> {
    return this.customersService.create(dto);
  }

  /**
   * 顧客更新
   */
  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({
    summary: "顧客更新",
    description: "顧客情報を更新する（管理者のみ）",
  })
  @ApiParam({
    name: "id",
    description: "顧客ID",
    type: Number,
    example: 1,
  })
  @ApiBody({ type: UpdateCustomerDto })
  @ApiResponse({
    status: 200,
    description: "更新成功",
    type: CustomerDetailResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  @ApiForbiddenResponse({
    description: "権限エラー（管理者以外）",
  })
  @ApiNotFoundResponse({
    description: "顧客が見つからない",
  })
  @ApiUnprocessableEntityResponse({
    description: "バリデーションエラー",
  })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerDto
  ): Promise<CustomerDetailResponseDto> {
    return this.customersService.update(id, dto);
  }

  /**
   * 顧客削除（論理削除）
   */
  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({
    summary: "顧客削除",
    description: "顧客を削除する（論理削除：is_activeをfalseに更新）（管理者のみ）",
  })
  @ApiParam({
    name: "id",
    description: "顧客ID",
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "削除成功",
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  @ApiForbiddenResponse({
    description: "権限エラー（管理者以外）",
  })
  @ApiNotFoundResponse({
    description: "顧客が見つからない",
  })
  async remove(
    @Param("id", ParseIntPipe) id: number
  ): Promise<{ success: boolean; data: { message: string } }> {
    return this.customersService.remove(id);
  }
}

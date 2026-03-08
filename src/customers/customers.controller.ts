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
import { CustomersService } from "./customers.service";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS validation requires runtime class reference
import { CustomerQueryDto, CustomerListResponseDto, CustomerDetailResponseDto } from "./dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

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
}

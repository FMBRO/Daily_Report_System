import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- NestJS DI requires runtime class reference
import { ReportsService } from "./reports.service";
import { CreateReportDto, CreateReportResponseDto } from "./dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";

@ApiTags("日報")
@Controller("reports")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * 日報作成
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "日報作成",
    description: "新しい日報を作成する。訪問記録・Problem・Planを含めて一括作成可能。",
  })
  @ApiBody({ type: CreateReportDto })
  @ApiResponse({
    status: 201,
    description: "作成成功",
    type: CreateReportResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "認証エラー（トークンがない、または無効）",
  })
  @ApiUnprocessableEntityResponse({
    description: "バリデーションエラー（日付重複、顧客ID不正など）",
  })
  async create(
    @Body() dto: CreateReportDto,
    @Request() req: { user: AuthenticatedUser }
  ): Promise<CreateReportResponseDto> {
    return this.reportsService.create(dto, req.user);
  }
}

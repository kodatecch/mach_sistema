import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { EvmService } from './evm.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectRequest } from '../project/project-context.middleware';

@Controller('evm')
@UseGuards(JwtAuthGuard)
export class EvmController {
  constructor(private readonly evmService: EvmService) {}

  // 1. GET /evm/snapshot?date=
  @Get('snapshot')
  async getSnapshot(
    @Req() req: ProjectRequest,
    @Query('date') dateStr?: string,
  ) {
    let targetDate = new Date();
    if (dateStr) {
      const parsed = new Date(dateStr);
      if (isNaN(parsed.getTime())) {
        throw new BadRequestException('Formato de data inválido. Use ISO-8601 (ex. YYYY-MM-DD).');
      }
      targetDate = parsed;
    }
    return this.evmService.getSnapshotClosestToDate(req.projectId, targetDate);
  }

  // 2. GET /evm/series
  @Get('series')
  async getSeries(@Req() req: ProjectRequest) {
    return this.evmService.getSeries(req.projectId);
  }

  // 3. POST /evm/recalculate
  @Post('recalculate')
  async recalculate(@Req() req: ProjectRequest) {
    const today = new Date();
    return this.evmService.recalculateSnapshot(req.projectId, today);
  }

  // Helper/Dev backdoor: POST /evm/trigger-job
  // Forces the execution of the daily snapshot job manually for all projects
  @Post('trigger-job')
  async triggerJob() {
    await this.evmService.runDailySnapshots();
    return {
      message: 'Job diário de snapshot simulado e executado com sucesso.',
      timestamp: new Date().toISOString(),
    };
  }
}

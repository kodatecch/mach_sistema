import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { RisksService } from './risks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { CheckPermissions } from '../auth/permissions.decorator';
import { ProjectRequest } from '../project/project-context.middleware';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RisksController {
  constructor(private readonly risksService: RisksService) {}

  // 1. RISKS REGISTER
  @Get('risks')
  async getRisks(@Req() req: ProjectRequest) {
    return this.risksService.getRisks(req.projectId, req.user.userId);
  }

  @Post('risks')
  @CheckPermissions('create', 'risks')
  async createRisk(
    @Req() req: ProjectRequest,
    @Body() body: {
      title: string;
      description?: string;
      category: string;
      area: string;
      probability: number;
      impact: number;
      status?: string;
      mitigationPlan?: string;
      contingencyPlan?: string;
      watchListThreshold?: number;
    }
  ) {
    if (!body.title || !body.category || !body.area) {
      throw new BadRequestException('Campos obrigatórios: título, categoria ("threat" | "opportunity") e área.');
    }
    return this.risksService.createRisk(req.projectId, req.user.userId, body);
  }

  @Get('risks/matrix')
  async getRisksMatrix(@Req() req: ProjectRequest) {
    return this.risksService.getRisksMatrix(req.projectId, req.user.userId);
  }

  @Patch('risks/:id/status')
  @CheckPermissions('update', 'risks')
  async updateRiskStatus(
    @Req() req: ProjectRequest,
    @Param('id') id: string,
    @Body() body: { status: string }
  ) {
    if (!body.status) {
      throw new BadRequestException('Campo status é obrigatório.');
    }
    return this.risksService.updateRiskStatus(req.projectId, req.user.userId, id, body.status);
  }

  @Patch('risks/:id/comment')
  @CheckPermissions('update', 'risks')
  async updateRiskComment(
    @Req() req: ProjectRequest,
    @Param('id') id: string,
    @Body() body: { comment: string }
  ) {
    return this.risksService.updateRiskComment(req.projectId, req.user.userId, id, body.comment);
  }

  // 2. STATUS REPORTS
  @Get('status-reports')
  async getStatusReports(@Req() req: ProjectRequest) {
    return this.risksService.getStatusReports(req.projectId, req.user.userId);
  }

  @Post('status-reports')
  @CheckPermissions('create', 'status_reports')
  async createStatusReport(
    @Req() req: ProjectRequest,
    @Body() body: {
      projectStatus: string;
      accomplishments: string;
      ongoingTasks: string;
      blockers: string;
      reportDate?: string;
    }
  ) {
    if (!body.projectStatus || !body.accomplishments || !body.ongoingTasks || !body.blockers) {
      throw new BadRequestException('Todos os campos do relatório de status (accomplishments/ongoingTasks/blockers/projectStatus) são obrigatórios.');
    }
    return this.risksService.createStatusReport(req.projectId, req.user.userId, body);
  }

  @Patch('status-reports/:id/comment')
  @CheckPermissions('update', 'status_reports')
  async updateStatusReportComment(
    @Req() req: ProjectRequest,
    @Param('id') id: string,
    @Body() body: { comment: string }
  ) {
    return this.risksService.updateStatusReportComment(req.projectId, req.user.userId, id, body.comment);
  }

  // 3. SCOPE CHANGES
  @Get('scope-changes')
  async getScopeChanges(@Req() req: ProjectRequest) {
    return this.risksService.getScopeChanges(req.projectId, req.user.userId);
  }

  @Post('scope-changes')
  @CheckPermissions('create', 'scope_changes')
  async createScopeChange(
    @Req() req: ProjectRequest,
    @Body() body: {
      title: string;
      description?: string;
      impactOnTime: number;
      impactOnBudget: number;
      decision: string;
      justification?: string;
      requestedBy: string;
      taskId?: string;
      wbsItemId?: string;
    }
  ) {
    if (!body.title || body.impactOnTime === undefined || body.impactOnBudget === undefined || !body.decision || !body.requestedBy) {
      throw new BadRequestException('Campos obrigatórios incompletos para registro de mudança de escopo.');
    }
    return this.risksService.createScopeChange(req.projectId, req.user.userId, body);
  }
}

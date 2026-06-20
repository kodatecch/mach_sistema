import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CronogramaService } from './cronograma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { CheckPermissions } from '../auth/permissions.decorator';
import { ProjectRequest } from '../project/project-context.middleware';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CronogramaController {
  constructor(private readonly cronogramaService: CronogramaService) {}

  // WBS / EAP Endpoints
  @Get('wbs')
  async getWbs(@Req() req: ProjectRequest) {
    return this.cronogramaService.getWbs(req.projectId, req.user.userId);
  }

  @Post('wbs')
  @CheckPermissions('create', 'wbs')
  async createWbs(
    @Req() req: ProjectRequest,
    @Body() body: { name: string; code: string; description?: string; parentId?: string }
  ) {
    return this.cronogramaService.createWbs(req.projectId, req.user.userId, body);
  }

  @Patch('wbs/:id')
  @CheckPermissions('update', 'wbs')
  async updateWbs(
    @Req() req: ProjectRequest,
    @Param('id') id: string,
    @Body() body: { name?: string; code?: string; description?: string; parentId?: string }
  ) {
    return this.cronogramaService.updateWbs(req.projectId, req.user.userId, id, body);
  }

  // Tasks Endpoints
  @Get('tasks')
  async getTasks(
    @Req() req: ProjectRequest,
    @Query('owner') owner?: string,
    @Query('status') status?: string
  ) {
    return this.cronogramaService.getTasks(req.projectId, req.user.userId, { owner, status });
  }

  @Post('tasks')
  @CheckPermissions('create', 'tasks')
  async createTask(
    @Req() req: ProjectRequest,
    @Body()
    body: {
      name: string;
      description?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      wbsItemId?: string;
      what?: string;
      why?: string;
      where?: string;
      whenDate?: string;
      whoOwnerId?: string;
      how?: string;
      howMuch?: number;
      durationOptimistic?: number;
      durationLikely?: number;
      durationPessimistic?: number;
    }
  ) {
    return this.cronogramaService.createTask(req.projectId, req.user.userId, body);
  }

  @Patch('tasks/:id')
  @CheckPermissions('update', 'tasks')
  async updateTask(
    @Req() req: ProjectRequest,
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      wbsItemId?: string;
      what?: string;
      why?: string;
      where?: string;
      whenDate?: string;
      whoOwnerId?: string;
      how?: string;
      howMuch?: number;
      durationOptimistic?: number;
      durationLikely?: number;
      durationPessimistic?: number;
      comment?: string;
    }
  ) {
    return this.cronogramaService.updateTask(req.projectId, req.user.userId, id, body);
  }

  // Task Dependencies
  @Post('tasks/:id/dependencies')
  @CheckPermissions('update', 'tasks')
  async addTaskDependency(
    @Req() req: ProjectRequest,
    @Param('id') id: string,
    @Body() body: { dependsOnTaskId: string; type?: string }
  ) {
    return this.cronogramaService.addTaskDependency(req.projectId, req.user.userId, id, body);
  }

  // Schedule CPM and Gantt Endpoints
  @Get('schedule/critical-path')
  async getCriticalPath(@Req() req: ProjectRequest) {
    return this.cronogramaService.calculateCriticalPath(req.projectId, req.user.userId);
  }

  @Get('schedule/gantt')
  async getGantt(@Req() req: ProjectRequest) {
    return this.cronogramaService.getGanttPayload(req.projectId, req.user.userId);
  }
}

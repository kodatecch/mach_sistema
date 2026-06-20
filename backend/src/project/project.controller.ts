import { Controller, Post, Get, Body, Req, UseGuards, Query } from '@nestjs/common';
import { ProjectService } from './project.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  async createProject(@Body() body: any, @Req() req: any) {
    return this.projectService.createProject(
      body.name,
      body.organizationId || 'default-org-uuid',
      new Date(body.startDate),
      new Date(body.endDate),
      body.executionRegime || 'linear',
      req.user.userId
    );
  }

  @Get('my-projects')
  async getMyProjects(@Req() req: any) {
    return this.projectService.getMyProjects(req.user.userId);
  }

  @Post('invite')
  @Roles('admin', 'area_lead') // Only administrators or leads can trigger active invitations
  async invite(@Body() body: any, @Query('projectId') projectId: string) {
    return this.projectService.inviteMember(projectId || body.projectId, body.email, body.role);
  }
}

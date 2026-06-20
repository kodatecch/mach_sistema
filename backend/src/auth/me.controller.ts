import { Controller, Get, Query, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { calculatePermissions } from './permissions';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('permissions')
  async getPermissions(
    @Query('project_id') projectIdFromSnake: string,
    @Query('projectId') projectIdFromCamel: string,
    @Req() req: any
  ) {
    const projectId = projectIdFromSnake || projectIdFromCamel;
    if (!projectId) {
      throw new BadRequestException('Contexto de projeto ausente (forneça o parâmetro "project_id" ou "projectId").');
    }

    const userId = req.user.userId;

    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    if (!member) {
      // If they are not a member (or maybe they are trying to load permissions for an unjoined project),
      // we can return a default set of false permissions.
      return {
        role: null,
        area: null,
        canEditWbs: false,
        canEditTasks: false,
        canEditBudget: false,
        canEditRisks: false,
        canEditStakeholders: false,
        canEditStatusReports: false,
        canEditScopeChanges: false,
        canComment: false,
        canCommentOnly: false,
        isSponsor: false,
        isMentor: false,
        isAdmin: false,
      };
    }

    const perms = calculatePermissions(member.role, member.area || '');

    return {
      role: member.role,
      area: member.area,
      ...perms,
    };
  }
}

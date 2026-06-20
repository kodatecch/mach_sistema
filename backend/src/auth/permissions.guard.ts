import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { PERMISSIONS_KEY, RequiredPermission } from './permissions.decorator';
import { calculatePermissions } from './permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<RequiredPermission>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.userId) {
      throw new ForbiddenException('Usuário não autenticado.');
    }

    const projectId = request.headers['x-project-id'] as string || 
                      request.query.projectId as string || 
                      request.body.projectId as string;

    if (!projectId) {
      throw new BadRequestException('Contexto de projeto ausente (forneça o "x-project-id" ou query param "projectId").');
    }

    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: user.userId },
      },
    });

    if (!member) {
      throw new ForbiddenException('Acesso negado: Você não é membro cadastrado deste projeto.');
    }

    const perms = calculatePermissions(member.role, member.area || '');

    // Sponsor has no write rights whatsoever
    if (member.role === 'sponsor' && (requiredPermission.action === 'create' || requiredPermission.action === 'update' || requiredPermission.action === 'delete' || requiredPermission.action === 'comment')) {
      throw new ForbiddenException('Acesso negado: Sponsors possuem permissão apenas de leitura.');
    }

    // Mentor has write rights only for commenting
    if (member.role === 'mentor') {
      if (requiredPermission.action === 'comment') {
        return true;
      }
      if (requiredPermission.action === 'update' && 
          (requiredPermission.resource === 'tasks' || requiredPermission.resource === 'risks' || requiredPermission.resource === 'status_reports')) {
        return true;
      }
      if (requiredPermission.action !== 'read') {
        throw new ForbiddenException('Acesso negado: Mentores possuem permissão apenas de leitura e comentários.');
      }
    }

    // Checking individual resources for create/update/delete
    if (requiredPermission.action === 'create' || requiredPermission.action === 'update' || requiredPermission.action === 'delete') {
      switch (requiredPermission.resource) {
        case 'wbs':
          if (!perms.canEditWbs) {
            throw new ForbiddenException('Acesso negado: Sem permissão para editar WBS/EAP.');
          }
          break;

        case 'tasks':
          // regular members can update their own tasks - checked at service layer
          if (!perms.canEditTasks && !(member.role === 'member' && requiredPermission.action === 'update')) {
            throw new ForbiddenException('Acesso negado: Sem permissão para criar/editar tarefas.');
          }
          break;

        case 'budget':
          if (!perms.canEditBudget) {
            throw new ForbiddenException('Acesso negado: Sem permissão para editar orçamentos/recursos.');
          }
          break;

        case 'risks':
          if (!perms.canEditRisks) {
            throw new ForbiddenException('Acesso negado: Sem permissão para editar riscos.');
          }
          break;

        case 'stakeholders':
          if (!perms.canEditStakeholders) {
            throw new ForbiddenException('Acesso negado: Sem permissão para editar partes interessadas.');
          }
          break;

        case 'status_reports':
          if (!perms.canEditStatusReports) {
            throw new ForbiddenException('Acesso negado: Sem permissão para cadastrar relatórios de status.');
          }
          break;

        case 'scope_changes':
          if (!perms.canEditScopeChanges) {
            throw new ForbiddenException('Acesso negado: Sem permissão para gerenciar mudanças de escopo.');
          }
          break;
      }
    }

    return true;
  }
}

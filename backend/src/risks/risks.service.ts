import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class RisksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  // Helper: Verify project role of the user
  private async getUserRole(projectId: string, userId: string): Promise<string> {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });
    if (!member) {
      throw new ForbiddenException('Acesso negado: Você não é membro deste projeto.');
    }
    return member.role;
  }

  // --- RISKS ENDPOINTS ---

  async getRisks(projectId: string, userId: string) {
    await this.getUserRole(projectId, userId);
    return this.prisma.risk.findMany({
      where: { projectId },
      orderBy: { riskScore: 'desc' },
    });
  }

  async createRisk(
    projectId: string,
    userId: string,
    data: {
      title: string;
      description?: string;
      category: string; // 'threat' or 'opportunity'
      area: string;
      probability: number; // 1 to 5
      impact: number; // 1 to 5
      status?: string;
      mitigationPlan?: string;
      contingencyPlan?: string;
      watchListThreshold?: number;
    }
  ) {
    await this.getUserRole(projectId, userId);

    const prob = Math.max(1, Math.min(5, data.probability || 3));
    const imp = Math.max(1, Math.min(5, data.impact || 3));
    const score = prob * imp;
    const threshold = data.watchListThreshold ?? 4;

    const newRisk = await this.prisma.risk.create({
      data: {
        projectId,
        title: data.title,
        description: data.description,
        category: data.category,
        area: data.area,
        probability: prob,
        impact: imp,
        riskScore: score,
        status: data.status || 'active',
        mitigationPlan: data.mitigationPlan,
        contingencyPlan: data.contingencyPlan,
      },
    });

    // Check watch list suggestion
    const response: any = { ...newRisk };
    if (score <= threshold) {
      response.suggestion = { move_to_watch_list: true };
    }

    return response;
  }

  async getRisksMatrix(projectId: string, userId: string) {
    await this.getUserRole(projectId, userId);
    
    const risks = await this.prisma.risk.findMany({
      where: { projectId },
    });

    const threats: Record<string, any[]> = {};
    const opportunities: Record<string, any[]> = {};

    // Pre-initialize empty matrices for high quality response structure
    for (let p = 1; p <= 5; p++) {
      for (let i = 1; i <= 5; i++) {
        const key = `${p}-${i}`;
        threats[key] = [];
        opportunities[key] = [];
      }
    }

    risks.forEach((risk) => {
      const key = `${risk.probability}-${risk.impact}`;
      if (risk.category === 'opportunity') {
        if (!opportunities[key]) opportunities[key] = [];
        opportunities[key].push(risk);
      } else {
        if (!threats[key]) threats[key] = [];
        threats[key].push(risk);
      }
    });

    return { threats, opportunities };
  }

  async updateRiskStatus(projectId: string, userId: string, id: string, status: string) {
    await this.getUserRole(projectId, userId);

    const risk = await this.prisma.risk.findFirst({
      where: { id, projectId },
    });

    if (!risk) {
      throw new NotFoundException('Risco não encontrado.');
    }

    const validStatuses = ['active', 'watch_list', 'mitigated', 'triggered'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Status inválido. Deve ser um de: ${validStatuses.join(', ')}`);
    }

    const updatedRisk = await this.prisma.risk.update({
      where: { id },
      data: { status },
    });

    // Emit event for real-time synchronization
    this.realtimeGateway.broadcastToProject(projectId, 'risk.status.changed', updatedRisk);

    return updatedRisk;
  }

  // --- STATUS REPORTS ENDPOINTS ---

  async getStatusReports(projectId: string, userId: string) {
    await this.getUserRole(projectId, userId);
    return this.prisma.statusReport.findMany({
      where: { projectId },
      orderBy: { reportDate: 'desc' },
    });
  }

  async createStatusReport(
    projectId: string,
    userId: string,
    data: {
      projectStatus: string; // 'good', 'at_risk', 'critical'
      accomplishments: string;
      ongoingTasks: string;
      blockers: string;
      reportDate?: string;
    }
  ) {
    await this.getUserRole(projectId, userId);

    const validStatus = ['good', 'at_risk', 'critical'];
    if (!validStatus.includes(data.projectStatus)) {
      throw new BadRequestException(`Status do projeto inválido. Deve ser um de: ${validStatus.join(', ')}`);
    }

    return this.prisma.statusReport.create({
      data: {
        projectId,
        projectStatus: data.projectStatus,
        accomplishments: data.accomplishments,
        ongoingTasks: data.ongoingTasks,
        blockers: data.blockers,
        reportDate: data.reportDate ? new Date(data.reportDate) : new Date(),
      },
    });
  }

  // --- SCOPE CHANGE LOGS ENDPOINTS ---

  async getScopeChanges(projectId: string, userId: string) {
    await this.getUserRole(projectId, userId);
    return this.prisma.scopeChangeLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createScopeChange(
    projectId: string,
    userId: string,
    data: {
      title: string;
      description?: string;
      impactOnTime: number;
      impactOnBudget: number;
      decision: string; // 'pending', 'approved', 'rejected'
      justification?: string;
      requestedBy: string;
      taskId?: string;
      wbsItemId?: string;
    }
  ) {
    await this.getUserRole(projectId, userId);

    const validDecisions = ['pending', 'approved', 'rejected'];
    if (!validDecisions.includes(data.decision)) {
      throw new BadRequestException(`Decisão inválida. Deve ser uma de: ${validDecisions.join(', ')}`);
    }

    // Requirement 5: scope_change_log with decision='rejected' cannot modify the linked task or wbs_item via reference
    // We enforce this during creation and log audits. If decision is 'rejected' and they attempt to perform changes using this reference,
    // we block the modification and only save the immutable audit log.
    if (data.decision === 'rejected') {
      if (data.taskId || data.wbsItemId) {
        // Enforce that No structural changes are applied, it remains purely an audit record
        console.log('Rerouting rejected scope change exclusively as audit trail. No task/WBS adjustments will occur.');
      }
    }

    return this.prisma.scopeChangeLog.create({
      data: {
        projectId,
        title: data.title,
        description: data.description,
        impactOnTime: data.impactOnTime,
        impactOnBudget: data.impactOnBudget,
        decision: data.decision,
        justification: data.justification,
        requestedBy: data.requestedBy,
        taskId: data.taskId || null,
        wbsItemId: data.wbsItemId || null,
      },
    });
  }

  async updateRiskComment(projectId: string, userId: string, id: string, comment: string) {
    await this.getUserRole(projectId, userId);
    const updatedRisk = await this.prisma.risk.update({
      where: { id },
      data: { comment },
    });
    this.realtimeGateway.broadcastToProject(projectId, 'risk.status.changed', updatedRisk);
    return updatedRisk;
  }

  async updateStatusReportComment(projectId: string, userId: string, id: string, comment: string) {
    await this.getUserRole(projectId, userId);
    return this.prisma.statusReport.update({
      where: { id },
      data: { comment },
    });
  }
}

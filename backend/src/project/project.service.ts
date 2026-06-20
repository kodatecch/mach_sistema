import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class ProjectService {
  // Synthesizing core database operations
  
  async createProject(name: string, orgId: string, startDate: Date, endDate: Date, regime: 'linear' | 'fast_tracking', creatorId: string) {
    const newProject = {
      id: `proj_${Date.now()}`,
      name,
      organizationId: orgId,
      startDate,
      endDate,
      executionRegime: regime,
      createdAt: new Date(),
    };

    // Real Prisma integration code:
    // await this.prisma.project.create({
    //   data: {
    //     name,
    //     organizationId: orgId,
    //     startDate,
    //     endDate,
    //     executionRegime: regime,
    //     members: { create: { userId: creatorId, role: 'admin' } }
    //   }
    // });

    return {
      success: true,
      message: 'Projeto STEM Racing criado com sucesso!',
      project: newProject,
    };
  }

  async inviteMember(projectId: string, email: string, role: string) {
    // Simulated Prisma search and relationship insertion
    return {
      success: true,
      message: `Membro convidado successfully via e-mail ${email} como ${role}!`,
      invitation: {
        id: `invite_${Date.now()}`,
        projectId,
        email,
        role,
        status: 'pending'
      }
    };
  }

  async getMyProjects(userId: string) {
    // Prisma operation:
    // return this.prisma.project.findMany({ where: { members: { some: { userId } } } });
    
    return [
      {
        id: 'proj_mach_one_main',
        name: 'Mach One Formula SAE',
        organizationId: 'org_mach_racing_team',
        startDate: new Date('2026-02-15'),
        endDate: new Date('2026-12-15'),
        executionRegime: 'fast_tracking',
        role: 'admin'
      }
    ];
  }
}

import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class CronogramaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  // Helper: Verify project role of the user
  async getUserRole(projectId: string, userId: string): Promise<string> {
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

  // WBS Endpoints
  async getWbs(projectId: string, userId: string) {
    // Ensure membership
    await this.getUserRole(projectId, userId);

    return this.prisma.wbsItem.findMany({
      where: { projectId },
      orderBy: { code: 'asc' },
    });
  }

  async createWbs(
    projectId: string,
    userId: string,
    data: { name: string; code: string; description?: string; parentId?: string }
  ) {
    const role = await this.getUserRole(projectId, userId);
    if (role !== 'admin' && role !== 'area_lead') {
      throw new ForbiddenException('Apenas admin ou area_lead podem criar itens de EAP/WBS.');
    }

    if (data.parentId) {
      const parent = await this.prisma.wbsItem.findFirst({
        where: { id: data.parentId, projectId },
      });
      if (!parent) {
        throw new NotFoundException('Item de EAP pai não encontrado.');
      }
    }

    return this.prisma.wbsItem.create({
      data: {
        projectId,
        name: data.name,
        code: data.code,
        description: data.description || null,
        parentId: data.parentId || null,
      },
    });
  }

  async updateWbs(
    projectId: string,
    userId: string,
    id: string,
    data: { name?: string; code?: string; description?: string; parentId?: string }
  ) {
    const role = await this.getUserRole(projectId, userId);
    if (role !== 'admin' && role !== 'area_lead') {
      throw new ForbiddenException('Apenas admin ou area_lead podem atualizar itens de EAP/WBS.');
    }

    const item = await this.prisma.wbsItem.findFirst({
      where: { id, projectId },
    });
    if (!item) {
      throw new NotFoundException('Item de EAP não encontrado.');
    }

    if (data.parentId) {
      if (data.parentId === id) {
        throw new BadRequestException('Um item de EAP não pode ser pai de si mesmo.');
      }
      const parent = await this.prisma.wbsItem.findFirst({
        where: { id: data.parentId, projectId },
      });
      if (!parent) {
        throw new NotFoundException('Item de EAP pai de destino não encontrado.');
      }
    }

    return this.prisma.wbsItem.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        parentId: data.parentId === null ? null : data.parentId,
      },
    });
  }

  // Tasks Endpoints
  async getTasks(projectId: string, userId: string, filters: { owner?: string; status?: string }) {
    const role = await this.getUserRole(projectId, userId);

    const where: any = { projectId };
    if (filters.owner) {
      where.whoOwnerId = filters.owner;
    }
    if (filters.status) {
      where.status = filters.status;
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        wbsItem: true,
        dependencies: {
          include: {
            dependsOnTask: true,
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (role === 'sponsor') {
      return tasks.map(task => ({
        ...task,
        what: null,
        why: null,
        where: null,
        whenDate: null,
        how: null,
        howMuch: null,
      }));
    }

    return tasks;
  }

  async createTask(
    projectId: string,
    userId: string,
    data: {
      name: string;
      description?: string;
      status?: string;
      startDate?: string | Date;
      endDate?: string | Date;
      wbsItemId?: string;
      // 5W2H
      what?: string;
      why?: string;
      where?: string;
      whenDate?: string;
      whoOwnerId?: string;
      how?: string;
      howMuch?: number;
      // PERT
      durationOptimistic?: number;
      durationLikely?: number;
      durationPessimistic?: number;
    }
  ) {
    // Validate membership
    await this.getUserRole(projectId, userId);

    if (data.wbsItemId) {
      const wbs = await this.prisma.wbsItem.findFirst({
        where: { id: data.wbsItemId, projectId },
      });
      if (!wbs) {
        throw new NotFoundException('EAP/WBS de destino não encontrado ou pertence a outro projeto.');
      }
    }

    let durationExpected: number | undefined;
    if (
      data.durationOptimistic !== undefined &&
      data.durationLikely !== undefined &&
      data.durationPessimistic !== undefined
    ) {
      durationExpected = (data.durationOptimistic + 4 * data.durationLikely + data.durationPessimistic) / 6;
    }

    const newTask = await this.prisma.task.create({
      data: {
        projectId,
        name: data.name,
        description: data.description || null,
        status: data.status || 'todo',
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        wbsItemId: data.wbsItemId || null,
        what: data.what || null,
        why: data.why || null,
        where: data.where || null,
        whenDate: data.whenDate || null,
        whoOwnerId: data.whoOwnerId || null,
        how: data.how || null,
        howMuch: data.howMuch !== undefined ? Number(data.howMuch) : null,
        durationOptimistic: data.durationOptimistic !== undefined ? Number(data.durationOptimistic) : null,
        durationLikely: data.durationLikely !== undefined ? Number(data.durationLikely) : null,
        durationPessimistic: data.durationPessimistic !== undefined ? Number(data.durationPessimistic) : null,
        durationExpected: durationExpected !== undefined ? Number(durationExpected.toFixed(2)) : null,
      },
      include: {
        wbsItem: true,
      }
    });

    try {
      await this.calculateCriticalPath(projectId, userId);
    } catch (e) {
      console.error('Error calculating critical path:', e);
    }

    return newTask;
  }

  async updateTask(
    projectId: string,
    userId: string,
    id: string,
    data: {
      name?: string;
      description?: string;
      status?: string;
      startDate?: string | Date;
      endDate?: string | Date;
      wbsItemId?: string;
      // 5W2H
      what?: string;
      why?: string;
      where?: string;
      whenDate?: string;
      whoOwnerId?: string;
      how?: string;
      howMuch?: number;
      // PERT
      durationOptimistic?: number;
      durationLikely?: number;
      durationPessimistic?: number;
    } & { comment?: string }
  ) {
    const role = await this.getUserRole(projectId, userId);
    
    // Retrieve original task
    const task = await this.prisma.task.findFirst({
      where: { id, projectId },
    });
    if (!task) {
      throw new NotFoundException('Tarefa não encontrada.');
    }

    // Mentor Rule: Can only update the comment field
    if (role === 'mentor') {
      const updatedTask = await this.prisma.task.update({
        where: { id },
        data: { comment: data.comment },
        include: {
          wbsItem: true,
        }
      });
      this.realtimeGateway.broadcastToProject(projectId, 'task.updated', updatedTask);
      return updatedTask;
    }

    // Role Rule: "membros podem editar apenas tasks onde who_owner_id é o próprio usuário (ou onde são area_lead da área)."
    if (role === 'member') {
      if (task.whoOwnerId !== userId) {
        throw new ForbiddenException('Acesso negado: Membros só podem editar tarefas sob sua própria responsabilidade.');
      }
    }

    if (data.wbsItemId) {
      const wbs = await this.prisma.wbsItem.findFirst({
        where: { id: data.wbsItemId, projectId },
      });
      if (!wbs) {
        throw new NotFoundException('EAP/WBS de destino não encontrada.');
      }
    }

    // Recalculate PERT if estimates exist or are updated
    const opt = data.durationOptimistic !== undefined ? data.durationOptimistic : task.durationOptimistic;
    const lk = data.durationLikely !== undefined ? data.durationLikely : task.durationLikely;
    const pes = data.durationPessimistic !== undefined ? data.durationPessimistic : task.durationPessimistic;

    let durationExpected: number | null = task.durationExpected;
    if (opt !== null && lk !== null && pes !== null) {
      durationExpected = (opt + 4 * lk + pes) / 6;
      durationExpected = Number(durationExpected.toFixed(2));
    }

    const updateData: any = {
      name: data.name,
      description: data.description,
      status: data.status,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      wbsItemId: data.wbsItemId !== undefined ? (data.wbsItemId === null ? null : data.wbsItemId) : undefined,
      what: data.what,
      why: data.why,
      where: data.where,
      whenDate: data.whenDate,
      whoOwnerId: data.whoOwnerId,
      how: data.how,
      howMuch: data.howMuch !== undefined ? Number(data.howMuch) : undefined,
      durationOptimistic: data.durationOptimistic !== undefined ? Number(data.durationOptimistic) : undefined,
      durationLikely: data.durationLikely !== undefined ? Number(data.durationLikely) : undefined,
      durationPessimistic: data.durationPessimistic !== undefined ? Number(data.durationPessimistic) : undefined,
      durationExpected: durationExpected !== undefined ? durationExpected : undefined,
      comment: data.comment,
    };

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        wbsItem: true,
      }
    });

    try {
      await this.calculateCriticalPath(projectId, userId);
    } catch (e) {
      console.error('Error calculating critical path:', e);
    }

    // Emit event for real-time synchronization
    this.realtimeGateway.broadcastToProject(projectId, 'task.updated', updatedTask);

    return updatedTask;
  }

  // Task Dependencies Endpoints (with Cycle Detection)
  async addTaskDependency(
    projectId: string,
    userId: string,
    taskId: string,
    data: { dependsOnTaskId: string; type?: string }
  ) {
    const role = await this.getUserRole(projectId, userId);

    // Successor task
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, projectId },
    });
    if (!task) {
      throw new NotFoundException('Tarefa dependente (sucessora) não encontrada.');
    }

    // Predecessor task
    const dependsOnTask = await this.prisma.task.findFirst({
      where: { id: data.dependsOnTaskId, projectId },
    });
    if (!dependsOnTask) {
      throw new NotFoundException('Tarefa pré-requisito (predecessora) não encontrada.');
    }

    if (taskId === data.dependsOnTaskId) {
      throw new BadRequestException('Uma tarefa não pode depender de si mesma.');
    }

    // Cycle Detection DFS
    const hasCycle = await this.detectCycle(taskId, data.dependsOnTaskId);
    if (hasCycle) {
      throw new BadRequestException('Não é possível criar esta dependência: detectado ciclo de precedência.');
    }

    // Create dependency
    const newDependency = await this.prisma.taskDependency.create({
      data: {
        taskId,
        dependsOnTaskId: data.dependsOnTaskId,
        type: data.type || 'FS',
      },
      include: {
        task: true,
        dependsOnTask: true,
      }
    });

    try {
      await this.calculateCriticalPath(projectId, userId);
    } catch (e) {
      console.error('Error calculating critical path:', e);
    }

    // Emit event for real-time synchronization
    this.realtimeGateway.broadcastToProject(projectId, 'task.dependency.changed', newDependency);

    return newDependency;
  }

  private async detectCycle(successorId: string, predecessorId: string): Promise<boolean> {
    const visited = new Set<string>();

    const dfs = async (currentId: string): Promise<boolean> => {
      // If we reachable successors can touch the successorId, a cycle exists
      if (currentId === successorId) {
        return true;
      }
      if (visited.has(currentId)) {
        return false;
      }
      visited.add(currentId);

      // Fetch all successors of current task (tasks that depend on CURRENT task)
      // i.e., taskId = successor, dependsOnTaskId = predecessor
      const subsequentDeps = await this.prisma.taskDependency.findMany({
        where: { dependsOnTaskId: currentId },
      });

      for (const dep of subsequentDeps) {
        if (await dfs(dep.taskId)) {
          return true;
        }
      }
      return false;
    };

    // Begin check starting from successorId as visitor, checking if predecessors can eventually connect back to it.
    // Or simpler: Does predecessor depends on successor already?
    return dfs(predecessorId);
  }

  // -----------------------------------------------------------------
  // CRITICAL PATH METHOD (CPM) & GANTT UTILITIES
  // -----------------------------------------------------------------

  private getTaskDuration(task: any): number {
    if (task.startDate && task.endDate) {
      const ms = new Date(task.endDate).getTime() - new Date(task.startDate).getTime();
      const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 1;
    }
    return task.durationExpected || 1;
  }

  async calculateCriticalPath(projectId: string, userId: string) {
    // 1. Ensure user is project member
    await this.getUserRole(projectId, userId);

    // 2. Fetch all tasks and dependencies for this project
    const tasks = await this.prisma.task.findMany({
      where: { projectId },
    });
    const dependencies = await this.prisma.taskDependency.findMany({
      where: {
        task: { projectId }
      }
    });

    if (tasks.length === 0) {
      return [];
    }

    // 3. Build adjacency lists
    const adj: Record<string, string[]> = {};
    const preds: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};

    tasks.forEach(t => {
      adj[t.id] = [];
      preds[t.id] = [];
      inDegree[t.id] = 0;
    });

    dependencies.forEach(dep => {
      if (adj[dep.dependsOnTaskId] && adj[dep.taskId]) {
        adj[dep.dependsOnTaskId].push(dep.taskId);
        preds[dep.taskId].push(dep.dependsOnTaskId);
        inDegree[dep.taskId]++;
      }
    });

    // 4. Topological Sort
    const queue: string[] = [];
    tasks.forEach(t => {
      if (inDegree[t.id] === 0) {
        queue.push(t.id);
      }
    });

    const topoOrder: string[] = [];
    const inDegreeCopy = { ...inDegree };
    while (queue.length > 0) {
      const u = queue.shift()!;
      topoOrder.push(u);
      (adj[u] || []).forEach(v => {
        inDegreeCopy[v]--;
        if (inDegreeCopy[v] === 0) {
          queue.push(v);
        }
      });
    }

    // Append any isolated or cyclic tasks safely
    if (topoOrder.length < tasks.length) {
      tasks.forEach(t => {
        if (!topoOrder.includes(t.id)) {
          topoOrder.push(t.id);
        }
      });
    }

    // 5. Forward Pass
    const earlyStart: Record<string, number> = {};
    const earlyFinish: Record<string, number> = {};

    topoOrder.forEach(id => {
      const task = tasks.find(t => t.id === id)!;
      const duration = this.getTaskDuration(task);

      let es = 0;
      (preds[id] || []).forEach(pId => {
        if (earlyFinish[pId] !== undefined) {
          es = Math.max(es, earlyFinish[pId]);
        }
      });
      earlyStart[id] = es;
      earlyFinish[id] = es + duration;
    });

    // 6. Backward Pass
    let maxEF = 0;
    tasks.forEach(t => {
      if ((earlyFinish[t.id] || 0) > maxEF) {
        maxEF = earlyFinish[t.id];
      }
    });

    const lateStart: Record<string, number> = {};
    const lateFinish: Record<string, number> = {};

    tasks.forEach(t => {
      lateFinish[t.id] = maxEF;
    });

    for (let i = topoOrder.length - 1; i >= 0; i--) {
      const id = topoOrder[i];
      const task = tasks.find(t => t.id === id)!;
      const duration = this.getTaskDuration(task);

      if ((adj[id] || []).length > 0) {
        let minLS = Infinity;
        adj[id].forEach(sId => {
          if (lateStart[sId] !== undefined) {
            minLS = Math.min(minLS, lateStart[sId]);
          }
        });
        if (minLS !== Infinity) {
          lateFinish[id] = minLS;
        }
      }
      lateStart[id] = lateFinish[id] - duration;
    }

    // 7. Calculate slack and persist in DB
    const updatedTasks = [];
    for (const task of tasks) {
      const es = earlyStart[task.id] || 0;
      const ls = lateStart[task.id] || 0;
      const totalFloat = Math.max(0, ls - es);
      const isCritical = totalFloat === 0;

      const updated = await this.prisma.task.update({
        where: { id: task.id },
        data: {
          isCritical,
          totalFloat,
        },
      });
      updatedTasks.push(updated);
    }

    return updatedTasks;
  }

  async getGanttPayload(projectId: string, userId: string) {
    await this.getUserRole(projectId, userId);

    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      include: {
        dependencies: true,
      },
      orderBy: { startDate: 'asc' },
    });

    return tasks.map(t => {
      const isMilestone = (t.startDate && t.endDate && t.startDate.getTime() === t.endDate.getTime()) ||
        t.name.toLowerCase().includes('milestone') ||
        t.name.toLowerCase().includes('marco:') ||
        (t.description && t.description.toLowerCase().includes('[milestone]'));

      let progress = 0;
      if (t.status === 'done' || t.status === 'completed' || t.status === 'Concluído') {
        progress = 100;
      } else if (t.status === 'in_progress' || t.status === 'Em Progresso' || t.status === 'Em Execução') {
        progress = 50;
      }

      return {
        id: t.id,
        name: t.name,
        start: t.startDate ? t.startDate.toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
        end: t.endDate ? t.endDate.toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
        progress,
        dependencies: t.dependencies.map(d => d.dependsOnTaskId),
        isCritical: t.isCritical || false,
        totalFloat: t.totalFloat !== null ? t.totalFloat : null,
        status: t.status,
        description: t.description || '',
        isMilestone: !!isMilestone,
      };
    });
  }
}

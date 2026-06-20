import { CronogramaService } from './cronograma.service';
import { PrismaService } from '../prisma/prisma.service';

// Mocking PrismaService for controlled e2e testing that runs instantly in sandbox environments
class MockPrismaService {
  private wbsItems: any[] = [];
  private tasks: any[] = [];
  private dependencies: any[] = [];
  private projectMembers: any[] = [];

  constructor() {
    // Seed standard E2E users and project roles
    this.projectMembers = [
      { id: 'm1', projectId: 'proj_1', userId: 'user_admin', role: 'admin' },
      { id: 'm2', projectId: 'proj_1', userId: 'user_lead', role: 'area_lead' },
      { id: 'm3', projectId: 'proj_1', userId: 'user_member_1', role: 'member' },
      { id: 'm4', projectId: 'proj_1', userId: 'user_member_2', role: 'member' },
    ];
  }

  // Project Members
  projectMember = {
    findUnique: async (args: any) => {
      const { projectId, userId } = args.where.projectId_userId;
      const found = this.projectMembers.find(
        (m) => m.projectId === projectId && m.userId === userId
      );
      return found || null;
    },
  };

  // WBS Items
  wbsItem = {
    findMany: async (args: any) => {
      return this.wbsItems.filter((i) => i.projectId === args.where.projectId);
    },
    findFirst: async (args: any) => {
      return this.wbsItems.find(
        (i) => i.id === args.where.id && i.projectId === args.where.projectId
      );
    },
    create: async (args: any) => {
      const newItem = {
        id: `wbs_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.wbsItems.push(newItem);
      return newItem;
    },
    update: async (args: any) => {
      const index = this.wbsItems.findIndex((i) => i.id === args.where.id);
      if (index === -1) return null;
      this.wbsItems[index] = {
        ...this.wbsItems[index],
        ...args.data,
        updatedAt: new Date(),
      };
      return this.wbsItems[index];
    },
  };

  // Tasks
  task = {
    findMany: async (args: any) => {
      const { projectId, whoOwnerId, status } = args.where;
      return this.tasks.filter((t) => {
        if (t.projectId !== projectId) return false;
        if (whoOwnerId && t.whoOwnerId !== whoOwnerId) return false;
        if (status && t.status !== status) return false;
        return true;
      });
    },
    findFirst: async (args: any) => {
      return this.tasks.find(
        (t) => t.id === args.where.id && t.projectId === args.where.projectId
      );
    },
    create: async (args: any) => {
      const newTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.tasks.push(newTask);
      return newTask;
    },
    update: async (args: any) => {
      const index = this.tasks.findIndex((t) => t.id === args.where.id);
      if (index === -1) return null;
      this.tasks[index] = {
        ...this.tasks[index],
        ...args.data,
        updatedAt: new Date(),
      };
      return this.tasks[index];
    },
  };

  // Task Dependencies
  taskDependency = {
    findMany: async (args: any) => {
      const { dependsOnTaskId, taskId } = args.where;
      return this.dependencies.filter((d) => {
        if (dependsOnTaskId && d.dependsOnTaskId !== dependsOnTaskId) return false;
        if (taskId && d.taskId !== taskId) return false;
        return true;
      });
    },
    create: async (args: any) => {
      const newDep = {
        id: `dep_${Date.now()}`,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.dependencies.push(newDep);
      return newDep;
    },
  };
}

async function runE2ETests() {
  console.log('--- INICIANDO TESTES E2E: MÓDULO CRONOGRAMA ---');
  let passed = 0;
  let failed = 0;

  const mockPrisma = new MockPrismaService() as any as PrismaService;
  const service = new CronogramaService(mockPrisma);

  const projectId = 'proj_1';

  // HELPER: ASSERT
  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  };

  const assertThrows = async (fn: () => Promise<any>, testName: string, expectedErrorPattern?: string) => {
    try {
      await fn();
      console.error(`❌ [FAIL] ${testName} (Should have thrown error)`);
      failed++;
    } catch (err: any) {
      const msg = err.message || '';
      if (expectedErrorPattern && !msg.toLowerCase().includes(expectedErrorPattern.toLowerCase())) {
        console.error(`❌ [FAIL] ${testName} (Expected error containing: "${expectedErrorPattern}", got: "${msg}")`);
        failed++;
      } else {
        console.log(`✅ [PASS] ${testName} (Threw correct error: "${msg}")`);
        passed++;
      }
    }
  };

  try {
    // 1. Test: hierarchy of WBS Items (Parent/Child creation)
    console.log('\n[CENÁRIO 1] Hierarquia de EAP / WBS (Parent/Child)');
    
    // Parent creation by admin
    const parentWbs = await service.createWbs(projectId, 'user_admin', {
      name: 'Gestão de Engenharia',
      code: '1.0',
      description: 'Nível macro da engenharia',
    });
    assert(parentWbs.name === 'Gestão de Engenharia', 'Admin cria item de EAP pai');

    // Child creation by area_lead
    const childWbs = await service.createWbs(projectId, 'user_lead', {
      name: 'Chassis & Aerodinâmica',
      code: '1.1',
      description: 'Desenvolvimento do monocoque',
      parentId: parentWbs.id,
    });
    assert(childWbs.parentId === parentWbs.id, 'Area Lead cria item de EAP filho apontando para o pai');

    // Unauthorized attempt to create WBS by basic member
    await assertThrows(
      () => service.createWbs(projectId, 'user_member_1', { name: 'Suspensão', code: '1.2' }),
      'Membro comum tenta criar item EAP (deve lançar Forbidden 403)',
      'apenas admin ou area_lead'
    );

    // 2. Test: Task creation linked to WBS
    console.log('\n[CENÁRIO 2] Criação de Tarefas Vinculadas');
    
    const task1 = await service.createTask(projectId, 'user_member_1', {
      name: 'Simulação CFD do aerofólio traseiro',
      description: 'Otimização dos coeficientes de sustentação e arrasto',
      status: 'todo',
      wbsItemId: childWbs.id, // linked task
      whoOwnerId: 'user_member_1',
      durationOptimistic: 2,
      durationLikely: 4,
      durationPessimistic: 12,
    });
    assert(task1.wbsItemId === childWbs.id, 'Tarefa pode ser vinculada com sucesso a item de EAP');
    assert(task1.durationExpected === 5, 'PERT expected duration calculated accurately: (2 + 4x4 + 12)/6 = 5');

    const task2 = await service.createTask(projectId, 'user_member_2', {
      name: 'Ensaios de tração em corpos de prova de alumínio',
      status: 'todo',
      whoOwnerId: 'user_member_2',
      durationOptimistic: 1,
      durationLikely: 2,
      durationPessimistic: 3,
    });
    assert(task2.wbsItemId === null, 'Tarefa sem WBS associado criada com sucesso');

    // 3. Test: Permissions (Membro tentando editar tarefa de outro)
    console.log('\n[CENÁRIO 3] Permissões de Edição de Tarefas');
    
    // Member edits own task successfully
    const updatedOwn = await service.updateTask(projectId, 'user_member_1', task1.id, {
      name: 'Simulação CFD Avançada traseira',
      status: 'in_progress',
    });
    assert(updatedOwn.name === 'Simulação CFD Avançada traseira', 'Membro edita com sucesso sua própria tarefa');

    // Member tries to edit task of another member
    await assertThrows(
      () => service.updateTask(projectId, 'user_member_1', task2.id, { name: 'Invasão ilegal' }),
      'Membro tenta editar a tarefa de outro usuário (deve lançar Forbidden 403)',
      'membros só podem editar tarefas sob sua própria responsabilidade'
    );

    // Area lead edits task owned by someone else successfully
    const leadUpdate = await service.updateTask(projectId, 'user_lead', task2.id, {
      status: 'done',
    });
    assert(leadUpdate.status === 'done', 'Area Lead pode editar tarefas de outras pessoas');

    // 4. Test: Task Dependencies and Cycle Detection
    console.log('\n[CENÁRIO 4] Dependência de Tarefas e Detecção de Ciclo');
    
    // Create direct dependency
    const dep1 = await service.addTaskDependency(projectId, 'user_member_1', task2.id, {
      dependsOnTaskId: task1.id,
    });
    assert(dep1.taskId === task2.id && dep1.dependsOnTaskId === task1.id, 'Cria dependência direta: Task 2 depende de Task 1');

    // Attempt to make Task 1 depend on Task 2 (Creates a cycle Task 1 -> Task 2 -> Task 1)
    await assertThrows(
      () => service.addTaskDependency(projectId, 'user_member_1', task1.id, { dependsOnTaskId: task2.id }),
      'Tentativa de criar ciclo direto (Task 1 depende de Task 2 que já depende de Task 1) - deve falhar',
      'detectado ciclo de precedência'
    );

    // Transitive Cycle detection: Task 3 depends on Task 2, Task 1 depends on Task 3
    const task3 = await service.createTask(projectId, 'user_member_1', {
      name: 'Fabricação do flap em fibra',
      status: 'todo',
      whoOwnerId: 'user_member_1',
    });

    await service.addTaskDependency(projectId, 'user_member_1', task3.id, {
      dependsOnTaskId: task2.id,
    });

    await assertThrows(
      () => service.addTaskDependency(projectId, 'user_member_1', task1.id, { dependsOnTaskId: task3.id }),
      'Tentativa de criar ciclo transitivo (Task 1 -> Task 2 -> Task 3 -> Task 1) - deve falhar',
      'detectado ciclo de precedência'
    );

    console.log(`\n--- RESUMO DOS TESTES ---`);
    console.log(`PASSOU: ${passed}`);
    console.log(`FALHOU: ${failed}`);

    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('🎉 TODOS OS TESTES PASSARAM COM EXCELÊNCIA!');
    }

  } catch (error) {
    console.error('Fatal crash during E2E integration test run:', error);
    process.exit(1);
  }
}

// Execute tests if called directly
runE2ETests();

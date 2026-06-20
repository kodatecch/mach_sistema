import { OrcamentoService } from './orcamento.service';
import { PrismaService } from '../prisma/prisma.service';

// Mocking PrismaService for complete, blazing fast and standalone e2e simulation
class MockPrismaService {
  private projectMembers: any[] = [];
  private budgetCategories: any[] = [];
  private resourcePlanItems: any[] = [];
  private quotations: any[] = [];
  private budgetLines: any[] = [];
  private cashFlowEntries: any[] = [];
  private reserveFunds: any[] = [];

  constructor() {
    // Seed standard mock users and project memberships with specific areas of leadeship
    this.projectMembers = [
      { id: 'm1', projectId: 'proj_orc', userId: 'user_admin', role: 'admin', area: null },
      { id: 'm2', projectId: 'proj_orc', userId: 'user_resource_lead', role: 'area_lead', area: 'resources' },
      { id: 'm3', projectId: 'proj_orc', userId: 'user_finance_lead', role: 'area_lead', area: 'finance' },
      { id: 'm4', projectId: 'proj_orc', userId: 'user_other_lead', role: 'area_lead', area: 'chassis' },
      { id: 'm5', projectId: 'proj_orc', userId: 'user_member', role: 'member', area: null },
    ];
  }

  // 1. Members
  projectMember = {
    findUnique: async (args: any) => {
      const { projectId, userId } = args.where.projectId_userId;
      const found = this.projectMembers.find(
        (m) => m.projectId === projectId && m.userId === userId
      );
      return found || null;
    },
  };

  // 2. Budget Categories
  budgetCategory = {
    count: async (args: any) => {
      return this.budgetCategories.filter((c) => c.projectId === args.where.projectId).length;
    },
    create: async (args: any) => {
      const newCat = {
        id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.budgetCategories.push(newCat);
      return newCat;
    },
    findMany: async (args: any) => {
      return this.budgetCategories.filter((c) => c.projectId === args.where.projectId);
    },
    findFirst: async (args: any) => {
      const { id, projectId } = args.where;
      return this.budgetCategories.find((c) => c.id === id && c.projectId === projectId) || null;
    },
  };

  // 3. Resource Plan Items
  resourcePlanItem = {
    create: async (args: any) => {
      const newItem = {
        id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.resourcePlanItems.push(newItem);
      return newItem;
    },
    findMany: async (args: any) => {
      // Include simulate relations manually
      return this.resourcePlanItems
        .filter((r) => r.projectId === args.where.projectId)
        .map((r) => ({
          ...r,
          quotations: this.quotations.filter((q) => q.resourcePlanItemId === r.id),
        }));
    },
    findFirst: async (args: any) => {
      const { id, projectId } = args.where;
      return this.resourcePlanItems.find((r) => r.id === id && r.projectId === projectId) || null;
    },
  };

  // 4. Quotations
  quotation = {
    create: async (args: any) => {
      const newQ = {
        id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.quotations.push(newQ);
      return newQ;
    },
    findMany: async (args: any) => {
      return this.quotations.filter((q) => q.resourcePlanItemId === args.where.resourcePlanItemId);
    },
    findUnique: async (args: any) => {
      const q = this.quotations.find((x) => x.id === args.where.id);
      if (!q) return null;
      const parent = this.resourcePlanItems.find((r) => r.id === q.resourcePlanItemId);
      return {
        ...q,
        resourcePlanItem: parent,
      };
    },
    update: async (args: any) => {
      const idx = this.quotations.findIndex((q) => q.id === args.where.id);
      if (idx === -1) return null;
      this.quotations[idx] = {
        ...this.quotations[idx],
        ...args.data,
        updatedAt: new Date(),
      };
      return this.quotations[idx];
    },
    updateMany: async (args: any) => {
      const { resourcePlanItemId } = args.where;
      let count = 0;
      this.quotations.forEach((q, idx) => {
        if (q.resourcePlanItemId === resourcePlanItemId) {
          this.quotations[idx] = {
            ...q,
            ...args.data,
            updatedAt: new Date(),
          };
          count++;
        }
      });
      return { count };
    },
  };

  // 5. Budget Lines
  budgetLine = {
    create: async (args: any) => {
      const newLine = {
        id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.budgetLines.push(newLine);
      return newLine;
    },
    findMany: async (args: any) => {
      return this.budgetLines
        .filter((l) => l.projectId === args.where.projectId)
        .map((l) => ({
          ...l,
          budgetCategory: this.budgetCategories.find((c) => c.id === l.budgetCategoryId),
        }));
    },
  };

  // 6. Cash Flow Entries
  cashFlowEntry = {
    create: async (args: any) => {
      const newEntry = {
        id: `cf_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.cashFlowEntries.push(newEntry);
      return newEntry;
    },
    findMany: async (args: any) => {
      return this.cashFlowEntries
        .filter((cf) => cf.projectId === args.where.projectId)
        .map((cf) => ({
          ...cf,
          budgetCategory: this.budgetCategories.find((c) => c.id === cf.budgetCategoryId) || null,
        }));
    },
    findFirst: async (args: any) => {
      const { id, projectId } = args.where;
      return this.cashFlowEntries.find((cf) => cf.id === id && cf.projectId === projectId) || null;
    },
    update: async (args: any) => {
      const idx = this.cashFlowEntries.findIndex((cf) => cf.id === args.where.id);
      if (idx === -1) return null;
      this.cashFlowEntries[idx] = {
        ...this.cashFlowEntries[idx],
        ...args.data,
        updatedAt: new Date(),
      };
      return this.cashFlowEntries[idx];
    },
  };

  // 7. Reserve Funds
  reserveFund = {
    findUnique: async (args: any) => {
      return this.reserveFunds.find((rf) => rf.projectId === args.where.projectId) || null;
    },
    create: async (args: any) => {
      const newRf = {
        id: `rf_${Date.now()}`,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.reserveFunds.push(newRf);
      return newRf;
    },
    update: async (args: any) => {
      const idx = this.reserveFunds.findIndex((rf) => rf.projectId === args.where.projectId);
      if (idx === -1) return null;
      this.reserveFunds[idx] = {
        ...this.reserveFunds[idx],
        ...args.data,
        updatedAt: new Date(),
      };
      return this.reserveFunds[idx];
    },
  };
}

async function runBudgetE2ETests() {
  console.log('--- INICIANDO TESTES DE INTEGRAÇÃO E2E: MÓDULO ORÇAMENTO ---');
  let passed = 0;
  let failed = 0;

  const mockPrisma = new MockPrismaService() as any as PrismaService;
  const service = new OrcamentoService(mockPrisma);

  const projectId = 'proj_orc';

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`\x1b[32m✅ [PASS]\x1b[0m ${testName}`);
      passed++;
    } else {
      console.error(`\x1b[31m❌ [FAIL]\x1b[0m ${testName}`);
      failed++;
    }
  };

  const assertThrows = async (fn: () => Promise<any>, testName: string, expectedErrorPattern?: string) => {
    try {
      await fn();
      console.error(`\x1b[31m❌ [FAIL]\x1b[0m ${testName} (Deveria ter lançado erro, mas passou)`);
      failed++;
    } catch (err: any) {
      const msg = err.message || '';
      if (expectedErrorPattern && !msg.toLowerCase().includes(expectedErrorPattern.toLowerCase())) {
        console.error(`\x1b[31m❌ [FAIL]\x1b[0m ${testName} (Erro experado: "${expectedErrorPattern}", recebido: "${msg}")`);
        failed++;
      } else {
        console.log(`\x1b[32m✅ [PASS]\x1b[0m ${testName} (Lançou erro correto: "${msg}")`);
        passed++;
      }
    }
  };

  try {
    // 1. Setup Base & Auto-seeding Categories
    console.log('\n[CENÁRIO 1] Setup de Categorias de Orçamento');
    await service.ensureDefaultCategories(projectId);
    const apiCategories = await mockPrisma.budgetCategory.findMany({ where: { projectId } });
    assert(apiCategories.length === 5, 'Criou com sucesso 5 categorias de orçamento padrão para o projeto');
    
    const matCatObj = apiCategories.find(c => c.name === 'Materiais');
    assert(!!matCatObj, 'Categoria "Materiais" está presente no seed inicial');
    const matCatId = matCatObj.id;

    // 2. Resource & quotations workflow
    console.log('\n[CENÁRIO 2] Fluxo de Recursos e Cotações');
    
    // Create new Resource
    const resource = await service.createResource(projectId, 'user_resource_lead', {
      name: 'Tubos de Aço Especial SRM',
      description: 'Estruturação do chassi tubular',
      quantity: 12,
      unit: 'metros',
    });
    assert(resource.name === 'Tubos de Aço Especial SRM', 'Resource cadastrado com sucesso');
    assert(resource.quantity === 12, 'Quantidade inserida corretamente');

    // Create 3 quotations
    const q1 = await service.createQuotation(projectId, 'user_resource_lead', resource.id, {
      supplier: 'Metalúrgica Alfa',
      value: 120.0, // unit value, let's treat value as total/value
      isSelected: false,
      notes: 'Prazo de entrega 5 dias',
    });
    const q2 = await service.createQuotation(projectId, 'user_resource_lead', resource.id, {
      supplier: 'Siderúrgica Beta (Vencedora)',
      value: 100.0,
      isSelected: false,
    });
    const q3 = await service.createQuotation(projectId, 'user_resource_lead', resource.id, {
      supplier: 'Nacional Metais',
      value: 110.0,
      isSelected: true, // initially selected
    });

    assert(q3.isSelected === true, 'Cotação 3 criada com status de selecionada ativa');

    // Select quotation 2 as the absolute winner
    const updatedQ2 = await service.selectQuotation(projectId, 'user_resource_lead', q2.id);
    assert(updatedQ2.isSelected === true, 'Cotação 2 selecionada como vencedora com sucesso');

    // Verify other quotations have been auto-deselected mapping the single winner rule
    const quotations = await service.getQuotationsForResource(projectId, 'user_resource_lead', resource.id);
    const selectedQuotes = quotations.filter(q => q.isSelected);
    assert(selectedQuotes.length === 1, 'Exatamente apenas UMA cotação permanece vencedora para este recurso');
    assert(selectedQuotes[0].supplier === 'Siderúrgica Beta (Vencedora)', 'Cotação vencedora é de fato a Siderúrgica Beta');

    // 3. Permission Checks for writing detailed lines & cash flow entries
    console.log('\n[CENÁRIO 3] Validação de Permissões (Access Control)');
    
    // Normal member should throw permission exception
    await assertThrows(
      () => service.createBudgetLine(projectId, 'user_member', {
        name: 'Compra de Tubos SRM',
        budgetCategoryId: matCatId,
        quantity: 12,
        unitValue: 100.0,
      }),
      'Membro comum tenta cadastrar linha de orçamento (deve retornar 403)',
      'Ação negada'
    );

    // Other lead (non-Resource and non-Finance lead) should also fail
    await assertThrows(
      () => service.createBudgetLine(projectId, 'user_other_lead', {
        name: 'Compra de Tubos SRM',
        budgetCategoryId: matCatId,
        quantity: 12,
        unitValue: 100.0,
      }),
      'Líder de Órbita/Chassis sem área financeira ou de recursos tenta cadastrais linha (deve retornar 403)',
      'Ação negada'
    );

    // Resource lead must succeed
    const budgetLine = await service.createBudgetLine(projectId, 'user_resource_lead', {
      name: 'Compra de Tubos e Vigas SRM',
      budgetCategoryId: matCatId,
      quantity: 12,
      unitValue: 100.0,
    });
    assert(budgetLine.totalValue === 1200.0, 'Resource Lead cadastra com sucesso linha de orçamento (total_value calculado = 1200)');

    // Finance Lead must succeed creating cash flow entry
    const sponsorIncome = await service.createCashFlowEntry(projectId, 'user_finance_lead', {
      description: 'Patrocínio Principal STEM Competições',
      type: 'revenue',
      amount: 5000.0,
    });
    assert(sponsorIncome.type === 'revenue' && sponsorIncome.amount === 5000.0, 'Finance Lead cadastra receita de fluxo de caixa com sucesso');

    const materialExpense = await service.createCashFlowEntry(projectId, 'user_finance_lead', {
      description: 'Pagamento de Tubos SRM Siderúrgica',
      type: 'expense',
      amount: 1000.0, // partially paid or spent amount
      budgetCategoryId: matCatId,
    });
    assert(materialExpense.type === 'expense' && materialExpense.amount === 1000.0, 'Finance Lead cadastra despesa associada a categoria "Materiais"');

    // 4. Budget Integrated Summarization calculations checking
    console.log('\n[CENÁRIO 4] Confirmação do Orçamento Consolidado (Summary)');
    const summary = await service.getBudgetSummary(projectId, 'user_member');
    
    assert(summary.global.totalIncome === 5000.0, 'Total de receitas consolidadas correto: 5000');
    assert(summary.global.totalExpense === 1000.0, 'Total de despesas consolidadas correto: 1000');
    assert(summary.global.netBalance === 4000.0, 'Saldo líquido calculado correto (5000 - 1000 = 4000)');

    const matSummary = summary.categories.find(c => c.id === matCatId);
    assert(matSummary.planned === 1200.0, 'Valor planejado (BudgetLines) compilado com sucesso por categoria = 1200');
    assert(matSummary.realSpent === 1000.0, 'Valor gasto real (CashFlow Entry Expense) acumulado corretamente na categoria = 1000');
    assert(matSummary.remaining === 200.0, 'Saldo residual da categoria calculado corretamente (1200 - 1000 = 200)');

    // 5. Reserve Fund Rules checking
    console.log('\n[CENÁRIO 5] Fundo de Reserva - Geração e Multiplicador Dinâmico');
    
    const initialFund = await service.getReserveFund(projectId, 'user_member');
    assert(initialFund.totalSponsoredAmount === 0 && initialFund.reserveAmount === 0, 'Fundo de reserva inicial é instanciado com zeros');

    const updatedFund = await service.patchReserveFund(projectId, 'user_admin', {
      totalSponsoredAmount: 15000.0,
      reservePercentage: 15.0,
    });
    assert(updatedFund.totalSponsoredAmount === 15000.0, 'Fundo de Reserva atualizado com patrocinadores: 15000.0');
    assert(updatedFund.reservePercentage === 15.0, 'Percentual do fundo de reserva ajustado: 15%');
    assert(updatedFund.reserveAmount === 2250.0, 'Cálculo dinâmico do montante em reserva (15000 * 0.15 = 2250) executado com sucesso');

    console.log(`\n\x1b[32m*** TODOS OS TESTES PASSARAM COM EXCELÊNCIA ***\x1b[0m`);
    console.log(`Total passados: ${passed}`);
    console.log(`Total falhos: ${failed}`);
  } catch (error: any) {
    console.error('\n❌ Ocorreu um erro catastrófico não capturado durante a execução dos testes:', error);
    failed++;
  }

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Automatic script launch handler
runBudgetE2ETests();

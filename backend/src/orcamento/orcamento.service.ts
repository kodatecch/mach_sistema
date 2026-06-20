import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class OrcamentoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  // Context & Role Helpers
  async getUserRoleAndMember(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });
    if (!member) {
      throw new ForbiddenException('Acesso negado: Você não é membro cadastrado deste projeto.');
    }
    return member;
  }

  // Permission Guard: Only Admins or "Resource Lead" (area_lead with area="resources" or "finance")
  async checkBudgetWritePermission(projectId: string, userId: string): Promise<void> {
    const member = await this.getUserRoleAndMember(projectId, userId);
    const role = member.role;
    const area = member.area?.toLowerCase();

    const isAdmin = role === 'admin';
    const isResourceLead = role === 'area_lead' && (area === 'resources' || area === 'finance');

    if (!isAdmin && !isResourceLead) {
      throw new ForbiddenException(
        'Ação negada: Apenas administradores ou líderes cadastrados de Recursos ou Finanças (Resource Lead) possuem permissão para criar/editar registros financeiros.',
      );
    }
  }

  // WBS / Default Categories Seed Helper
  async ensureDefaultCategories(projectId: string) {
    const counts = await this.prisma.budgetCategory.count({
      where: { projectId },
    });
    if (counts === 0) {
      const defaults = [
        { name: 'Materiais', description: 'Tubos, carenagem, insumos de solda' },
        { name: 'Usinagem', description: 'Processos de usinagem CNC e cortes a laser' },
        { name: 'Logística', description: 'Viagens, carretos, alimentação e inscrições' },
        { name: 'Ferramentas', description: 'Consumíveis e chaves especiais' },
        { name: 'Administrativo', description: 'Marketing, papelaria e licenças CAD' },
      ];
      for (const item of defaults) {
        await this.prisma.budgetCategory.create({
          data: { projectId, ...item },
        });
      }
    }
  }

  // 1. RESOURCES / RESOURCE PLAN ITEMS ENDPOINTS
  async getResources(projectId: string, userId: string) {
    await this.getUserRoleAndMember(projectId, userId);
    return this.prisma.resourcePlanItem.findMany({
      where: { projectId },
      include: {
        quotations: {
          orderBy: { value: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createResource(
    projectId: string,
    userId: string,
    data: { name: string; description?: string; quantity?: number; unit?: string },
  ) {
    await this.getUserRoleAndMember(projectId, userId);
    return this.prisma.resourcePlanItem.create({
      data: {
        projectId,
        name: data.name,
        description: data.description || null,
        quantity: data.quantity !== undefined ? data.quantity : 1,
        unit: data.unit || 'unit',
      },
      include: {
        quotations: true,
      },
    });
  }

  // 2. QUOTATIONS ENDPOINTS
  async getQuotationsForResource(projectId: string, userId: string, resourceId: string) {
    await this.getUserRoleAndMember(projectId, userId);
    const item = await this.prisma.resourcePlanItem.findFirst({
      where: { id: resourceId, projectId },
    });
    if (!item) {
      throw new NotFoundException('Recurso não encontrado.');
    }

    return this.prisma.quotation.findMany({
      where: { resourcePlanItemId: resourceId },
      orderBy: { value: 'asc' },
    });
  }

  async createQuotation(
    projectId: string,
    userId: string,
    resourceId: string,
    data: { supplier: string; value: number; isSelected?: boolean; notes?: string },
  ) {
    await this.getUserRoleAndMember(projectId, userId);
    const item = await this.prisma.resourcePlanItem.findFirst({
      where: { id: resourceId, projectId },
    });
    if (!item) {
      throw new NotFoundException('Recurso do plano de recursos não encontrado.');
    }

    const isSelected = !!data.isSelected;

    if (isSelected) {
      // Clear previous winner quotations for this resource first
      await this.prisma.quotation.updateMany({
        where: { resourcePlanItemId: resourceId },
        data: { isSelected: false },
      });
    }

    return this.prisma.quotation.create({
      data: {
        resourcePlanItemId: resourceId,
        supplier: data.supplier,
        value: Number(data.value),
        isSelected,
        notes: data.notes || null,
      },
    });
  }

  async selectQuotation(projectId: string, userId: string, quotationId: string) {
    await this.getUserRoleAndMember(projectId, userId);
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { resourcePlanItem: true },
    });

    if (!quotation) {
      throw new NotFoundException('Cotação não localizada.');
    }

    if (quotation.resourcePlanItem.projectId !== projectId) {
      throw new ForbiddenException('A cotação pertence a um recurso de outro projeto.');
    }

    // Reset selection for all other quotes belonging to this same plan item
    await this.prisma.quotation.updateMany({
      where: { resourcePlanItemId: quotation.resourcePlanItemId },
      data: { isSelected: false },
    });

    // Mark current one as selected winner!
    return this.prisma.quotation.update({
      where: { id: quotationId },
      data: { isSelected: true },
    });
  }

  // 3. BUDGET LINES (ORÇAMENTO DETALHADO)
  async getBudgetLines(projectId: string, userId: string) {
    await this.getUserRoleAndMember(projectId, userId);
    await this.ensureDefaultCategories(projectId);

    return this.prisma.budgetLine.findMany({
      where: { projectId },
      include: { budgetCategory: true },
      orderBy: { name: 'asc' },
    });
  }

  async createBudgetLine(
    projectId: string,
    userId: string,
    data: { name: string; budgetCategoryId: string; quantity?: number; unitValue: number },
  ) {
    await this.checkBudgetWritePermission(projectId, userId);

    const qty = data.quantity !== undefined ? Number(data.quantity) : 1;
    const unitPrice = Number(data.unitValue);
    const total = qty * unitPrice;

    // Check category exists
    const category = await this.prisma.budgetCategory.findFirst({
      where: { id: data.budgetCategoryId, projectId },
    });
    if (!category) {
      throw new NotFoundException('Categoria do orçamento não encontrada no projeto.');
    }

    return this.prisma.budgetLine.create({
      data: {
        projectId,
        budgetCategoryId: data.budgetCategoryId,
        name: data.name,
        quantity: qty,
        unitValue: unitPrice,
        totalValue: total,
      },
      include: {
        budgetCategory: true,
      },
    });
  }

  // 4. CASH FLOW (FLUCO DE CAIXA)
  async getCashFlowEntries(projectId: string, userId: string) {
    const member = await this.getUserRoleAndMember(projectId, userId);
    if (member.role === 'sponsor') {
      return [];
    }
    await this.ensureDefaultCategories(projectId);

    return this.prisma.cashFlowEntry.findMany({
      where: { projectId },
      include: { budgetCategory: true },
      orderBy: { date: 'desc' },
    });
  }

  async createCashFlowEntry(
    projectId: string,
    userId: string,
    data: {
      description: string;
      type: string; // "revenue" | "expense"
      amount: number;
      budgetCategoryId?: string;
      isReconciled?: boolean;
      date?: string | Date;
    },
  ) {
    await this.checkBudgetWritePermission(projectId, userId);

    const typeNormalized = data.type?.trim().toLowerCase();
    if (typeNormalized !== 'expense' && typeNormalized !== 'revenue') {
      throw new BadRequestException('Tipo inválido: use "expense" ou "revenue" (receita).');
    }

    if (data.budgetCategoryId) {
      const category = await this.prisma.budgetCategory.findFirst({
        where: { id: data.budgetCategoryId, projectId },
      });
      if (!category) {
        throw new NotFoundException('Categoria especificada não encontrada no projeto.');
      }
    }

    let parsedDate = new Date();
    if (data.date) {
      const d = new Date(data.date);
      if (!isNaN(d.getTime())) {
        parsedDate = d;
      }
    }

    const newEntry = await this.prisma.cashFlowEntry.create({
      data: {
        projectId,
        budgetCategoryId: data.budgetCategoryId || null,
        description: data.description,
        type: typeNormalized,
        amount: Number(data.amount),
        isReconciled: !!data.isReconciled,
        date: parsedDate,
      },
      include: {
        budgetCategory: true,
      },
    });

    // Emit event for real-time synchronization
    this.realtimeGateway.broadcastToProject(projectId, 'cashflow.entry.created', newEntry);

    return newEntry;
  }

  async reconcileCashFlowEntry(projectId: string, userId: string, id: string) {
    await this.checkBudgetWritePermission(projectId, userId);

    const entry = await this.prisma.cashFlowEntry.findFirst({
      where: { id, projectId },
    });
    if (!entry) {
      throw new NotFoundException('Lançamento de fluxo de caixa não encontrado.');
    }

    return this.prisma.cashFlowEntry.update({
      where: { id },
      data: { isReconciled: true },
    });
  }

  // 5. RESERVE FUND (FUNDO DE RESERVA)
  async getReserveFund(projectId: string, userId: string) {
    await this.getUserRoleAndMember(projectId, userId);

    let fund = await this.prisma.reserveFund.findUnique({
      where: { projectId },
    });

    if (!fund) {
      fund = await this.prisma.reserveFund.create({
        data: {
          projectId,
          totalSponsoredAmount: 0,
          reservePercentage: 10,
          reserveAmount: 0,
        },
      });
    }
    return fund;
  }

  async patchReserveFund(
    projectId: string,
    userId: string,
    data: { totalSponsoredAmount?: number; reservePercentage?: number },
  ) {
    await this.getUserRoleAndMember(projectId, userId);

    let fund = await this.prisma.reserveFund.findUnique({
      where: { projectId },
    });

    const isNew = !fund;
    const currentPercent = data.reservePercentage !== undefined ? Number(data.reservePercentage) : fund ? fund.reservePercentage : 10.0;
    const currentSponsored = data.totalSponsoredAmount !== undefined ? Number(data.totalSponsoredAmount) : fund ? fund.totalSponsoredAmount : 0.0;

    // Calculate reserve_amount = sponsored * percent
    const calculatedReserve = parseFloat((currentSponsored * (currentPercent / 100)).toFixed(2));

    if (isNew) {
      return this.prisma.reserveFund.create({
        data: {
          projectId,
          totalSponsoredAmount: currentSponsored,
          reservePercentage: currentPercent,
          reserveAmount: calculatedReserve,
        },
      });
    } else {
      return this.prisma.reserveFund.update({
        where: { projectId },
        data: {
          totalSponsoredAmount: currentSponsored,
          reservePercentage: currentPercent,
          reserveAmount: calculatedReserve,
        },
      });
    }
  }

  // 6. BUDGET INTEGRATED SUMMARY
  async getBudgetSummary(projectId: string, userId: string) {
    await this.getUserRoleAndMember(projectId, userId);
    await this.ensureDefaultCategories(projectId);

    // Get categories for project
    const categories = await this.prisma.budgetCategory.findMany({
      where: { projectId },
    });

    // Get lines and cash flow expenses/revenues to compute totals
    const budgetLines = await this.prisma.budgetLine.findMany({
      where: { projectId },
    });

    const cashFlowEntries = await this.prisma.cashFlowEntry.findMany({
      where: { projectId },
    });

    // Map categories with planning & performance data
    const categorySummaries = categories.map((cat) => {
      // Planned sum: totalValue in budget_lines linked to category
      const plannedSum = budgetLines
        .filter((line) => line.budgetCategoryId === cat.id)
        .reduce((sum, line) => sum + line.totalValue, 0);

      // Real spent sum: cashFlows where type === 'expense'
      const realSpentSum = cashFlowEntries
        .filter((entry) => entry.budgetCategoryId === cat.id && entry.type === 'expense')
        .reduce((sum, entry) => sum + entry.amount, 0);

      return {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        planned: plannedSum,
        realSpent: realSpentSum,
        remaining: parseFloat((plannedSum - realSpentSum).toFixed(2)),
      };
    });

    // Global financials: income vs expenses
    const totalIncome = cashFlowEntries
      .filter((entry) => entry.type === 'revenue')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const totalExpense = cashFlowEntries
      .filter((entry) => entry.type === 'expense')
      .reduce((sum, entry) => sum + entry.amount, 0);

    return {
      categories: categorySummaries,
      global: {
        totalIncome,
        totalExpense,
        netBalance: parseFloat((totalIncome - totalExpense).toFixed(2)),
      },
    };
  }
}

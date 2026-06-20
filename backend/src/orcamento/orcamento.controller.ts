import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrcamentoService } from './orcamento.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { CheckPermissions } from '../auth/permissions.decorator';
import { ProjectRequest } from '../project/project-context.middleware';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrcamentoController {
  constructor(private readonly orcamentoService: OrcamentoService) {}

  // 1. RESOURCES (Itens do Plano de Recursos)
  @Get('resources')
  async getResources(@Req() req: ProjectRequest) {
    return this.orcamentoService.getResources(req.projectId, req.user.userId);
  }

  @Post('resources')
  @CheckPermissions('create', 'budget')
  async createResource(
    @Req() req: ProjectRequest,
    @Body() body: { name: string; description?: string; quantity?: number; unit?: string }
  ) {
    return this.orcamentoService.createResource(req.projectId, req.user.userId, body);
  }

  // 2. QUOTATIONS (Cotações para Recursos Específicos)
  @Get('resources/:id/quotations')
  async getQuotationsForResource(
    @Req() req: ProjectRequest,
    @Param('id') id: string
  ) {
    return this.orcamentoService.getQuotationsForResource(req.projectId, req.user.userId, id);
  }

  @Post('resources/:id/quotations')
  @CheckPermissions('create', 'budget')
  async createQuotation(
    @Req() req: ProjectRequest,
    @Param('id') id: string,
    @Body() body: { supplier: string; value: number; isSelected?: boolean; notes?: string }
  ) {
    return this.orcamentoService.createQuotation(req.projectId, req.user.userId, id, body);
  }

  @Patch('quotations/:id/select')
  @CheckPermissions('update', 'budget')
  async selectQuotation(
    @Req() req: ProjectRequest,
    @Param('id') id: string
  ) {
    return this.orcamentoService.selectQuotation(req.projectId, req.user.userId, id);
  }

  // 3. BUDGET LINES (Linhas de Orçamento Detalhado)
  @Get('budget-lines')
  async getBudgetLines(@Req() req: ProjectRequest) {
    return this.orcamentoService.getBudgetLines(req.projectId, req.user.userId);
  }

  @Post('budget-lines')
  @CheckPermissions('create', 'budget')
  async createBudgetLine(
    @Req() req: ProjectRequest,
    @Body() body: { name: string; budgetCategoryId: string; quantity?: number; unitValue: number }
  ) {
    return this.orcamentoService.createBudgetLine(req.projectId, req.user.userId, body);
  }

  // 4. CASH FLOW (Fluxo de Caixa)
  @Get('cash-flow')
  async getCashFlowEntries(@Req() req: ProjectRequest) {
    return this.orcamentoService.getCashFlowEntries(req.projectId, req.user.userId);
  }

  @Post('cash-flow')
  @CheckPermissions('create', 'budget')
  async createCashFlowEntry(
    @Req() req: ProjectRequest,
    @Body() body: {
      description: string;
      type: string; // "revenue" | "expense"
      amount: number;
      budgetCategoryId?: string;
      isReconciled?: boolean;
      date?: string;
    }
  ) {
    return this.orcamentoService.createCashFlowEntry(req.projectId, req.user.userId, body);
  }

  @Patch('cash-flow/:id/reconcile')
  @CheckPermissions('update', 'budget')
  async reconcileCashFlowEntry(
    @Req() req: ProjectRequest,
    @Param('id') id: string
  ) {
    return this.orcamentoService.reconcileCashFlowEntry(req.projectId, req.user.userId, id);
  }

  // 5. RESERVE FUND (Fundo de Reserva)
  @Get('reserve-fund')
  async getReserveFund(@Req() req: ProjectRequest) {
    return this.orcamentoService.getReserveFund(req.projectId, req.user.userId);
  }

  @Patch('reserve-fund')
  @CheckPermissions('update', 'budget')
  async patchReserveFund(
    @Req() req: ProjectRequest,
    @Body() body: { totalSponsoredAmount?: number; reservePercentage?: number }
  ) {
    return this.orcamentoService.patchReserveFund(req.projectId, req.user.userId, body);
  }

  // 6. BUDGET INTEGRATED SUMMARY (Apreciação Sintética / Consolidada)
  @Get('budget/summary')
  async getBudgetSummary(@Req() req: ProjectRequest) {
    return this.orcamentoService.getBudgetSummary(req.projectId, req.user.userId);
  }
}

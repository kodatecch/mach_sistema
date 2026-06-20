import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as cron from 'node-cron';

@Injectable()
export class EvmService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // Scheduled Job (node-cron) running daily at midnight to capture automatic snapshots for all projects
    cron.schedule('0 0 * * *', async () => {
      console.log('[EVM Daily Job] Iniciando criação manual de snapshots automáticos para todos os projetos...');
      await this.runDailySnapshots();
    });
    console.log('[EVM Service] Job diário agendado com sucesso (meia-noite).');
  }

  // Forceable manual trigger of daily job for all projects (useful for development/testing)
  async runDailySnapshots() {
    const projects = await this.prisma.project.findMany();
    const today = this.normalizeDate(new Date());
    console.log(`[EVM Job] Executando snapshots automáticos para ${projects.length} projetos em: ${today.toISOString()}`);
    
    for (const project of projects) {
      try {
        await this.recalculateSnapshot(project.id, today);
        console.log(`[EVM Job] Snapshot gerado com sucesso para o projeto ID: ${project.id}`);
      } catch (err) {
        console.error(`[EVM Job] Erro ao gerar snapshot para o projeto ${project.id}:`, err);
      }
    }
  }

  private normalizeDate(d: Date): Date {
    // Normalize to midnight UTC so daily snapshots are unique per project
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  }

  private getPercentComplete(status: string): number {
    if (!status) return 0;
    const s = status.toLowerCase().trim();
    if (s === 'done' || s === 'completed' || s.startsWith('conclu') || s === 'pronto') {
      return 100;
    }
    if (s.startsWith('revis') || s.startsWith('refor') || s.startsWith('refac')) {
      return 85;
    }
    if (s === 'in_progress' || s.startsWith('em progresso') || s.startsWith('em exec') || s === 'executando' || s === 'desenvolvimento') {
      return 50;
    }
    return 0;
  }

  // 1. Core math layer for PV, EV and AC at a given date 't'
  async calculateMetrics(projectId: string, t: Date) {
    const tTime = t.getTime();

    // Fetch all project tasks
    const tasks = await this.prisma.task.findMany({
      where: { projectId },
    });

    // Fetch all project expenses
    const cashFlowEntries = await this.prisma.cashFlowEntry.findMany({
      where: {
        projectId,
        type: 'expense',
      },
    });

    let pv = 0;
    let ev = 0;
    
    // Total project budget (BAC - Budget at Completion) - Sum of how_much of all tasks
    let bac = 0;

    for (const task of tasks) {
      const howMuch = task.howMuch || 0;
      bac += howMuch;

      // PV(t) = sum of tasks.how_much for tasks whose planned_end <= t (task.endDate)
      if (task.endDate) {
        const plannedEnd = new Date(task.endDate).getTime();
        if (plannedEnd <= tTime) {
          pv += howMuch;
        }
      } else {
        // If no planned_end, default to counting it towards PV as it's unconstrained,
        // but typically standard task has date. Let's keep it safe.
      }

      // EV(t) = sum of tasks.how_much * (percent_complete/100) for all tasks at date t
      const percentComplete = this.getPercentComplete(task.status);
      ev += howMuch * (percentComplete / 100);
    }

    // AC(t) = sum of cash_flow_entries.amount (type='expense') with entry_date <= t (entry.date)
    let ac = 0;
    for (const entry of cashFlowEntries) {
      if (entry.date) {
        const entryDate = new Date(entry.date).getTime();
        if (entryDate <= tTime) {
          ac += entry.amount || 0;
        }
      }
    }

    // CPI = EV / AC (safeguarded against division by zero)
    const cpi = ac > 0 ? ev / ac : 1.0;

    // SPI = EV / PV (safeguarded against division by zero)
    const spi = pv > 0 ? ev / pv : 1.0;

    return {
      pv: Number(pv.toFixed(2)),
      ev: Number(ev.toFixed(2)),
      ac: Number(ac.toFixed(2)),
      cpi: Number(cpi.toFixed(3)),
      spi: Number(spi.toFixed(3)),
      bac: Number(bac.toFixed(2)),
    };
  }

  // 2. Fetch or calculate snapshot closest to a date
  async getSnapshotClosestToDate(projectId: string, targetDate: Date) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Projeto não encontrado.');
    }

    const normalizedTarget = this.normalizeDate(targetDate);

    // Try finding exact match
    let snapshot = await this.prisma.evmSnapshot.findUnique({
      where: {
        projectId_snapshotDate: {
          projectId,
          snapshotDate: normalizedTarget,
        },
      },
    });

    if (snapshot) {
      return snapshot;
    }

    // If exact date doesn't exist, search the DB for any snapshots
    const allSnaps = await this.prisma.evmSnapshot.findMany({
      where: { projectId },
      orderBy: { snapshotDate: 'asc' },
    });

    if (allSnaps.length > 0) {
      // Find the one closest to targetDate
      let closest = allSnaps[0];
      let minDiff = Math.abs(closest.snapshotDate.getTime() - targetDate.getTime());
      
      for (const snap of allSnaps) {
        const diff = Math.abs(snap.snapshotDate.getTime() - targetDate.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closest = snap;
        }
      }
      return closest;
    }

    // If none exists, calculate on-the-fly, save/cache it, and return
    return this.recalculateSnapshot(projectId, normalizedTarget);
  }

  // 3. Force calculation of a snapshot for today or any specific date and persist it
  async recalculateSnapshot(projectId: string, date: Date) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Projeto não encontrado.');
    }

    const normalizedDate = this.normalizeDate(date);
    const metrics = await this.calculateMetrics(projectId, normalizedDate);

    const snapshot = await this.prisma.evmSnapshot.upsert({
      where: {
        projectId_snapshotDate: {
          projectId,
          snapshotDate: normalizedDate,
        },
      },
      update: {
        pv: metrics.pv,
        ev: metrics.ev,
        ac: metrics.ac,
        cpi: metrics.cpi,
        spi: metrics.spi,
      },
      create: {
        projectId,
        snapshotDate: normalizedDate,
        pv: metrics.pv,
        ev: metrics.ev,
        ac: metrics.ac,
        cpi: metrics.cpi,
        spi: metrics.spi,
      },
    });

    return snapshot;
  }

  // 4. Retrieve historical snapshots series for S-Curve visualization
  async getSeries(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Projeto não encontrado.');
    }

    // Get all existing snapshots from DB
    let snapshots = await this.prisma.evmSnapshot.findMany({
      where: { projectId },
      orderBy: { snapshotDate: 'asc' },
    });

    // If snapshots database are empty, pre-populate last 15 days or days since project start to make sure there's data
    if (snapshots.length === 0) {
      console.log(`[EVM Service] Gerando série de simulação histórica inicial para o projeto: ${projectId}`);
      const today = new Date();
      
      // We will generate the last 15 days of snapshots dynamically so that the S-Curve starts populated with real task metrics
      for (let i = 14; i >= 0; i--) {
        const targetDate = new Date();
        targetDate.setDate(today.getDate() - i);
        try {
          await this.recalculateSnapshot(projectId, targetDate);
        } catch (e) {
          // Ignore projects mismatch errors
        }
      }

      // Re-fetch snapshots
      snapshots = await this.prisma.evmSnapshot.findMany({
        where: { projectId },
        orderBy: { snapshotDate: 'asc' },
      });
    }

    // Return list mapped with BAC so front-end has easy access to Estimate at Completion projections
    const tasks = await this.prisma.task.findMany({ where: { projectId } });
    const bac = tasks.reduce((sum, t) => sum + (t.howMuch || 0), 0);

    return snapshots.map(s => {
      // Estimate at completion: EAC = BAC / CPI
      const eac = s.cpi > 0 ? bac / s.cpi : bac;
      return {
        ...s,
        bac,
        eac: Number(eac.toFixed(2)),
      };
    });
  }
}

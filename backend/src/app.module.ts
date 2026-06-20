import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ProjectModule as RealProjectModule } from './project/project.module';
import { ProjectContextMiddleware } from './project/project-context.middleware';
import { PrismaModule } from './prisma/prisma.module';
import { CronogramaModule } from './cronograma/cronograma.module';
import { OrcamentoModule } from './orcamento/orcamento.module';
import { StakeholdersModule } from './stakeholders/stakeholders.module';
import { RisksModule } from './risks/risks.module';
import { EvmModule } from './evm/evm.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [PrismaModule, AuthModule, RealProjectModule, CronogramaModule, OrcamentoModule, StakeholdersModule, RisksModule, EvmModule, RealtimeModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Mount Project context middleware to projects, wbs, tasks list and budget routes.
    // This applies automatic project_id filtering and authorization check.
    consumer
      .apply(ProjectContextMiddleware)
      .exclude(
        { path: 'projects/my-projects', method: RequestMethod.GET },
        { path: 'auth/(.*)', method: RequestMethod.POST }
      )
      .forRoutes(
        'projects', 'wbs', 'tasks', 'resources', 'quotations', 'budget-lines', 
        'cash-flow', 'reserve-fund', 'budget', 'stakeholders', 'communication-matrix', 'communication-log',
        'risks', 'status-reports', 'scope-changes', 'evm'
      );
  }
}

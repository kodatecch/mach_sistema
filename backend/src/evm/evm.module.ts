import { Module } from '@nestjs/common';
import { EvmService } from './evm.service';
import { EvmController } from './evm.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [EvmService],
  controllers: [EvmController],
  exports: [EvmService],
})
export class EvmModule {}

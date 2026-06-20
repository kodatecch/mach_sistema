import { Module } from '@nestjs/common';
import { CronogramaController } from './cronograma.controller';
import { CronogramaService } from './cronograma.service';

@Module({
  controllers: [CronogramaController],
  providers: [CronogramaService],
  exports: [CronogramaService],
})
export class CronogramaModule {}

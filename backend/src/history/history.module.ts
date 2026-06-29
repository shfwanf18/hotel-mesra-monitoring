import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PingHistoryEntity } from '../database/entities/ping-history.entity';
import { DeviceEventEntity } from '../database/entities/device-event.entity';
import { UptimeDailySummaryEntity } from '../database/entities/uptime-daily-summary.entity';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PingHistoryEntity,
      DeviceEventEntity,
      UptimeDailySummaryEntity,
    ])
  ],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}

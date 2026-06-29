import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PingService } from './monitoring/ping.service';
import { SchedulerService } from './monitoring/scheduler.service';
import { AlertModule } from './alert/alert.module';
import { MonitoringGateway } from './monitoring/monitoring.gateway';

import { DeviceEntity } from './database/entities/device.entity';
import { PingHistoryEntity } from './database/entities/ping-history.entity';
import { DeviceEventEntity } from './database/entities/device-event.entity';
import { UptimeDailySummaryEntity } from './database/entities/uptime-daily-summary.entity';
import { AppSettingsEntity } from './database/entities/app-settings.entity';
import { DeviceModule } from './device/device.module';
import { HistoryModule } from './history/history.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: ['.env', '../.env']
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'wawan'),
        database: config.get<string>('DB_DATABASE', 'mesra_monitoring'),
        entities: [
          DeviceEntity,
          PingHistoryEntity,
          DeviceEventEntity,
          UptimeDailySummaryEntity,
          AppSettingsEntity,
        ],
        synchronize: true,
        logging: false,
      }),
    }),
    // Feature modules — each exports their Service for cross-module use
    AlertModule,
    DeviceModule,
    HistoryModule,
    SettingsModule,
  ],
  controllers: [AppController],
  // SchedulerService needs DeviceService, HistoryService, SettingsService
  // They are resolved because DeviceModule, HistoryModule, SettingsModule export them.
  providers: [AppService, PingService, SchedulerService, MonitoringGateway],
})
export class AppModule {}
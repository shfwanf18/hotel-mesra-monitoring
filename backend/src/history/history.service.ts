import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { PingHistoryEntity } from '../database/entities/ping-history.entity';
import { DeviceEventEntity } from '../database/entities/device-event.entity';
import { UptimeDailySummaryEntity } from '../database/entities/uptime-daily-summary.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(
    @InjectRepository(PingHistoryEntity)
    private pingRepo: Repository<PingHistoryEntity>,
    @InjectRepository(DeviceEventEntity)
    private eventRepo: Repository<DeviceEventEntity>,
    @InjectRepository(UptimeDailySummaryEntity)
    private uptimeRepo: Repository<UptimeDailySummaryEntity>,
  ) {}

  async savePingResult(deviceId: string, alive: boolean, latencyMs: number | null) {
    const ping = this.pingRepo.create({ deviceId, alive, latencyMs });
    await this.pingRepo.save(ping);
  }

  async saveEvent(deviceId: string, deviceName: string, type: string, message: string) {
    const event = this.eventRepo.create({ deviceId, deviceName, type, message });
    await this.eventRepo.save(event);
  }

  async getRecentEvents(limit = 50) {
    return this.eventRepo.find({
      order: { occurredAt: 'DESC' },
      take: limit,
    });
  }

  async getEventsByDevice(deviceId: string, limit = 50) {
    return this.eventRepo.find({
      where: { deviceId },
      order: { occurredAt: 'DESC' },
      take: limit,
    });
  }

  async clearAllEvents() {
    await this.eventRepo.clear();
  }

  async deleteEvent(id: string) {
    await this.eventRepo.delete(id);
  }

  async getPingHistory(deviceId: string, hours = 24) {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const history = await this.pingRepo.find({
      where: { deviceId, checkedAt: MoreThan(since) },
      order: { checkedAt: 'ASC' },
      select: { latencyMs: true, checkedAt: true, alive: true },
    });

    return history.map(h => h.latencyMs || 0); // Format for frontend sparkline
  }

  async updateDailySummary(deviceId: string, alive: boolean, latencyMs: number | null) {
    const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    let summary = await this.uptimeRepo.findOne({
      where: { deviceId, summaryDate: dateStr }
    });

    if (!summary) {
      summary = this.uptimeRepo.create({
        deviceId,
        summaryDate: dateStr,
        totalChecks: 0,
        upChecks: 0,
        avgLatency: 0,
      });
    }

    summary.totalChecks += 1;
    if (alive) {
      summary.upChecks += 1;
      if (latencyMs !== null) {
        if (!summary.avgLatency) {
          summary.avgLatency = latencyMs;
        } else {
          // Moving average simplified
          summary.avgLatency = ((summary.avgLatency * (summary.upChecks - 1)) + latencyMs) / summary.upChecks;
        }
      }
    }

    await this.uptimeRepo.save(summary);
  }

  async getUptimeStats(deviceId: string) {
    const today = new Date();
    const date30d = new Date(); date30d.setDate(today.getDate() - 30);
    const date1y = new Date(); date1y.setFullYear(today.getFullYear() - 1);

    const summaries30d = await this.uptimeRepo.find({
      where: { deviceId, summaryDate: MoreThan(date30d.toISOString().split('T')[0]) }
    });

    const summaries1y = await this.uptimeRepo.find({
      where: { deviceId, summaryDate: MoreThan(date1y.toISOString().split('T')[0]) }
    });

    const calcUptime = (summaries: UptimeDailySummaryEntity[]) => {
      if (summaries.length === 0) return 0;
      let total = 0; let up = 0;
      for (const s of summaries) {
        total += s.totalChecks;
        up += s.upChecks;
      }
      if (total === 0) return 0;
      return Number(((up / total) * 100).toFixed(2));
    };

    return {
      historicalUptime30d: calcUptime(summaries30d),
      historicalUptime1y: calcUptime(summaries1y),
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldData() {
    this.logger.log('Running daily cleanup of old ping and event history...');
    
    const date30d = new Date(); date30d.setDate(date30d.getDate() - 30);
    await this.pingRepo.delete({ checkedAt: LessThan(date30d) });

    const date1y = new Date(); date1y.setFullYear(date1y.getFullYear() - 1);
    await this.eventRepo.delete({ occurredAt: LessThan(date1y) });

    this.logger.log('Cleanup completed.');
  }
}

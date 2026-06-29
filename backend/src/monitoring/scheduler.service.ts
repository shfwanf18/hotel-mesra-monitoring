import { Injectable, OnModuleInit, Logger, OnModuleDestroy } from '@nestjs/common';
import { PingService } from './ping.service';
import { MailService } from '../alert/mail.service';
import { TelegramService } from '../alert/telegram.service';
import { MonitoringGateway } from './monitoring.gateway';
import { DeviceService } from '../device/device.service';
import { HistoryService } from '../history/history.service';
import { SettingsService } from '../settings/settings.service';
import { Subscription } from 'rxjs';

interface TargetState {
  failCount: number;
  isDown: boolean;
}

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerService.name);
  private targetStates: Record<string, TargetState> = {};
  private intervalTimer: NodeJS.Timeout | null = null;
  private settingsSub: Subscription | null = null;

  constructor(
    private pingService: PingService,
    private mailService: MailService,
    private telegramService: TelegramService,
    private monitoringGateway: MonitoringGateway,
    private deviceService: DeviceService,
    private historyService: HistoryService,
    private settingsService: SettingsService,
  ) {}

  async onModuleInit() {
    this.startInterval();
    this.settingsSub = this.settingsService.settingsUpdated$.subscribe(() => {
      this.startInterval();
    });
  }

  onModuleDestroy() {
    this.stopInterval();
    if (this.settingsSub) {
      this.settingsSub.unsubscribe();
    }
  }

  async startInterval() {
    this.stopInterval();
    const intervalMs = await this.settingsService.getPingIntervalMs();
    this.logger.log(`Starting monitoring scheduler. Interval: ${intervalMs}ms`);
    
    // Execute immediately once
    this.handleCheck();
    
    this.intervalTimer = setInterval(() => {
      this.handleCheck();
    }, intervalMs);
  }

  stopInterval() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  private async createAndEmitEvent(deviceId: string, deviceName: string, type: string, message: string) {
    await this.historyService.saveEvent(deviceId, deviceName, type, message);
    const recent = await this.historyService.getRecentEvents(1);
    if (recent[0] && recent[0].type === type) {
      this.monitoringGateway.emitEvent({
        id: recent[0].id,
        deviceId: recent[0].deviceId,
        deviceName: recent[0].deviceName,
        type: recent[0].type,
        timestamp: recent[0].occurredAt?.toISOString?.() ?? new Date().toISOString(),
        message: recent[0].message,
      });
    }
  }

  async handleCheck() {
    try {
      const devices = await this.deviceService.findAll();
      const thresholdSetting = await this.settingsService.get('fail_threshold');
      const emailEnabledSetting = await this.settingsService.get('email_alerts_enabled');
      const teleEnabledSetting = await this.settingsService.get('telegram_alerts_enabled');
      const teleChatId = await this.settingsService.get('telegram_chat_id');
      
      const threshold = parseInt(thresholdSetting || '3', 10);
      const emailEnabled = emailEnabledSetting === 'true';
      const teleEnabled = teleEnabledSetting === 'true';

      for (const device of devices) {
        if (!this.targetStates[device.id]) {
          this.targetStates[device.id] = { failCount: 0, isDown: false };
        }

        const state = this.targetStates[device.id];
        const result = await this.pingService.checkHost(device.ip);

        const latency = (result.time && result.time !== 'unknown' as any) ? Number(result.time) : null;
        // Save ping result to history
        await this.historyService.savePingResult(device.id, result.alive, latency);
        await this.historyService.updateDailySummary(device.id, result.alive, latency);

        // Emit realtime update to frontend
        this.monitoringGateway.emitPingResult({
          id: device.id,
          alive: result.alive,
          time: result.time,
          timestamp: new Date().toISOString(),
        });

        if (!result.alive) {
          state.failCount++;

          if (state.failCount >= threshold && !state.isDown) {
            this.logger.warn(`[ALERT] ${device.name} is DOWN.`);
            await this.createAndEmitEvent(device.id, device.name, 'DOWN', 'Connection Timeout');

            if (emailEnabled) {
              await this.mailService.sendDownAlert(device as any, new Date(), state.failCount)
                .then(() => this.createAndEmitEvent(device.id, device.name, 'ALERT_SENT', 'Email Notification'))
                .catch(e => this.logger.error('Failed to send DOWN email', e));
            }
            if (teleEnabled && teleChatId) {
              await this.telegramService.sendDownAlert(device as any, teleChatId, new Date(), state.failCount)
                .then(() => this.createAndEmitEvent(device.id, device.name, 'ALERT_SENT', 'Telegram Notification'))
                .catch(e => this.logger.error('Failed to send DOWN telegram', e));
            }
            state.isDown = true;
          }
        } else {
          if (state.isDown) {
            this.logger.log(`[RECOVERY] ${device.name} is UP.`);
            await this.createAndEmitEvent(device.id, device.name, 'RECOVERED', 'Connection Restored');

            if (emailEnabled) {
              await this.mailService.sendRecoveryAlert(device as any)
                .then(() => this.createAndEmitEvent(device.id, device.name, 'ALERT_SENT', 'Email Notification'))
                .catch(e => this.logger.error('Failed to send RECOVERY email', e));
            }
            if (teleEnabled && teleChatId) {
              await this.telegramService.sendRecoveryAlert(device as any, teleChatId)
                .then(() => this.createAndEmitEvent(device.id, device.name, 'ALERT_SENT', 'Telegram Notification'))
                .catch(e => this.logger.error('Failed to send RECOVERY telegram', e));
            }
            state.isDown = false;
          }
          state.failCount = 0;
        }
      }
    } catch (error) {
      this.logger.error('Error in monitoring handleCheck', error);
    }
  }
}
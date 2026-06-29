import { Controller, Get, Delete, Param, Post, Body } from '@nestjs/common';
import { HistoryService } from './history/history.service';
import { MonitoringGateway } from './monitoring/monitoring.gateway';

@Controller()
export class AppController {
  constructor(
    private readonly historyService: HistoryService,
    private readonly monitoringGateway: MonitoringGateway
  ) {}

  @Get('events')
  getEvents() {
    return this.historyService.getRecentEvents(50);
  }

  @Delete('events')
  clearEvents() {
    return this.historyService.clearAllEvents();
  }

  @Delete('events/:id')
  deleteEvent(@Param('id') id: string) {
    return this.historyService.deleteEvent(id);
  }

  @Post('events/manual')
  async triggerManualEvent(@Body() body: { deviceId: string, deviceName: string, message: string }) {
    await this.historyService.saveEvent(body.deviceId, body.deviceName, 'MANUAL_TEST', body.message);
    const recent = await this.historyService.getRecentEvents(1);
    if (recent[0]) {
      this.monitoringGateway.emitEvent({
        id: recent[0].id,
        deviceId: recent[0].deviceId,
        deviceName: recent[0].deviceName,
        type: recent[0].type,
        timestamp: recent[0].occurredAt?.toISOString?.() ?? new Date().toISOString(),
        message: recent[0].message,
      });
    }
    return { success: true };
  }
}

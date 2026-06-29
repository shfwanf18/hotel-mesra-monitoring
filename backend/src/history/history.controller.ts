import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { HistoryService } from './history.service';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get('device/:id/ping')
  getPingHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('hours') hours?: string
  ) {
    const h = hours ? parseInt(hours, 10) : 24;
    return this.historyService.getPingHistory(id, h);
  }

  @Get('device/:id/uptime')
  getUptimeStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.historyService.getUptimeStats(id);
  }

  @Get('device/:id/events')
  getEventsByDevice(@Param('id', ParseUUIDPipe) id: string) {
    return this.historyService.getEventsByDevice(id);
  }
}

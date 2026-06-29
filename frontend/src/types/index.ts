export interface Device {
  id: string; name: string; ip: string;
  type: 'AP' | 'Router' | 'Server'; location: string;
  macAddress?: string;
  firmware?: string;
  model?: string;
  description?: string;
  historicalUptime30d?: number;
  historicalUptime1y?: number;
  txBytes?: number;
  rxBytes?: number;
  createdAt?: string;
}

export interface PingResult {
  id: string; alive: boolean; time: number | 'unknown'; timestamp: string;
}

export interface DeviceEvent {
  id: string; type: 'DOWN' | 'RECOVERED' | 'ALERT_SENT' | 'MANUAL_TEST' | string;
  deviceId: string; deviceName: string;
  timestamp: string;       // from socket events
  occurredAt?: string;     // from DB API (GET /history/device/:id/events)
  message: string;
}

export interface SnackbarMsg {
  id: string; type: 'DOWN' | 'RECOVERED'; message: string; timestamp?: string;
}

export type StatusType = 'online' | 'offline' | 'warning' | 'unknown';

export interface HistoryItem {
  status: StatusType;
  timestamp?: string;
  latency?: number | 'unknown';
}

export type FilterType = 'all' | StatusType;
export type HealthLevel = 'healthy' | 'stable' | 'degraded' | 'critical' | 'offline' | 'unknown';

export interface Incident {
  id: string; deviceId: string; startTime: string;
  endTime?: string; duration?: number; recovered: boolean;
}

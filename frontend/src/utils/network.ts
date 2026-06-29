import type { PingResult, StatusType, HealthLevel } from '../types';

export function getStatus(r?: PingResult): StatusType {
  if (!r) return 'unknown';
  if (!r.alive) return 'offline';
  if (typeof r.time === 'number' && r.time > 150) return 'warning';
  return 'online';
}

export function calculateJitter(history: number[]): number {
  const alive = history.filter(l => l > 0);
  if (alive.length < 2) return 0;
  const diffs = alive.slice(1).map((l, i) => Math.abs(l - alive[i]));
  return Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
}

export function calculatePacketLoss(history: number[]): number {
  if (!history.length) return 0;
  return Math.round((history.filter(l => l === 0).length / history.length) * 100);
}

export function getLatencyTrend(history: number[]): 'rising' | 'falling' | 'stable' {
  const alive = history.filter(l => l > 0).slice(-10);
  if (alive.length < 4) return 'stable';
  const half = Math.floor(alive.length / 2);
  const first = alive.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const last = alive.slice(half).reduce((a, b) => a + b, 0) / (alive.length - half);
  if (last > first * 1.15) return 'rising';
  if (last < first * 0.85) return 'falling';
  return 'stable';
}

export function getHealthLevel(status: StatusType, latency: number, jitter: number, packetLoss: number): HealthLevel {
  if (status === 'unknown') return 'unknown';
  if (status === 'offline') return 'offline';
  if (packetLoss >= 20 || jitter > 80) return 'critical';
  if (packetLoss >= 5 || jitter > 40 || latency > 150) return 'degraded';
  if (packetLoss > 0 || jitter > 15 || latency > 80) return 'stable';
  return 'healthy';
}

export const HEALTH_CFG: Record<HealthLevel, { label: string; tw: string; dot: string }> = {
  healthy: { label: 'Healthy', tw: 'text-online  bg-online/10  border-online/20', dot: 'bg-online' },
  stable: { label: 'Stable', tw: 'text-accent  bg-accent/10  border-accent/20', dot: 'bg-accent' },
  degraded: { label: 'Degraded', tw: 'text-warning  bg-warning/10 border-warning/20', dot: 'bg-warning' },
  critical: { label: 'Critical', tw: 'text-offline  bg-offline/10 border-offline/20', dot: 'bg-offline' },
  offline: { label: 'Offline', tw: 'text-offline  bg-offline/10 border-offline/20', dot: 'bg-offline' },
  unknown: { label: 'Unknown', tw: 'text-gray-400 bg-gray-500/10 border-gray-500/20', dot: 'bg-gray-500' },
};

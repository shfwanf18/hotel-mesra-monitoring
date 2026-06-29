import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Device, PingResult, HistoryItem } from '../../types';
import { getStatus } from '../../utils/network';
import { deviceIcon } from '../../utils/formatters';
import { Sparkline } from '../ui/Sparkline';
import { StatusTimeline } from '../ui/StatusTimeline';

export interface CardProps {
  device: Device; result?: PingResult; history: HistoryItem[]; latencyHistory: number[]; onClick?: () => void;
}

export function DeviceCard({ device, result, history, latencyHistory, onClick }: CardProps) {
  const status = getStatus(result);
  const statusColor = status === 'online' ? '#22c55e' : status === 'warning' ? '#f59e0b' : status === 'offline' ? '#ef4444' : '#6b7280';
  const known = history.filter(h => h.status !== 'unknown');
  const uptime = known.length ? Math.round(known.filter(h => h.status === 'online' || h.status === 'warning').length / known.length * 100) : null;

  const [dbUptime, setDbUptime] = useState<{ historicalUptime30d: number; historicalUptime1y: number } | null>(null);
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    if (!device.id) return;
    const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    setDbLoading(true);
    fetch(`${BASE}/history/device/${device.id}/uptime`)
      .then(r => r.json())
      .then(data => setDbUptime(data))
      .catch(() => null)
      .finally(() => setDbLoading(false));
  }, [device.id]);

  const historicalUptime30d = dbUptime?.historicalUptime30d ?? device.historicalUptime30d ?? null;
  const historicalUptime1y = dbUptime?.historicalUptime1y ?? device.historicalUptime1y ?? null;


  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -4,
        scale: 1.015,
        boxShadow: `0 16px 40px rgba(0,0,0,0.35), 0 0 40px ${statusColor}20`,
        borderColor: `${statusColor}45`
      }}
      style={{
        borderColor: 'rgba(255, 255, 255, 0.05)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.28)'
      }}
      transition={{ duration: 0.18 }}
      onClick={() => onClick?.()}
      className={cn(
        "group relative overflow-hidden rounded-3xl",
        "border",
        "bg-panel/90 backdrop-blur-xl",
        "transition-colors duration-300",
        "hover:bg-panel",
        "cursor-pointer"
      )}
    >
      <div 
        className="absolute left-0 top-0 bottom-0 w-[4px] opacity-65 group-hover:w-[6px] group-hover:opacity-95 transition-all duration-300 ease-out pointer-events-none" 
        style={{ 
          background: `linear-gradient(to bottom, transparent, ${statusColor}, transparent)`,
          boxShadow: `12px 0 32px -4px ${statusColor}`,
        }}
      />
      {/* Diagonal / Radial background glow matching Stats Card */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at 100% 0%, ${statusColor}, transparent 65%)`
        }}
      />

      {/* Large Background Silhouette Icon matching Stats Card */}
      <div
        className="absolute right-[-15px] bottom-[-25px] pointer-events-none opacity-[0.035] transition-all duration-500 ease-out group-hover:scale-110 group-hover:rotate-6 group-hover:-translate-x-2 group-hover:-translate-y-2 group-hover:opacity-[0.06]"
        style={{ color: statusColor }}
      >
        {deviceIcon(device.type, 140, status)}
      </div>

      <div className="relative z-10 h-full" style={{ padding: '24px 24px 24px 20px' }}>
        <div className="flex h-full flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold tracking-tight text-white truncate">{device.name}</h3>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted font-mono">
                <div className="opacity-50 shrink-0 transition-transform duration-300 group-hover:scale-110">{deviceIcon(device.type, 11, status)}</div>
                <span className="truncate">{device.ip}</span>
              </div>
            </div>
            <span 
              className={cn("shrink-0 rounded-full border text-xs font-bold uppercase tracking-[0.18em] transition-all duration-300 group-hover:scale-105", status === 'online' ? 'border-online/20 bg-online/10 text-online' : status === 'warning' ? 'border-warning/20 bg-warning/10 text-warning' : status === 'offline' ? 'border-offline/20 bg-offline/10 text-offline' : 'border-gray-500/20 bg-gray-500/10 text-gray-400')}
              style={{ padding: '4px 10px' }}
            >
              {status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative overflow-hidden card-inner-surface transition-colors hover:bg-black/30" style={{ padding: '16px 20px' }}>
              <Sparkline data={latencyHistory} colorClass={status === 'online' ? 'text-online' : status === 'warning' ? 'text-warning' : 'text-offline'} />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2.5">
                  <p className="section-label">Latency</p>
                  {status === 'online' && <div className="h-1.5 w-1.5 rounded-full bg-online status-pulse" />}
                  {status === 'warning' && <div className="h-1.5 w-1.5 rounded-full bg-warning status-pulse" />}
                </div>
                <div className="flex items-end gap-1">
                  <span className="stat-number text-3xl">{result?.alive && typeof result.time === 'number' ? result.time : '—'}</span>
                  <span className="pb-1 text-xs text-muted">ms</span>
                </div>
                <div className="mt-2.5 flex items-center gap-2 text-xs text-white/60 tabular-nums leading-none">
                  <span className="whitespace-nowrap">Avg: <strong className="text-white font-semibold">{latencyHistory.length ? Math.round(latencyHistory.reduce((a, b) => a + b, 0) / latencyHistory.length) : 0}ms</strong></span>
                  <span className="whitespace-nowrap">Max: <strong className="text-white font-semibold">{latencyHistory.length ? Math.max(...latencyHistory) : 0}ms</strong></span>
                </div>
              </div>
            </div>
            <div className="card-inner-surface transition-colors hover:bg-black/30 flex items-center justify-between gap-3 min-w-0" style={{ padding: '16px 20px' }}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2.5">
                  <p className="section-label">Uptime (24h)</p>
                </div>
                <div className="flex items-end gap-0.5">
                  <span className="stat-number text-3xl leading-none">{uptime !== null ? `${uptime}` : '100'}</span>
                  <span className="pb-1 text-xs text-muted">%</span>
                </div>
                <div className="mt-2.5 flex items-center gap-2 text-xs text-white/60 tabular-nums leading-none">
                  <span className="whitespace-nowrap">30d: <strong className="text-white font-semibold">{dbLoading ? '…' : `${Math.floor(historicalUptime30d ?? 0)}%`}</strong></span>
                  <span className="whitespace-nowrap">1y: <strong className="text-white font-semibold">{dbLoading ? '…' : `${Math.floor(historicalUptime1y ?? 0)}%`}</strong></span>
                </div>
              </div>
              <div className="shrink-0 hidden xs:block">
                <svg width="48" height="48" viewBox="0 0 52 52" className="opacity-90 transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-12">
                  <circle cx="26" cy="26" r="20" fill="none" strokeWidth="4.5" stroke="rgba(255,255,255,0.05)" />
                  <circle cx="26" cy="26" r="20" fill="none" strokeWidth="4.5" strokeLinecap="round" transform="rotate(-90 26 26)" strokeDasharray={`${2 * Math.PI * 20}`} strokeDashoffset={`${2 * Math.PI * 20 * (1 - (uptime ?? 0) / 100)}`} stroke={status === 'online' ? '#22c55e' : status === 'warning' ? '#f59e0b' : status === 'offline' ? '#ef4444' : '#475569'} />
                </svg>
              </div>
            </div>
          </div>
 
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">Status Timeline</p>
              <span className="text-xs font-medium text-white/60">Last 40 checks</span>
            </div>
            <StatusTimeline history={history} />
          </div>
 
          <div className="flex-1" />
          <div className="mt-4 mb-4 w-full h-[1.5px] bg-gradient-to-r from-white/[0.08] to-transparent" />
          <div>
            <div className="flex items-center justify-between gap-3">
              <div 
                className="flex items-center gap-1.5 text-white/70 bg-white/[0.02] border border-white/[0.02] rounded-md"
                style={{ padding: '4px 8px' }}
              >
                <Clock size={10} className="opacity-70" />
                <span className="text-xs font-medium tracking-wider uppercase tabular-nums">
                  Updated {result && result.timestamp
                    ? new Date(result.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : '--:--:--'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold tracking-widest uppercase text-white/40 transition-colors duration-300 group-hover:text-white/60">
                  {(status === 'online' || status === 'warning') ? 'SYNC' : 'NOT SYNC'}
                </span>
                <div className={cn(
                  "h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor] transition-transform duration-300 group-hover:scale-110", 
                  status === 'online' ? 'bg-online text-online status-pulse' : 
                  status === 'warning' ? 'bg-warning text-warning status-pulse' : 
                  status === 'offline' ? 'bg-offline text-offline status-pulse' : 'bg-gray-500 text-gray-500'
                )} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

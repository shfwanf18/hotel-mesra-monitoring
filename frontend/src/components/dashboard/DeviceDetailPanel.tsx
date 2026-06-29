import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Check, ExternalLink, Cpu, Globe, Server, Activity, ArrowDownRight, ArrowUpRight, FileText } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Device, PingResult, HistoryItem, DeviceEvent, Incident } from '../../types';
import { getStatus, calculateJitter, calculatePacketLoss } from '../../utils/network';
import { deviceIcon, formatDuration } from '../../utils/formatters';
import { Sparkline } from '../ui/Sparkline';
import { StatusTimeline } from '../ui/StatusTimeline';

import { PingTestTerminal } from './PingTestTerminal';

interface DeviceDetailPanelProps {
  device: Device;
  result?: PingResult;
  history: HistoryItem[];
  latencyHistory: number[];
  events: DeviceEvent[];
  deviceIncidents: Incident[];
  triggerSnackbar: (message: string, type: 'DOWN' | 'RECOVERED') => void;
  triggerManualRTOEvent: (device: Device) => void;
  onClose: () => void;
}

export function DeviceDetailPanel({ device, result, history, latencyHistory, events, deviceIncidents, triggerSnackbar, triggerManualRTOEvent, onClose }: DeviceDetailPanelProps) {
  const [copied, setCopied] = useState(false);
  const [simTraffic, setSimTraffic] = useState({ rx: 0, tx: 0 });

  // DB-sourced data
  const [dbUptime, setDbUptime] = useState<{ historicalUptime30d: number; historicalUptime1y: number } | null>(null);
  const [dbLatency, setDbLatency] = useState<number[] | null>(null);
  const [dbEvents, setDbEvents] = useState<DeviceEvent[] | null>(null);
  const [dbLoading, setDbLoading] = useState(true);
  
  const status = getStatus(result);

  const monitoringSince = device.createdAt 
    ? new Date(device.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '')
    : 'Unknown';

  const monitoredForDays = device.createdAt 
    ? Math.max(1, Math.ceil((new Date().getTime() - new Date(device.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const monitoredFor = monitoredForDays ? `${monitoredForDays} Days` : 'Unknown';

  const lastSeen = result?.timestamp 
    ? new Date(result.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Unknown';

  const latestEvent = (events || []).length > 0 ? events[0] : null;
  let lastStatusChange = 'No changes yet';
  if (latestEvent) {
    const diffEvent = new Date().getTime() - new Date(latestEvent.timestamp).getTime();
    const diffHrs = Math.floor(diffEvent / (1000 * 60 * 60));
    const diffMins = Math.floor((diffEvent % (1000 * 60 * 60)) / (1000 * 60));
    if (diffHrs > 0) lastStatusChange = `${diffHrs}h ${diffMins}m ago`;
    else if (diffMins > 0) lastStatusChange = `${diffMins}m ago`;
    else lastStatusChange = `Just now`;
  }


  // Fetch DB historical data when device changes
  useEffect(() => {
    if (!device.id) return;
    const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    setDbLoading(true);

    Promise.all([
      fetch(`${BASE}/history/device/${device.id}/uptime`).then(r => r.json()).catch(() => null),
      fetch(`${BASE}/history/device/${device.id}/ping?hours=24`).then(r => r.json()).catch(() => null),
      fetch(`${BASE}/history/device/${device.id}/events`).then(r => r.json()).catch(() => null),
    ]).then(([uptimeData, latencyData, eventsData]) => {
      if (uptimeData) setDbUptime(uptimeData);
      if (Array.isArray(latencyData) && latencyData.length > 0) setDbLatency(latencyData);
      if (Array.isArray(eventsData)) setDbEvents(eventsData);
    }).finally(() => setDbLoading(false));
  }, [device.id]);

  // Background body scroll lock
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  // Fluctuating Traffic Bandwidth Simulation
  useEffect(() => {
    if (status !== 'online') {
      setSimTraffic({ rx: 0, tx: 0 });
      return;
    }

    const updateTraffic = () => {
      const time = Date.now() / 3500;
      const baseRx = 38 + Math.sin(time) * 18;
      const randomRx = (Math.random() - 0.5) * 6;
      const rx = Math.max(1.5, parseFloat((baseRx + randomRx).toFixed(2)));

      const baseTx = 4.2 + Math.sin(time * 1.6) * 2.2;
      const randomTx = (Math.random() - 0.5) * 0.9;
      const tx = Math.max(0.2, parseFloat((baseTx + randomTx).toFixed(2)));

      setSimTraffic({ rx, tx });
    };

    updateTraffic();
    const interval = setInterval(updateTraffic, 1500);
    return () => clearInterval(interval);
  }, [status]);

  // Use DB latency if available, otherwise fall back to in-memory
  const activeLatencyHistory = (dbLatency && dbLatency.length > 0) ? dbLatency : latencyHistory;

  const valid = activeLatencyHistory.filter((l: number) => l > 0);
  const avgLat = valid.length ? Math.round(valid.reduce((a: number, b: number) => a + b, 0) / valid.length) : 0;
  const curLat = result?.alive && typeof result.time === 'number' ? result.time : 0;
  const jitter = calculateJitter(activeLatencyHistory);
  const packetLoss = calculatePacketLoss(activeLatencyHistory);


  const known = history.filter(h => h.status !== 'unknown');
  const uptime = known.length ? (() => {
    const good = known.filter(h => h.status === 'online' || h.status === 'warning').length;
    if (good === 0) return 0;
    const pct = (good / known.length) * 100;
    return pct > 99.8 ? 99.9 : Number(pct.toFixed(1));
  })() : null;

  const currentIncident = deviceIncidents.find(i => !i.recovered);
  const offlineSince = currentIncident 
    ? new Date(currentIncident.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
    : 'Unknown';
  const offlineDurationMs = currentIncident ? new Date().getTime() - new Date(currentIncident.startTime).getTime() : 0;
  const offlineDuration = offlineDurationMs > 0 ? formatDuration(offlineDurationMs) : 'Unknown';

  const downtimeSeconds = Math.round((100 - (uptime ?? 100)) / 100 * 24 * 3600);
  const downtimeMins = Math.floor(downtimeSeconds / 60);
  const downtimeSecs = downtimeSeconds % 60;
  const downtimeToday = `${downtimeMins}m ${downtimeSecs}s`;

  const latScore = curLat === 0 ? 0 : curLat < 50 ? 100 : curLat < 100 ? 75 : curLat < 150 ? 50 : 25;
  const latencyGrade = latScore >= 80 ? 'Excellent' : latScore >= 50 ? 'Fair' : 'Poor';

  let healthBadge = 'Unknown';
  let healthColor = 'text-muted';
  let currentState = 'Unknown';

  if (status === 'online') {
    if (uptime !== null && uptime >= 99 && packetLoss === 0 && latencyGrade === 'Excellent') {
      healthBadge = 'Healthy';
      healthColor = 'text-cyan-400';
      currentState = 'Healthy';
    } else if (packetLoss > 0 || jitter > 40 || latencyGrade === 'Poor') {
      healthBadge = 'Warning';
      healthColor = 'text-warning';
      currentState = 'Degraded';
    } else {
      healthBadge = 'Stable';
      healthColor = 'text-online';
      currentState = 'Stable';
    }
  } else if (status === 'warning') {
    healthBadge = 'Warning';
    healthColor = 'text-warning';
    currentState = 'Degraded';
  } else if (status === 'offline') {
    healthBadge = 'Critical';
    healthColor = 'text-offline';
    currentState = 'Offline';
  }



  // Use DB uptime if available, otherwise show 0 with loading state
  const historicalUptime30d = dbUptime?.historicalUptime30d ?? (dbLoading ? null : 0);
  const historicalUptime1y = dbUptime?.historicalUptime1y ?? (dbLoading ? null : 0);

  // Merge DB events and live socket events
  const contextEventsForDevice = events.filter(e => e.deviceId === device.id);
  const activeEventsMap = new Map<string, DeviceEvent>();
  
  if (dbEvents) {
    dbEvents.forEach(e => activeEventsMap.set(e.id, e));
  }
  
  contextEventsForDevice.forEach(e => activeEventsMap.set(e.id, e));
  
  // Sort descending by timestamp
  const activeEvents = Array.from(activeEventsMap.values()).sort((a, b) => {
    const timeA = new Date(a.occurredAt ?? a.timestamp).getTime();
    const timeB = new Date(b.occurredAt ?? b.timestamp).getTime();
    return timeB - timeA;
  });

  return (
    <>
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6 md:p-10 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="pointer-events-auto w-full max-w-4xl lg:max-w-5xl max-h-[85vh] sm:max-h-[90vh] bg-panel/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl flex flex-col shadow-2xl overflow-hidden relative"
        >
          {/* Glowing Left Border Strip - Identical to DeviceCard */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-[4.5px] pointer-events-none z-20" 
            style={{ 
              background: `linear-gradient(to bottom, transparent, ${status === 'online' ? '#22c55e' : status === 'warning' ? '#f59e0b' : status === 'offline' ? '#ef4444' : '#6b7280'}, transparent)`,
              boxShadow: `12px 0 32px -4px ${status === 'online' ? '#22c55e' : status === 'warning' ? '#f59e0b' : status === 'offline' ? '#ef4444' : '#6b7280'}`,
              opacity: 0.75
            }}
          />

          {/* Bottom-right Corner Gradient - Identical to DeviceCard */}
          <div className={cn(
            "absolute inset-0 opacity-[0.04] pointer-events-none bg-gradient-to-br from-transparent via-transparent z-0",
            status === 'online' ? 'to-green-500/40' : status === 'warning' ? 'to-yellow-500/40' : status === 'offline' ? 'to-red-500/40' : 'to-gray-500/40'
          )} />

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 relative z-10" style={{ padding: '24px 36px', backgroundColor: 'rgba(0, 0, 0, 0.25)', borderBottom: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] shadow-inner shrink-0">
                {deviceIcon(device.type, 24, status)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="type-page-title md:text-2xl font-bold text-white tracking-tight truncate" style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)' }}>{device.name}</h2>
                  <span 
                    className={cn('type-badge rounded-full border shrink-0', status === 'online' ? 'border-online/20 bg-online/10 text-online' : status === 'warning' ? 'border-warning/20 bg-warning/10 text-warning' : 'border-offline/20 bg-offline/10 text-offline')}
                    style={{ padding: '4px 14px' }}
                  >
                    {status}
                  </span>
                </div>
                <p className="type-mono text-muted flex items-center gap-2 truncate">
                  <Globe size={14} className="opacity-50 shrink-0" />
                  {device.ip}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Action Buttons */}
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(device.ip);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] type-label text-white transition-colors"
                style={{ padding: '8px 16px' }}
              >
                {copied ? <Check size={14} className="text-online" /> : <Copy size={14} className="text-muted" />} 
                <span className="hidden md:inline">{copied ? 'Copied!' : 'Copy IP'}</span>
              </button>
              <button 
                onClick={() => window.open(`http://${device.ip}`, '_blank')}
                className="flex items-center gap-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] type-label text-white transition-colors"
                style={{ padding: '8px 16px' }}
                title="Buka halaman konfigurasi perangkat di tab baru"
              >
                <ExternalLink size={14} className="text-accent" /> <span className="hidden md:inline">Web UI</span>
              </button>
              <div className="w-px h-6 bg-white/[0.1] mx-1" />
              <button
                onClick={onClose}
                className="p-2.5 rounded-full hover:bg-white/10 text-muted hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="detail-modal-content flex-1 relative z-10 scrollbar-thin" style={{ padding: '28px 32px', overflowY: 'auto' }}>
            <div className="flex flex-col" style={{ gap: '20px' }}>

              {/* ROW 1: Device Info & Traffic */}
              <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '20px' }}>

                {/* Device Information */}
                <div>
                  <h3 className="section-title mb-2">Device Information</h3>
                  <div className="detail-card grid grid-cols-2 gap-x-4 gap-y-3" style={{ padding: '16px 20px' }}>
                    <div className="flex flex-col gap-0.5">
                      <span className="type-sublabel flex items-center gap-1"><Cpu size={10}/> Model / Type</span>
                      <span className={cn("type-value", device.model ? "text-white" : "text-muted/65")}>{device.model || '—'}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="type-sublabel flex items-center gap-1"><Server size={10}/> Firmware</span>
                      <span className={cn("type-value", device.firmware ? "text-white" : "text-muted/65")}>{device.firmware || '—'}</span>
                    </div>
                    <div className="col-span-2 flex flex-col gap-0.5">
                      <span className="type-sublabel flex items-center gap-1"><Globe size={10}/> MAC Address</span>
                      <span className={cn("type-mono tracking-wide", device.macAddress ? "text-white/90" : "text-muted/65")}>{device.macAddress || '—'}</span>
                    </div>
                    <div className="col-span-2 h-px bg-white/[0.05]" />
                    <div className="flex flex-col gap-0.5">
                      <span className="type-sublabel">Monitoring Since</span>
                      <span className="type-value text-white">{monitoringSince}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="type-sublabel">Last Seen</span>
                      <span className="type-value text-white">{lastSeen}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="type-sublabel">Monitored For</span>
                      <span className="type-value text-white">{monitoredFor}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="type-sublabel">Last Status Change</span>
                      <span className="type-value text-white">{lastStatusChange}</span>
                    </div>
                    {device.description && (
                      <>
                        <div className="col-span-2 h-px bg-white/[0.05]" />
                        <div className="col-span-2 flex flex-col gap-0.5">
                          <span className="type-sublabel flex items-center gap-1"><FileText size={10}/> Notes</span>
                          <span className="type-body-sm text-white/75 leading-relaxed">{device.description}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Traffic Statistics */}
                <div>
                  <h3 className="section-title mb-2">Traffic Statistics</h3>
                  <div className="detail-card grid grid-cols-2 gap-x-4 gap-y-3" style={{ padding: '16px 20px' }}>
                    <div className="flex flex-col gap-0.5">
                      <span className="type-sublabel flex items-center gap-1"><ArrowDownRight size={10} className="text-online"/> Download (RX)</span>
                      <span className="type-value text-white tabular-nums">
                        {simTraffic.rx > 0 ? simTraffic.rx.toFixed(2) : '0.00'} <span className="type-body-sm text-dim">Mbps</span>
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="type-sublabel flex items-center gap-1"><ArrowUpRight size={10} className="text-accent"/> Upload (TX)</span>
                      <span className="type-value text-white tabular-nums">
                        {simTraffic.tx > 0 ? simTraffic.tx.toFixed(2) : '0.00'} <span className="type-body-sm text-dim">Mbps</span>
                      </span>
                    </div>
                    <div className="col-span-2 h-px bg-white/[0.05]" />
                    <div className="flex flex-col gap-0.5">
                      <span className="type-sublabel">Peak Today</span>
                      <span className="type-value text-white tabular-nums">
                        {Math.max(simTraffic.rx, 56.0).toFixed(2)} <span className="type-body-sm text-dim">Mbps</span>
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="type-sublabel">Last 5m Avg</span>
                      <span className="type-value text-white tabular-nums">
                        {avgLat > 0 ? ((simTraffic.rx + simTraffic.tx) / 2).toFixed(2) : '0.00'} <span className="type-body-sm text-dim">Mbps</span>
                      </span>
                    </div>
                    <div className="col-span-2 h-px bg-white/[0.05]" />
                    <div className="flex flex-col gap-0.5">
                      <span className="type-sublabel">Latency</span>
                      <span className="type-value text-white tabular-nums">{curLat > 0 ? `${curLat} ms` : '—'}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="type-sublabel">Jitter</span>
                      <span className="type-value text-white tabular-nums">{jitter > 0 ? `${jitter} ms` : '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROW 2: Network Health & Availability */}
              <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '20px' }}>

                {/* Network Health */}
                <div>
                  <h3 className="section-title mb-2">Network Health</h3>
                  <div
                    className="detail-card flex flex-col gap-3 transition-all duration-300"
                    style={{
                      padding: '16px 20px',
                      borderLeft: `3px solid ${status === 'online' ? (healthBadge === 'Healthy' ? '#22d3ee' : '#22c55e') : status === 'warning' ? '#f59e0b' : status === 'offline' ? '#ef4444' : '#6b7280'}`,
                    }}
                  >
                    {/* Badge row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          'h-2 w-2 rounded-full',
                          healthBadge === 'Healthy' ? 'bg-cyan-400' : healthBadge === 'Stable' ? 'bg-online' : healthBadge === 'Warning' ? 'bg-warning' : healthBadge === 'Critical' ? 'bg-offline' : 'bg-muted',
                          status !== 'offline' && 'status-pulse'
                        )} />
                        <span className={cn('type-value', healthColor)}>{healthBadge}</span>
                      </div>
                      <span
                        className={cn('rounded-md type-badge border',
                          status === 'online' ? 'border-online/20 bg-online/10 text-online' :
                          status === 'warning' ? 'border-warning/20 bg-warning/10 text-warning' :
                          status === 'offline' ? 'border-offline/20 bg-offline/10 text-offline' :
                          'border-white/10 bg-white/5 text-muted'
                        )}
                        style={{ padding: '3px 10px' }}
                      >
                        {status}
                      </span>
                    </div>

                    <div className="h-px bg-white/[0.05]" />

                    {/* Online metrics */}
                    {status !== 'offline' && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="type-sublabel">Current State</span>
                          <span className={cn("type-mono", healthColor)}>{currentState}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="type-sublabel">Packet Loss</span>
                          <span className={cn("type-mono", packetLoss > 0 ? 'text-warning' : 'text-white')}>{packetLoss}%</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="type-sublabel">Latency Grade</span>
                          <span className={cn("type-mono", latencyGrade === 'Excellent' ? 'text-online' : latencyGrade === 'Fair' ? 'text-warning' : 'text-offline')}>{latencyGrade}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="type-sublabel">Downtime Today</span>
                          <span className={cn("type-mono", downtimeMins > 0 ? 'text-warning' : 'text-white')}>{downtimeToday}</span>
                        </div>
                      </div>
                    )}

                    {/* Offline metrics */}
                    {status === 'offline' && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="type-sublabel">Current State</span>
                          <span className="type-mono text-offline">Offline</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="type-sublabel">Offline Duration</span>
                          <span className="type-mono text-white">{offlineDuration}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="type-sublabel">Last Seen</span>
                          <span className="type-mono text-white">{lastSeen}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="type-sublabel">Packet Loss</span>
                          <span className="type-mono text-offline">100%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <h3 className="section-title mb-2">Availability</h3>
                  <div
                    className="detail-card flex items-center gap-5 transition-all duration-300"
                    style={{
                      padding: '16px 20px',
                      borderLeft: `3px solid ${status === 'online' ? '#22c55e' : status === 'warning' ? '#f59e0b' : status === 'offline' ? '#ef4444' : '#6b7280'}`,
                    }}
                  >
                    {/* Donut */}
                    <div className="relative shrink-0 flex items-center justify-center">
                      <svg width="64" height="64" viewBox="0 0 68 68" className="opacity-95">
                        <circle cx="34" cy="34" r="29" fill="none" strokeWidth="5" stroke="rgba(255,255,255,0.04)" />
                        <circle
                          cx="34" cy="34" r="29" fill="none" strokeWidth="5" strokeLinecap="round"
                          transform="rotate(-90 34 34)"
                          strokeDasharray={`${2 * Math.PI * 29}`}
                          strokeDashoffset={`${2 * Math.PI * 29 * (1 - (uptime ?? 100) / 100)}`}
                          stroke={status === 'online' ? '#22c55e' : status === 'warning' ? '#f59e0b' : status === 'offline' ? '#ef4444' : '#475569'}
                          style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                        <span className="text-sm font-black text-white tabular-nums">{uptime !== null ? `${uptime}` : '100'}</span>
                        <span className="type-sublabel text-muted">%</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex-1 flex flex-col gap-2.5 min-w-0">
                      <div className="flex flex-col gap-0.5">
                        <span className="type-sublabel">24-Hour Availability</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="type-sublabel">Downtime</span>
                          <span className={cn("type-mono", downtimeMins > 0 ? 'text-warning' : 'text-white')}>{downtimeToday}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="type-sublabel">30 Days</span>
                          <span className="type-mono text-white">{historicalUptime30d !== null ? `${historicalUptime30d}%` : '—'}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="type-sublabel">1 Year</span>
                          <span className="type-mono text-white">{historicalUptime1y !== null ? `${historicalUptime1y}%` : '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROW 3: Charts & Terminal */}
              <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '20px' }}>
                <div className="flex flex-col" style={{ gap: '20px' }}>
                  {/* Latency Chart */}
                  <div>
                    <h3 className="section-title mb-2">
                      Latency Chart
                      <span className="text-dim normal-case font-normal tracking-normal text-xs ml-auto">
                        ({activeLatencyHistory.length} checks{dbLatency ? ' · DB' : ' · live'})
                      </span>
                    </h3>
                    <div
                      className="detail-card h-36 relative overflow-hidden"
                      style={{
                        padding: '12px',
                        borderLeft: `3px solid ${status === 'online' ? '#22c55e' : status === 'warning' ? '#f59e0b' : '#ef4444'}`,
                      }}
                    >
                      <div
                        className="absolute top-2 right-2 flex items-center gap-1.5 rounded bg-black/40 border border-white/[0.04] text-xs text-muted font-mono select-none"
                        style={{ padding: '2px 6px', zIndex: 10 }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-accent status-pulse" />
                        <span>LIVE</span>
                      </div>
                      <Sparkline data={activeLatencyHistory} colorClass={status === 'online' ? 'text-online' : status === 'warning' ? 'text-warning' : 'text-offline'} showLabels />
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div>
                    <h3 className="section-title mb-2">
                      Status Timeline
                      <span className="text-dim normal-case font-normal tracking-normal text-xs ml-auto">Last 40 checks</span>
                    </h3>
                    <StatusTimeline history={history} />
                  </div>
                </div>

                <div className="flex flex-col h-full">
                  <PingTestTerminal device={device} status={status} baseLatency={curLat || avgLat} triggerSnackbar={triggerSnackbar} triggerManualRTOEvent={triggerManualRTOEvent} />
                </div>
              </div>

              {/* ROW 4: Incidents & Events */}
              <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '20px' }}>

                {/* Incident History */}
                <div>
                  <h3 className="section-title mb-2">Incident History</h3>
                  {currentIncident ? (
                    <div
                      className="detail-card flex flex-col gap-3"
                      style={{ padding: '16px 20px', borderLeft: '3px solid #ef4444' }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 type-badge text-offline bg-offline/10 border border-offline/20 rounded" style={{ padding: '3px 10px' }}>
                          <span className="h-1.5 w-1.5 rounded-full bg-offline status-pulse" />
                          Active Incident
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="type-sublabel">Started</span>
                          <span className="type-mono text-white">{offlineSince}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="type-sublabel">Duration</span>
                          <span className="type-mono text-white">{offlineDuration}</span>
                        </div>
                        <div className="col-span-2 flex flex-col gap-0.5">
                          <span className="type-sublabel">Cause</span>
                          <span className="type-body-sm text-white/80">Connection Timeout</span>
                        </div>
                      </div>
                    </div>
                  ) : deviceIncidents?.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {deviceIncidents.slice(0, 5).map(inc => (
                        <div
                          key={inc.id}
                          className={cn('flex items-center justify-between rounded-lg border-l-2 text-xs', inc.recovered ? 'bg-online/[0.04] border-online/30' : 'bg-offline/[0.06] border-offline/50')}
                          style={{ padding: '8px 12px', gap: '12px' }}
                        >
                          <div className="min-w-0">
                            <span className={cn('type-badge rounded inline-block mb-1', inc.recovered ? 'text-online' : 'text-offline')} style={{ padding: '2px 8px', background: inc.recovered ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
                              {inc.recovered ? 'Resolved' : 'Active'}
                            </span>
                            <p className="text-dim text-xs tabular-nums">{new Date(inc.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}{inc.duration !== undefined && ` · ${formatDuration(inc.duration)}`}</p>
                          </div>
                          <span className={cn("text-xs shrink-0", inc.recovered ? 'text-online' : 'text-offline')}>{inc.recovered ? '✓' : '●'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="detail-card flex flex-col items-center justify-center text-center" style={{ padding: '28px 20px' }}>
                      <span className="inline-flex type-badge text-online bg-online/10 rounded border border-online/20 mb-2" style={{ padding: '3px 10px' }}>
                        No Active Incident
                      </span>
                      <p className="type-body-sm text-dim">Device has been running without incidents.</p>
                    </div>
                  )}
                </div>

                {/* Recent Events */}
                <div>
                  <h3 className="section-title mb-2">Recent Events</h3>
                  {activeEvents.length === 0 ? (
                    <div className="detail-card flex flex-col items-center justify-center text-center" style={{ padding: '28px 20px' }}>
                      <span className="inline-flex type-badge text-online bg-online/10 rounded border border-online/20 mb-2" style={{ padding: '3px 10px' }}>
                        Stable
                      </span>
                      <p className="type-body-sm text-dim">No recent status changes or critical events recorded.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {activeEvents.slice(0, 6).map((ev: DeviceEvent) => {
                        const getStyle = (t: string) => {
                          if (t === 'DOWN') return 'text-offline bg-offline/10';
                          if (t === 'RECOVERED') return 'text-online bg-online/10';
                          if (t === 'ALERT_SENT') return 'text-[#38bdf8] bg-[#38bdf8]/10';
                          if (t === 'MANUAL_TEST') return 'text-[#f97316] bg-[#f97316]/10';
                          return 'text-white/70 bg-white/10';
                        };
                        const getText = (t: string) => {
                          if (t === 'RECOVERED') return 'RECOVERY';
                          if (t === 'ALERT_SENT') return 'ALERT SENT';
                          if (t === 'MANUAL_TEST') return 'MANUAL TEST';
                          return t;
                        };
                        return (
                          <div key={ev.id} className="bg-black/20 border border-white/[0.05] rounded-lg flex justify-between items-start gap-3" style={{ padding: '10px 14px' }}>
                            <div className="min-w-0">
                              <span
                                className={cn('type-badge rounded mb-1.5 inline-block', getStyle(ev.type))}
                                style={{ padding: '2px 8px' }}
                              >
                                {getText(ev.type)}
                              </span>
                              <p className="type-body-sm text-muted leading-snug">{ev.message}</p>
                            </div>
                            <span className="type-sublabel text-dim tabular-nums shrink-0 mt-0.5 font-mono">{new Date(ev.occurredAt ?? ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

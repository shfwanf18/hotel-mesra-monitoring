import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap } from 'lucide-react';
import { cn } from '../../utils/cn';
import { relTime } from '../../utils/formatters';
import { useMonitoring } from '../../context/MonitoringContext';
import { getStatus } from '../../utils/network';

export function Footer() {
  const { isConnected, devices, results, lastUpdate } = useMonitoring();

  const stats = useMemo(() => {
    let online = 0, offline = 0, warning = 0, unknown = 0;
    devices.forEach(d => {
      const s = getStatus(results[d.id]);
      if (s === 'online') online++;
      else if (s === 'offline') offline++;
      else if (s === 'warning') warning++;
      else if (s === 'unknown') unknown++;
    });
    return { total: devices.length, online, offline, warning, unknown };
  }, [devices, results]);

  const avgLatency = useMemo(() => {
    const activeTimes = Object.values(results)
      .filter(r => r.alive && typeof r.time === 'number')
      .map(r => r.time as number);
    if (activeTimes.length === 0) return 0;
    const sum = activeTimes.reduce((acc, t) => acc + t, 0);
    return Math.round(sum / activeTimes.length);
  }, [results]);

  return (
    <footer className="relative mt-auto border-t border-white/[0.04] bg-panel/30 backdrop-blur-md z-30 shrink-0">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />

      <div
        className="w-full max-w-[1720px] mx-auto page-container-x flex flex-col md:flex-row items-center justify-between gap-5 relative z-10"
        style={{ paddingTop: '20px', paddingBottom: '20px' }}
      >
        {/* Left branding & description */}
        <div className="flex items-center gap-3 md:gap-4 min-w-0 group shrink-0 cursor-pointer">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 shadow-inner shadow-accent/10 shrink-0 transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-[360deg] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]">
            <Activity className="text-accent" size={20} />
          </div>
          <div className="min-w-0 flex flex-col justify-center transition-transform duration-300 group-hover:translate-x-1">
            <div className="flex items-center gap-2.5">
              <h3 className="type-page-title transition-colors duration-300 group-hover:text-accent">Mesra Network Monitoring</h3>
              <span className="type-badge bg-white/[0.04] border border-white/[0.08] text-muted px-3.5 py-1 rounded-full mt-[-2px] inline-flex items-center justify-center leading-none">
                v1.2.0
              </span>
            </div>
            <p className="type-body-sm text-dim mt-1.5 leading-none">
              Real-time NOC infrastructure monitoring
            </p>
          </div>
        </div>

        {/* Right badges & stats */}
        <motion.div
          whileHover={{ scale: 1.015, borderColor: 'rgba(255, 255, 255, 0.15)' }}
          className="flex h-[42px] items-center gap-3 bg-white/[0.03] border border-white/[0.08] rounded-full shadow-inner shadow-black/10 shrink-0 select-none group/capsule transition-all duration-300"
          style={{ paddingLeft: '18px', paddingRight: '18px' }}
        >
          {/* Live status */}
          <div className="flex items-center gap-2">
            <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', isConnected ? 'bg-online status-pulse' : 'bg-offline')} />
            <span className={cn(
              'type-badge whitespace-nowrap mt-px transition-colors duration-300',
              isConnected ? 'text-online' : 'text-offline',
            )}>
              {isConnected ? 'LIVE' : 'OFF'}
            </span>
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-white/[0.08] shrink-0" />

          {/* Quick Stats: Devices Online */}
          <div className="flex items-center gap-1.5">
            <Zap size={11} className="text-accent/60" />
            <span className="text-xs font-bold tabular-nums text-white/90">{stats.online}</span>
            <span className="text-xs text-white/30">/</span>
            <span className="text-xs text-white/50">{stats.total}</span>
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-white/[0.08] shrink-0" />

          {/* Quick Stats: Avg Latency */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-accent tabular-nums font-mono">{avgLatency}ms</span>
          </div>

          {lastUpdate && (
            <>
              {/* Divider */}
              <div className="h-4 w-px bg-white/[0.08] shrink-0" />

              {/* Last Update */}
              <div className="flex items-center gap-1.5 tabular-nums text-xs text-muted/80">
                <span>Updated:</span>
                <span className="text-white/90 font-semibold">{relTime(lastUpdate)}</span>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </footer>
  );
}

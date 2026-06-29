import { cn } from '../../utils/cn';
import { Clock, Activity, Gauge, ArrowUpDown, Zap } from 'lucide-react';

export function MetricBox({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: 'rising' | 'falling' | 'stable' }) {
  const td = trend ? ({
    rising: { icon: '↑', cls: 'text-offline/95 shadow-[0_0_8px_rgba(239,68,68,0.4)]' },
    falling: { icon: '↓', cls: 'text-online/95 shadow-[0_0_8px_rgba(34,197,94,0.4)]' },
    stable: { icon: '→', cls: 'text-dim' }
  })[trend] : null;

  // Split value into number and unit for high-contrast sizing (e.g. "99.8%", "36 ms", "33 / 56 ms")
  const matchRange = value.match(/^([\d.]+)\s*\/\s*([\d.]+)\s*(ms|%)?$/);
  const matchUnit = value.match(/^([\d.]+)\s*(%|ms)?$/);
  
  let mainVal = value;
  let unit = '';
  
  if (matchRange) {
    mainVal = `${matchRange[1]} / ${matchRange[2]}`;
    unit = matchRange[3] || '';
  } else if (matchUnit) {
    mainVal = matchUnit[1];
    unit = matchUnit[2] || '';
  }

  // Determine icon and accent color class based on label/value
  let accentCls = 'bg-accent/30';
  let Icon = Activity;
  
  const lbl = label.toLowerCase();
  if (lbl.includes('current')) {
    Icon = Clock;
    accentCls = 'bg-accent/50 shadow-[0_0_8px_var(--color-accent)]';
  } else if (lbl.includes('average')) {
    Icon = Gauge;
    accentCls = 'bg-online/50 shadow-[0_0_8px_var(--color-online)]';
  } else if (lbl.includes('min') || lbl.includes('max')) {
    Icon = ArrowUpDown;
    accentCls = 'bg-warning/50 shadow-[0_0_8px_var(--color-warning)]';
  } else if (lbl.includes('jitter')) {
    Icon = Zap;
    accentCls = 'bg-offline/50 shadow-[0_0_8px_var(--color-offline)]';
  } else if (lbl.includes('24') || lbl.includes('30') || lbl.includes('year') || lbl.includes('uptime')) {
    accentCls = 'bg-online/50 shadow-[0_0_8px_var(--color-online)]';
  }

  return (
    <div 
      className="metric-box-card group relative overflow-hidden transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.02]" 
      style={{ 
        padding: '16px 18px',
        background: 'rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        position: 'relative'
      }}
    >
      {/* Floating Translucent Icon in the top right */}
      <div className="absolute right-3.5 top-3.5 opacity-[0.05] text-white group-hover:opacity-[0.1] transition-opacity duration-300 pointer-events-none">
        <Icon size={32} strokeWidth={1.5} />
      </div>

      {/* Subtle bottom-right background gradient glow */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-gradient-to-br from-transparent to-white group-hover:opacity-[0.04] transition-opacity duration-300" />
      
      {/* Left accent indicator strip */}
      <div className={cn("absolute left-0 top-3.5 bottom-3.5 w-[2.5px] rounded-r-full transition-all duration-300 group-hover:top-2 group-hover:bottom-2", accentCls)} />

      <p className="section-label mb-2 text-dim group-hover:text-muted transition-colors duration-300" style={{ fontSize: '8.5px', letterSpacing: '0.15em' }}>
        {label}
      </p>
      
      <div className="flex items-baseline gap-1 relative z-10">
        <span className="font-black text-white text-2xl tracking-tight leading-none tabular-nums">
          {mainVal}
        </span>
        {unit && (
          <span className="text-xs font-bold text-muted/65 tracking-wide pb-0.5 ml-0.5">
            {unit}
          </span>
        )}
        {td && (
          <span 
            className={cn('text-xs font-bold ml-1.5 rounded bg-white/[0.02] border border-white/[0.04] inline-flex items-center justify-center', td.cls)}
            style={{ padding: '3px 6px', minWidth: '16px', height: '16px', lineHeight: 1 }}
          >
            {td.icon}
          </span>
        )}
      </div>
      
      {sub && (
        <p className="text-xs text-dim group-hover:text-muted/50 transition-colors duration-300 mt-2 flex items-center gap-1">
          <span className="opacity-40">·</span> {sub}
        </p>
      )}
    </div>
  );
}

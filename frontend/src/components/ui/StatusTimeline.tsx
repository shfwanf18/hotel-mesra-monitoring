import { cn } from '../../utils/cn';
import type { HistoryItem } from '../../types';

export function StatusTimeline({ history }: { history: HistoryItem[] }) {
  const padded = [
    ...Array(Math.max(0, 40 - history.length)).fill({ status: 'unknown' }),
    ...history
  ].slice(-40);

  return (
    <div className="flex items-center gap-[2px] w-full h-[18px]">
      {padded.map((item, i) => {
          const isObject = item && typeof item === 'object' && 'status' in item;
          const status = isObject ? item.status : (item as any);
          const timestamp = isObject ? item.timestamp : undefined;
          const latency = isObject && 'latency' in item ? item.latency : undefined;

          const color = status === 'online' ? '#22c55e' : status === 'warning' ? '#f59e0b' : status === 'offline' ? '#ef4444' : '#6b7280';
          const dotColorClass = status === 'online' ? 'bg-online' : status === 'warning' ? 'bg-warning' : status === 'offline' ? 'bg-offline' : 'bg-dim';

          // Shift tooltip alignment near the edges to prevent clipping by overflow-hidden on the parent card
          let alignClass = "left-1/2 -translate-x-1/2";
          if (i < 12) {
            alignClass = "left-0 translate-x-0";
          } else if (i >= 28) {
            alignClass = "right-0 left-auto translate-x-0";
          }

          return (
            <div
              key={i}
              className={cn(
                'timeline-bar relative flex-1 h-full rounded-sm transition-all duration-300 ease-out cursor-help',
                status === 'unknown' && 'bg-white/[0.05] hover:bg-white/[0.1]',
                status === 'online' && 'bg-online text-online',
                status === 'warning' && 'bg-warning text-warning',
                status === 'offline' && 'bg-offline text-offline',
              )}
            >
              {/* Custom Tooltip */}
              <div 
                className={cn(
                  "timeline-tooltip absolute bottom-full hidden flex-col rounded-lg border border-white/[0.08] bg-[#101828]/95 backdrop-blur-md shadow-xl pointer-events-none z-[100]",
                  alignClass
                )}
                style={{
                  padding: '12px 14px',
                  marginBottom: '8px',
                  minWidth: '140px',
                  gap: '6px',
                  boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 12px ${color}20`
                }}
              >
                {/* Tooltip Arrow */}
                <div 
                  className={cn(
                    "absolute -bottom-[6px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white/[0.08] drop-shadow-md",
                    i < 12 ? "left-[8px]" : i >= 28 ? "right-[8px]" : "left-1/2 -translate-x-1/2"
                  )}
                />
                <div 
                  className={cn(
                    "absolute -bottom-[5px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#101828]",
                    i < 12 ? "left-[8px]" : i >= 28 ? "right-[8px]" : "left-1/2 -translate-x-1/2"
                  )}
                />

                <div className="flex items-center gap-1.5 whitespace-nowrap relative z-10">
                  <div className={cn("h-1.5 w-1.5 rounded-full shadow-[0_0_6px_currentColor]", dotColorClass, status !== 'unknown' && 'status-pulse')} />
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    Status: {status}
                  </span>
                </div>
                
                <div className="text-xs text-muted font-medium tracking-wide whitespace-nowrap leading-none relative z-10">
                  <span className="text-white/50">Ping: </span>
                  <span className="font-bold text-white">
                    {typeof latency === 'number' ? `${latency}ms` : status === 'offline' ? 'Timeout' : 'N/A'}
                  </span>
                </div>

                <div className="text-xs text-muted font-medium tracking-wide whitespace-nowrap leading-none relative z-10">
                  <span className="text-white/50">Time: </span>
                  <span className="text-white/80 font-medium">
                    {status === 'unknown' ? 'N/A' : timestamp || 'Synced'}
                  </span>
                </div>
              </div>
            </div>
          );
      })}
    </div>
  );
}

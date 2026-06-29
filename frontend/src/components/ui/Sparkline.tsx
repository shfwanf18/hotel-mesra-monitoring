import { useId } from 'react';
import { cn } from '../../utils/cn';

export function Sparkline({ data, colorClass, showLabels }: { data: number[]; colorClass: string; showLabels?: boolean }) {
  const id = useId();
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 10);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const mid = Math.round((max + min) / 2);

  if (showLabels) {
    return (
      <div className="absolute inset-0 pointer-events-none flex">
        {/* Y-axis Labels & Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between z-0" style={{ paddingTop: '20px', paddingBottom: '20px', paddingLeft: '16px', paddingRight: '16px' }}>
          <div className="flex items-center gap-3 w-full">
            <span className="w-8 text-right text-xs text-muted font-mono font-medium">{max}</span>
            <div className="flex-1 border-b border-dashed border-white/[0.08]"></div>
          </div>
          <div className="flex items-center gap-3 w-full">
            <span className="w-8 text-right text-xs text-muted font-mono font-medium opacity-70">{mid}</span>
            <div className="flex-1 border-b border-dashed border-white/[0.05]"></div>
          </div>
          <div className="flex items-center gap-3 w-full">
            <span className="w-8 text-right text-xs text-muted font-mono font-medium">{min}</span>
            <div className="flex-1 border-b border-dashed border-white/[0.08]"></div>
          </div>
        </div>

        {/* SVG Line */}
        <div className={cn("absolute inset-0 z-10 opacity-75", colorClass)} style={{ paddingLeft: '60px', paddingRight: '16px', paddingTop: '20px', paddingBottom: '20px' }}>
          <svg preserveAspectRatio="none" className="w-full h-full" viewBox="0 -5 100 110">
            <defs>
              <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
              </linearGradient>
              <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <polygon
              points={`0,105 ${points} 100,105`}
              fill={`url(#fill-${id})`}
            />
            <polyline
              points={points}
              fill="none"
              stroke={`url(#spark-${id})`}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))' }}
            />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("absolute inset-0 pointer-events-none opacity-50", colorClass)}>
      <svg preserveAspectRatio="none" className="w-full h-full" viewBox="0 -5 100 110">
        <defs>
          <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.0" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
          </linearGradient>
        </defs>
        <polyline
          points={points}
          fill="none"
          stroke={`url(#spark-${id})`}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

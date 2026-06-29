import { Wifi, WifiOff } from 'lucide-react';

const WifiWarning = ({ size = 12 }: { size?: number }) => (
  <div className="relative inline-flex" style={{ width: size, height: size }}>
    <Wifi size={size} />
    <div className="absolute -bottom-1 -right-1 bg-panel rounded-full" style={{ padding: '2px' }}>
      <div className="text-warning flex items-center justify-center font-bold" style={{ fontSize: size * 0.7, lineHeight: 1 }}>!</div>
    </div>
  </div>
);

export function statusIcon(status: string, size = 12) {
  if (status === 'offline') return <WifiOff size={size} />;
  if (status === 'warning') return <WifiWarning size={size} />;
  return <Wifi size={size} />;
}

export function deviceIcon(_type: string, size = 12, status?: string) {
  // User requested Wifi icons to be used across the board for device connection status
  if (status === 'offline') return <WifiOff size={size} />;
  if (status === 'warning') return <WifiWarning size={size} />;
  return <Wifi size={size} />;
}

export function relTime(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

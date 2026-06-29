import { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import type { Device, StatusType } from '../../types';

export function PingTestTerminal({ device, status, baseLatency, triggerSnackbar, triggerManualRTOEvent }: { device: Device; status: StatusType; baseLatency: number; triggerSnackbar: (message: string, type: 'DOWN' | 'RECOVERED') => void; triggerManualRTOEvent?: (device: Device) => void; }) {
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [lines, setLines] = useState<string[]>([]);
  const termRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => { if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight; }, [lines]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  function runPing() {
    if (phase === 'running') return;
    timers.current.forEach(clearTimeout); timers.current = [];
    setPhase('running');
    setLines([`PING ${device.ip} (${device.ip}): 56 data bytes`]);
    const COUNT = 5; const results: number[] = [];
    const base = baseLatency > 0 ? baseLatency : 50;
    for (let seq = 0; seq < COUNT; seq++) {
      const t = setTimeout(() => {
        if (status === 'offline') {
          setLines(p => [...p, `Request timeout for icmp_seq ${seq}`]);
        } else {
          const ms = Math.max(1, Math.round(base + (Math.random() - 0.5) * Math.max(base * 0.3, 5)));
          results.push(ms);
          setLines(p => [...p, `64 bytes from ${device.ip}: icmp_seq=${seq} ttl=64 time=${ms} ms`]);
        }
        if (seq === COUNT - 1) {
          const t2 = setTimeout(() => {
            const recv = results.length; const loss = Math.round(((COUNT - recv) / COUNT) * 100);
            setLines(p => {
              const out = [...p, '', `--- ${device.ip} ping statistics ---`, `${COUNT} packets transmitted, ${recv} received, ${loss}% packet loss`];
              if (recv > 0) {
                const avg = Math.round(results.reduce((a, b) => a + b, 0) / recv);
                const mdev = Math.round(Math.sqrt(results.reduce((a, b) => a + (b - avg) ** 2, 0) / recv));
                out.push(`round-trip min/avg/max/stddev = ${Math.min(...results)}/${avg}/${Math.max(...results)}/${mdev} ms`);
              }
              return out;
            });
            setPhase('done');
            if (recv === 0) {
              if (triggerManualRTOEvent) {
                triggerManualRTOEvent(device);
              } else if (triggerSnackbar) {
                triggerSnackbar(`Manual ping test failed for ${device.name} (${device.ip}) - Request Timeout!`, 'DOWN');
              }
            }
          }, 400);
          timers.current.push(t2);
        }
      }, 600 + seq * 900);
      timers.current.push(t);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
        <h3 className="section-title flex-1 mr-4" style={{ marginBottom: 0 }}>Ping Utility</h3>
        <button 
          onClick={runPing} 
          disabled={phase === 'running'} 
          className={cn(
            'text-xs font-bold uppercase tracking-wider rounded-lg border transition-all duration-200 cursor-pointer shadow-sm shrink-0', 
            phase === 'running' 
              ? 'border-white/10 text-dim cursor-not-allowed bg-transparent' 
              : 'border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 hover:border-accent/50'
          )}
          style={{ padding: '6px 14px' }}
        >
          {phase === 'running' ? 'Running…' : phase === 'done' ? 'Run Again' : 'Run Test'}
        </button>
      </div>

      {/* Simulated premium terminal window */}
      <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-[#070b13]/85 shadow-lg flex flex-col">
        {/* Terminal Title Bar / OS Controls */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-black/45 border-b border-white/[0.04] shrink-0 select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-offline opacity-60 hover:opacity-100 transition-opacity" style={{ filter: 'brightness(0.9)' }} />
            <span className="w-2 h-2 rounded-full bg-warning opacity-60 hover:opacity-100 transition-opacity" style={{ filter: 'brightness(0.9)' }} />
            <span className="w-2 h-2 rounded-full bg-online opacity-60 hover:opacity-100 transition-opacity" style={{ filter: 'brightness(0.9)' }} />
          </div>
          <span className="font-mono text-xs text-muted/40 tracking-wider">icmp_terminal.sh</span>
          <div className="w-12" /> {/* spacer */}
        </div>

        {/* Terminal Content Screen */}
        {phase === 'idle' ? (
          <div className="flex flex-col items-center justify-center gap-2 text-dim text-xs min-h-[130px] p-6 hover:bg-white/[0.01] transition-colors cursor-pointer" onClick={runPing}>
            <span className="opacity-30 text-lg font-mono">▶</span>
            <span className="font-mono text-xs text-muted/40">Ready. Click 'Run Test' or terminal to ping {device.ip}</span>
          </div>
        ) : (
          <div 
            ref={termRef} 
            className="font-mono text-xs leading-relaxed overflow-y-auto h-[140px] p-4 text-left terminal-scroll" 
            style={{ 
              backgroundColor: 'rgba(0,0,0,0.1)'
            }}
          >
            {lines.map((line, i) => (
              <div 
                key={i} 
                className={cn(
                  line.startsWith('Request timeout') ? 'text-offline/95 font-semibold' : 
                  line.startsWith('---') || line.startsWith('round-trip') ? 'text-muted/65 font-semibold mt-1' : 
                  line.startsWith('PING') ? 'text-accent/90' : 
                  line === '' ? 'h-1' : 'text-online/85'
                )}
              >
                {line || '\u00A0'}
              </div>
            ))}
            {phase === 'running' && <span className="inline-block w-1.5 h-[13px] bg-green-400/70 status-pulse ml-0.5" />}
          </div>
        )}
      </div>
    </div>
  );
}

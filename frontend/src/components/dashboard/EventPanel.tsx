import { motion, AnimatePresence } from 'framer-motion';
import { Radio, CheckCircle, Clock, XCircle, Trash2, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { DeviceEvent } from '../../types';

export function EventPanel({ events, onEventClick, isConnected, onClearEvents, onDeleteEvent }: { events: DeviceEvent[]; onEventClick?: (deviceId: string) => void; isConnected?: boolean; onClearEvents?: () => void; onDeleteEvent?: (id: string) => void }) {
  const visibleEvents = events.filter(e => e.type === 'DOWN' || e.type === 'RECOVERED');
  return (
    <div className="relative sticky top-[82px] h-[calc(100vh-7rem)] shadow-[0_10px_40px_rgba(0,0,0,0.28)] transition-all duration-300">
      {/* Background layer with fade */}
      <div className="absolute inset-0 bg-panel/100 backdrop-blur-xl border border-white/[0.05] rounded-[20px] pointer-events-none [mask-image:linear-gradient(to_right,black_5%,transparent_125%)]" />
      
      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col h-full rounded-[20px] overflow-hidden">
      {/* Header */}
      <div 
        className="border-b border-white/[0.05] bg-gradient-to-r from-white/[0.02] via-white/[0.01] to-transparent shrink-0 select-none"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: '16px 20px', 
          gap: '12px' 
        }}
      >
        <div 
          className="rounded-full bg-accent shadow-[0_0_10px_rgba(59,130,246,0.8)] shrink-0" 
          style={{ width: '8px', height: '8px' }}
        />
        <span className="font-bold text-xs tracking-wider text-white uppercase tracking-[0.1em]">
          Live Events
        </span>
        {visibleEvents.length > 0 && (
          <span 
            className="text-xs text-accent border border-accent/20 rounded-full bg-accent/10 tabular-nums font-bold tracking-widest uppercase shadow-inner shadow-accent/10"
            style={{ 
              padding: '4px 10px',
              marginLeft: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {visibleEvents.length}
          </span>
        )}
        <div className="flex-1" />
        {visibleEvents.length > 0 && onClearEvents && (
          <button
            onClick={onClearEvents}
            className="text-offline/80 hover:text-white transition-colors duration-300 bg-offline/[0.08] hover:bg-offline/[0.2] border border-offline/[0.15] hover:border-offline/[0.3] rounded-md cursor-pointer flex items-center justify-center shrink-0 shadow-sm gap-1.5 group/clear"
            style={{ padding: '4px 10px' }}
            title="Clear all events"
          >
            <Trash2 size={12} className="transition-transform duration-300 group-hover/clear:rotate-12" />
            <span className="text-xs font-bold tracking-wider uppercase">Clear</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div 
        className="flex-1 overflow-y-auto flex flex-col gap-2.5 event-scroll"
        style={{ padding: '16px 14px' }}
      >
        <AnimatePresence initial={false}>
          {visibleEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-5 text-center gap-5 my-auto">
              {/* Animated radar icon */}
              <div className="relative">
                <div className="absolute inset-0 -m-5 rounded-full border border-accent/[0.06]" />
                <div className="absolute inset-0 -m-10 rounded-full border border-accent/[0.04]" />
                <div className="absolute inset-0 -m-5 rounded-full border border-accent/10 animate-ping opacity-20" style={{ animationDuration: '2.5s' }} />
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/15 flex items-center justify-center shadow-[0_0_24px_rgba(59,130,246,0.1)]">
                  <Radio size={22} className="text-accent/70" />
                </div>
              </div>
              {/* Text */}
              <div className="max-w-[200px]">
                <h4 className="text-white text-xs font-bold tracking-wide uppercase">No Recent Events</h4>
                <p className="text-dim text-xs mt-2 leading-relaxed font-medium">Status change alerts will appear here in real time as they occur.</p>
              </div>
              {/* Ghost preview cards - matching actual event card UI */}
              <div className="w-full flex flex-col gap-2.5 opacity-[0.10] pointer-events-none select-none mt-3">
                {[
                  { t: 'DOWN' as const, name: 'AP Lobby', msg: 'Connection Timeout', time: '12:04', color: '#ef4444' },
                  { t: 'RECOVERED' as const, name: 'AP Lobby', msg: 'Connection Restored', time: '12:08', color: '#22c55e' },
                ].map((g, i) => (
                  <div key={i}
                    className="relative overflow-hidden flex gap-3 rounded-2xl border border-white/[0.04] bg-panel/90"
                    style={{ padding: '14px 14px 14px 18px' }}
                  >
                    {/* Left border strip */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-[3px]"
                      style={{ 
                        background: `linear-gradient(to bottom, transparent, ${g.color}, transparent)`,
                      }}
                    />
                    {/* Radial glow */}
                    <div 
                      className="absolute inset-0 pointer-events-none opacity-[0.04]"
                      style={{ background: `radial-gradient(circle at 100% 0%, ${g.color}, transparent 65%)` }}
                    />
                    {/* Icon container */}
                    <div 
                      className="flex h-7 w-7 items-center justify-center rounded-lg border shrink-0"
                      style={{ backgroundColor: `${g.color}08`, borderColor: `${g.color}15`, color: g.color }}
                    >
                      {g.t === 'DOWN' ? <XCircle size={13} className="stroke-[2.5px]" /> : <CheckCircle size={13} className="stroke-[2.5px]" />}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white truncate">{g.name}</span>
                        <span 
                          className={cn("shrink-0 rounded-full border text-xs font-bold uppercase tracking-[0.15em]", g.t === 'DOWN' ? 'border-offline/20 bg-offline/10 text-offline' : 'border-online/20 bg-online/10 text-online')}
                          style={{ padding: '2px 7px' }}
                        >{g.t}</span>
                      </div>
                      <span className="text-xs text-muted font-medium">{g.msg}</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock size={8} className="text-white/70 opacity-70" />
                        <span className="text-xs text-white/80 font-semibold tracking-wider uppercase tabular-nums">{g.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Status badge - synced with connection */}
              <div className={cn(
                "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mt-1",
                isConnected ? "text-online/50" : "text-offline/50"
              )}>
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isConnected ? "bg-online/40 status-pulse" : "bg-offline/40"
                )} />
                <span>{isConnected ? 'Monitoring Active' : 'Disconnected'}</span>
              </div>
            </div>
          ) : (
            visibleEvents.map(ev => {
              const eventColor = ev.type === 'DOWN' ? '#ef4444' : '#22c55e';
              const bgIcon = ev.type === 'DOWN' 
                ? <XCircle size={110} className="stroke-[1.2px]" /> 
                : <CheckCircle size={110} className="stroke-[1.2px]" />;

              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: -12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                  whileHover={{
                    y: -2,
                    scale: 1.015,
                    boxShadow: `0 12px 32px rgba(0,0,0,0.35), 0 0 30px ${eventColor}20`,
                    borderColor: `${eventColor}40`
                  }}
                  style={{
                    padding: '12px 14px 12px 16px',
                    borderColor: 'rgba(255, 255, 255, 0.04)',
                    ...({ '--hover-color': eventColor } as any)
                  }}
                  transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                  onClick={() => onEventClick?.(ev.deviceId)}
                  className="group relative shrink-0 overflow-hidden flex gap-3.5 rounded-2xl border bg-panel/90 backdrop-blur-xl transition-colors duration-300 cursor-pointer select-none hover:bg-panel"
                >
                  {/* Glowing Left Border Strip - Identical to DeviceCard */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-[4px] pointer-events-none opacity-65 group-hover:w-[5px] group-hover:opacity-95 transition-all duration-300" 
                    style={{ 
                      background: `linear-gradient(to bottom, transparent, ${eventColor}, transparent)`,
                      boxShadow: `12px 0 32px -4px ${eventColor}`,
                    }}
                  />
                  
                  {/* Radial background glow matching Stats Card */}
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-[0.04] transition-opacity duration-300 group-hover:opacity-[0.08]"
                    style={{
                      background: `radial-gradient(circle at 100% 0%, ${eventColor}, transparent 65%)`
                    }}
                  />

                  {/* Large Background Silhouette Icon matching Stats Card */}
                  <div
                    className="absolute right-[-10px] bottom-[-20px] pointer-events-none opacity-[0.03] transition-all duration-500 ease-out group-hover:scale-110 group-hover:rotate-6 group-hover:-translate-x-1.5 group-hover:-translate-y-1.5 group-hover:opacity-[0.05]"
                    style={{ color: eventColor }}
                  >
                    {bgIcon}
                  </div>

                  {/* Glassmorphic Icon Container */}
                  <div 
                    className="flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-300 shadow-sm shrink-0 group-hover:scale-115 group-hover:rotate-3"
                    style={{
                      backgroundColor: `${eventColor}08`,
                      borderColor: `${eventColor}15`,
                      color: eventColor,
                    }}
                  >
                    {ev.type === 'DOWN' ? (
                      <XCircle size={14} className="stroke-[2.5px]" />
                    ) : (
                      <CheckCircle size={14} className="stroke-[2.5px]" />
                    )}
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0 flex flex-col gap-0 z-10">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-white tracking-wide truncate group-hover:text-[var(--hover-color)] transition-colors duration-300">
                        {ev.deviceName}
                      </p>
                      <span 
                        className={cn(
                          "shrink-0 rounded-full border text-xs font-bold uppercase tracking-[0.18em]",
                          ev.type === 'DOWN'
                            ? 'border-offline/20 bg-offline/10 text-offline'
                            : 'border-online/20 bg-online/10 text-online'
                        )}
                        style={{ padding: '3px 8px' }}
                      >
                        {ev.type}
                      </span>
                    </div>
                    
                    <p className="text-xs text-muted leading-relaxed font-medium mt-0.5">
                      {ev.message}
                    </p>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock size={10} className="text-white/70 opacity-70" />
                      <span className="text-xs text-white/80 font-semibold tracking-wider uppercase tabular-nums">
                        {new Date(ev.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                      </span>
                    </div>
                  </div>

                  {/* Delete Event Button */}
                  {onDeleteEvent && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteEvent(ev.id); }}
                      className="absolute top-1.5 right-1.5 p-1.5 rounded-full text-white/30 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-offline hover:text-white cursor-pointer z-20 backdrop-blur-md hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                    >
                      <X size={13} className="stroke-[3px]" />
                    </button>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Bottom fade effect for scrolling indication */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none rounded-b-[20px]"
        style={{ background: 'linear-gradient(to top, rgba(16, 24, 40, 0.95) 0%, transparent 100%)' }}
      />
      </div>
    </div>
  );
}

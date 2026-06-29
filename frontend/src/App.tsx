import { useEffect, useState, useMemo, useRef } from 'react';
import {
  Activity, Server, CheckCircle, AlertTriangle, XCircle,
  Box, Search, WifiOff, SlidersHorizontal, RotateCcw, SearchX, Loader, Zap, Clock, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './utils/cn';

import type { Device, FilterType } from './types';
import { getStatus } from './utils/network';

import { CustomSelect } from './components/ui/CustomSelect';
import { EventPanel } from './components/dashboard/EventPanel';
import { DeviceCard } from './components/dashboard/DeviceCard';
import { DeviceDetailPanel } from './components/dashboard/DeviceDetailPanel';
import { Footer } from './components/layout/Footer';
import { useMonitoring } from './context/MonitoringContext';

import './index.css';

export default function App() {
  const {
    isConnected, devices, results, uptimeHistory, latencyHistory,
    events, incidents, snackbars, isLoading,
    triggerSnackbar, triggerManualRTOEvent, dismissSnackbar,
    clearEvents, deleteEvent
  } = useMonitoring();

  const [scrolled, setScrolled] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [isHoveringTop, setIsHoveringTop] = useState(false);
  const lastScrollY = useRef(0);
  const [now, setNow] = useState(new Date());
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const selectedDevice = useMemo(() => devices.find(d => d.id === selectedDeviceId), [devices, selectedDeviceId]);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  const [locationFilter, setLocationFilter] = useState('all');

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Scroll
  useEffect(() => {
    const onScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 40);

      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setNavVisible(false); // hide when scrolling down past 60px
      } else if (currentScrollY < lastScrollY.current) {
        setNavVisible(true); // show when scrolling up
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setIsHoveringTop(e.clientY < 80);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const finalNavVisible = navVisible || isHoveringTop;


  // Derived data
  const allLocations = useMemo(() => ['all', ...Array.from(new Set(devices.map(d => d.location)))], [devices]);

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

  const filteredGrouped = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = devices.filter(d => {
      const matchSearch = !q || d.name.toLowerCase().includes(q) || d.ip.includes(q);
      const matchStatus = statusFilter === 'all' || getStatus(results[d.id]) === statusFilter;
      const matchLocation = locationFilter === 'all' || d.location === locationFilter;
      return matchSearch && matchStatus && matchLocation;
    });
    const groups: Record<string, Device[]> = {};
    filtered.forEach(d => { groups[d.location] ??= []; groups[d.location].push(d); });
    return groups;
  }, [devices, results, search, statusFilter, locationFilter]);

  const avgLatency = useMemo(() => {
    const activeTimes = Object.values(results)
      .filter(r => r.alive && typeof r.time === 'number')
      .map(r => r.time as number);
    if (activeTimes.length === 0) return 0;
    const sum = activeTimes.reduce((acc, t) => acc + t, 0);
    return Math.round(sum / activeTimes.length);
  }, [results]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full flex-1 w-full text-text flex flex-col relative overflow-y-auto pb-0">

      <div className="relative z-10 flex flex-col flex-1">
      {/* ── HEADER ── */}
      <header
        className={cn(
          'z-40 backdrop-blur-xl shrink-0 sticky border navbar-premium transition-all duration-500 ease-out',
          scrolled
            ? 'mx-4 lg:mx-8 xl:mx-auto max-w-[1700px] rounded-2xl bg-[#101828]/60 border-white/[0.08]'
            : 'top-0 border-b border-white/[0.04] bg-panel/10',
          finalNavVisible ? 'translate-y-0' : '-translate-y-full'
        )}
        style={{
          top: scrolled ? '12px' : '0',
          boxShadow: scrolled
            ? '0 16px 40px rgba(0,0,0,0.45), 0 6px 20px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.06)'
            : '0 1px 0 rgba(255,255,255,0.04)',
        }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`);
          e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`);
        }}
      >
        {/* Glowing bottom accent line */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[1px] pointer-events-none"
          style={{ 
            background: scrolled
              ? 'linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(59,130,246,0.15), transparent)',
            transition: 'background 0.5s ease'
          }}
        />

        <div
          className={cn(
            "w-full max-w-[1720px] mx-auto",
            !scrolled && "page-container-x"
          )}
          style={{
            paddingTop: scrolled ? '10px' : '14px',
            paddingBottom: scrolled ? '10px' : '14px',
            paddingLeft: scrolled ? '24px' : undefined,
            paddingRight: scrolled ? '24px' : undefined,
            transition: 'padding 0.45s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 py-1">
            {/* Brand */}
            <div className="flex items-center gap-3 md:gap-4 min-w-0 shrink-0">
              <button
                onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/[0.08] transition-colors -ml-2 shrink-0"
                title="Toggle Sidebar"
              >
                <Menu size={20} className="text-white/90" />
              </button>
              <div className="flex items-center gap-3 md:gap-4 group cursor-pointer">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 shadow-inner shadow-accent/10 shrink-0 transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-[360deg] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                  <Activity className="text-accent" size={20} />
                </div>
                <div className="min-w-0 flex flex-col justify-center transition-transform duration-300 group-hover:translate-x-1">
                  <h1 className="type-page-title transition-colors duration-300 group-hover:text-accent">Mesra Network Monitoring</h1>
                  <p className="type-body-sm text-dim mt-1 leading-none">Hotel Mesra Samarinda</p>
                </div>
              </div>
            </div>

            {/* Controls Group */}
            <div className="flex flex-wrap items-center gap-2 lg:gap-3 flex-1 min-w-0 justify-end">
              {/* Search Input */}
              <motion.div 
                whileHover={{ scale: 1.015, boxShadow: '0 0 16px rgba(59,130,246,0.15)' }}
                whileTap={{ scale: 0.99 }}
                className="relative flex-1 min-w-[120px] max-w-[320px] group shrink rounded-full transition-shadow duration-300"
              >
                <Search size={15} className="absolute left-[18px] top-1/2 -translate-y-1/2 text-dim pointer-events-none z-10 transition-all duration-300 group-focus-within:text-accent group-focus-within:scale-110" />
                <input
                  id="search-devices"
                  type="text"
                  placeholder="Search devices or IP…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full h-[42px] bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.07] border border-white/[0.08] focus:border-accent/40 text-sm text-white placeholder-dim rounded-full outline-none transition-all duration-300 shadow-inner shadow-black/20 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
                  style={{ paddingLeft: '46px', paddingRight: '24px' }}
                />
              </motion.div>



              {/* Location dropdown */}
              <div className="relative w-[110px] lg:w-[120px] shrink-0">
                <CustomSelect
                  value={locationFilter}
                  onChange={(v) => setLocationFilter(v)}
                  options={allLocations.map(loc => ({
                    value: loc,
                    label: loc === 'all' ? 'All Areas' : loc
                  }))}
                />
              </div>

              {/* Premium System Status Capsule */}
              <motion.div
                whileHover={{ scale: 1.015, borderColor: 'rgba(255, 255, 255, 0.15)' }}
                className="flex h-[42px] items-center gap-3 bg-white/[0.03] border border-white/[0.08] rounded-full shadow-inner shadow-black/10 shrink-0 select-none group/capsule transition-all duration-300"
                style={{ paddingLeft: '16px', paddingRight: '16px' }}
              >
                {/* Clock */}
                <div className="hidden sm:flex items-center gap-2">
                  <Clock size={12} className="text-dim transition-colors duration-300 group-hover/capsule:text-white/50" />
                  <span className="font-mono font-semibold text-xs tracking-wider tabular-nums text-muted transition-colors duration-300 group-hover/capsule:text-white">
                    {now.toLocaleTimeString('en-US', { hour12: false })}
                  </span>
                </div>

                {/* Divider */}
                <div className="hidden sm:block h-4 w-px bg-white/[0.08] shrink-0" />

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
                <div className="hidden lg:flex items-center gap-1.5">
                  <Zap size={11} className="text-accent/60" />
                  <span className="text-xs font-bold tabular-nums text-white/90">{stats.online}</span>
                  <span className="text-xs text-white/30">/</span>
                  <span className="text-xs text-white/50">{stats.total}</span>
                </div>

                {/* Divider */}
                <div className="hidden lg:block h-4 w-px bg-white/[0.08] shrink-0" />

                {/* Quick Stats: Avg Latency */}
                <div className="hidden lg:flex items-center gap-1.5">
                  <span className="text-xs font-bold text-accent tabular-nums font-mono">{avgLatency}ms</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {/* ── CONTENT AREA (Stats, Grid, Footer) ── */}
      <div
        className="w-full max-w-[1720px] mx-auto flex-1 flex flex-col page-container-x pb-16"
        style={{ paddingTop: '56px' }}
      >

        {/* ── STATS SECTION HEADER ── */}
        <div className="flex items-center gap-3 pb-5 w-full">
          <div className="h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
          <h2 className="font-bold tracking-wide text-white drop-shadow-[0_0_8px_rgba(59,130,246,0.3)] shrink-0 uppercase text-lg">
            System Overview
          </h2>
          <div className="flex-1 h-[1.5px] bg-gradient-to-r from-white/[0.12] to-transparent ml-3" />
        </div>

        {/* ── STATS ──────────────────────────────────────────────────────────── */}
        <div
          className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-6"
          style={{ marginTop: '24px', marginBottom: '64px' }}
        >

          {[
            {
              id: 'total',
              label: 'Total Devices',
              value: stats.total,
              color: '#3b82f6',
              miniIcon: <Server size={18} className="stroke-[2.2px]" />,
              bgIcon: <Server size={140} className="stroke-[1.2px]" />,
            },
            {
              id: 'online',
              label: 'Active',
              value: stats.online,
              color: '#22c55e',
              miniIcon: <CheckCircle size={18} className="stroke-[2.2px]" />,
              bgIcon: <CheckCircle size={140} className="stroke-[1.2px]" />,
            },
            {
              id: 'warning',
              label: 'Warning',
              value: stats.warning,
              color: '#f59e0b',
              miniIcon: <AlertTriangle size={18} className="stroke-[2.2px]" />,
              bgIcon: <AlertTriangle size={140} className="stroke-[1.2px]" />,
            },
            {
              id: 'offline',
              label: 'Offline',
              value: stats.offline,
              color: '#ef4444',
              miniIcon: <XCircle size={18} className="stroke-[2.2px]" />,
              bgIcon: <XCircle size={140} className="stroke-[1.2px]" />,
            },
            {
              id: 'unknown',
              label: 'Unknown',
              value: stats.unknown,
              color: '#94a3b8',
              miniIcon: <Box size={18} className="stroke-[2.2px]" />,
              bgIcon: <Box size={140} className="stroke-[1.2px]" />,
            },
          ].map((s) => {
            // Compute dynamic description text
            let subtext = '';
            if (s.id === 'total') {
              subtext = 'Monitored hosts configured';
            } else {
              const pct = stats.total ? Math.round((s.value / stats.total) * 100) : 0;
              if (s.id === 'online') {
                subtext = `${pct}% of total devices online`;
              } else if (s.id === 'warning') {
                subtext = `${pct}% unstable status`;
              } else if (s.id === 'offline') {
                subtext = `${pct}% disconnected`;
              } else if (s.id === 'unknown') {
                subtext = `${pct}% pending sync`;
              }
            }

            const isSelected = (s.id === 'total' && statusFilter === 'all') || (s.id === statusFilter);

            return (
              <motion.div
                key={s.label}
                onClick={() => setStatusFilter(s.id === 'total' ? 'all' : s.id as FilterType)}
                whileHover={{
                  y: -4,
                  scale: 1.015,
                  boxShadow: `0 16px 40px rgba(0,0,0,0.35), 0 0 40px ${s.color}20`,
                  borderColor: `${s.color}45`
                }}
                style={{
                  boxShadow: isSelected
                    ? `0 12px 32px rgba(0,0,0,0.3), 0 0 30px ${s.color}20`
                    : `0 8px 24px rgba(0,0,0,0.2)`,
                  borderColor: isSelected
                    ? `${s.color}45`
                    : `rgba(255, 255, 255, 0.05)`,
                  backgroundColor: isSelected
                    ? `${s.color}05`
                    : undefined
                }}
                transition={{ duration: 0.18 }}
                className={cn(
                  "group relative overflow-hidden rounded-3xl cursor-pointer select-none",
                  "border",
                  "bg-panel/90 backdrop-blur-xl",
                  "transition-colors duration-300",
                  "hover:bg-panel",
                  "min-h-[148px]"
                )}
              >
                {/* Glowing Left Border Strip - Matches DeviceCard */}
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 transition-all duration-300",
                    isSelected ? "w-[6px] opacity-95" : "w-[4px] opacity-65 group-hover:w-[6px] group-hover:opacity-90"
                  )}
                  style={{
                    background: `linear-gradient(to bottom, transparent, ${s.color}, transparent)`,
                    boxShadow: isSelected
                      ? `16px 0 40px -2px ${s.color}`
                      : `12px 0 32px -4px ${s.color}`,
                  }}
                />
 
                {/* Diagonal / Radial background glow */}
                <div
                  className={cn(
                    "absolute inset-0 pointer-events-none transition-opacity duration-300",
                    isSelected ? "opacity-[0.09]" : "opacity-[0.04] group-hover:opacity-[0.08]"
                  )}
                  style={{
                    background: `radial-gradient(circle at 100% 0%, ${s.color}, transparent 65%)`,
                  }}
                />
 
                {/* Large Background Silhouette Icon */}
                <div
                  className="absolute right-[-15px] bottom-[-25px] pointer-events-none opacity-[0.035] transition-all duration-500 ease-out group-hover:scale-110 group-hover:rotate-6 group-hover:-translate-x-2 group-hover:-translate-y-2 group-hover:opacity-[0.06]"
                  style={{ color: s.color }}
                >
                  {s.bgIcon}
                </div>
 
                {/* Content area: layout matches the premium dashboard grid */}
                <div
                  className="relative z-10 flex flex-col justify-between h-full min-h-[148px]"
                  style={{ padding: '24px 24px 24px 28px' }}
                >
                  {/* Top Row: Label & Status Icon */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]"
                        style={{
                          background: s.color,
                          color: s.color,
                        }}
                      />
                      <span
                        className="text-xs font-bold uppercase tracking-[0.2em]"
                        style={{ color: s.color }}
                      >
                        {s.label}
                      </span>
                    </div>
 
                    {/* Glassmorphic Icon Container */}
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-2xl border transition-all duration-300 shadow-sm group-hover:scale-110 group-hover:rotate-3"
                      style={{
                        backgroundColor: `${s.color}08`,
                        borderColor: `${s.color}15`,
                        color: s.color,
                        boxShadow: `0 0 16px ${s.color}05`
                      }}
                    >
                      {s.miniIcon}
                    </div>
                  </div>

                  {/* Middle & Bottom Rows */}
                  <div className="mt-4 flex flex-col justify-end items-center">
                    {/* Number Value */}
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-black tracking-tight text-white tabular-nums leading-none">
                        {s.value}
                      </span>
                    </div>

                    {/* Subtext description */}
                    <span className="mt-2.5 text-xs text-muted font-medium tracking-wide text-center">
                      {subtext}
                    </span>
                  </div>
                </div>

                {/* Inner ring highlight */}
                <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/[0.02] pointer-events-none" />
              </motion.div>
            );
          })}
        </div>

        {/* ── MAIN GRID ──────────────────────────────────────────────────────── */}
        <div className="grid gap-6 mb-24 grid-cols-1 lg:grid-cols-12">

          {/* ── Devices section ─────────────────────────────────────────────── */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col pb-12">

            {/* Skeleton */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-panel border border-border rounded-xl h-[200px] skeleton-shimmer" />
                ))}
              </div>
            )}

            {/* Empty - No devices OR Connecting */}
            {!isLoading && devices.length === 0 && (
              <div className="relative flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent overflow-hidden" style={{ padding: '80px 24px' }}>
                {/* Background decoration */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-accent/[0.03] blur-3xl" />
                  <div className="absolute top-8 left-8 w-1 h-1 rounded-full bg-accent/30 animate-pulse" />
                  <div className="absolute bottom-12 right-16 w-1.5 h-1.5 rounded-full bg-white/10 animate-pulse" style={{ animationDelay: '1s' }} />
                  <div className="absolute top-16 right-24 w-1 h-1 rounded-full bg-warning/20 animate-pulse" style={{ animationDelay: '0.5s' }} />
                </div>
                {isConnected ? (
                  <>
                    <div className="relative mb-6">
                      <div className="absolute inset-0 -m-4 rounded-full border border-white/[0.04] animate-ping opacity-20" style={{ animationDuration: '3s' }} />
                      <div className="absolute inset-0 -m-8 rounded-full border border-white/[0.03]" />
                      <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/15 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                        <WifiOff size={26} className="text-accent/70" />
                      </div>
                    </div>
                    <h3 className="text-white text-sm font-bold tracking-wide">No Devices Configured</h3>
                    <p className="text-dim text-xs mt-2 leading-relaxed max-w-[280px] text-center font-medium">Add network devices to your backend configuration to begin real-time monitoring.</p>
                    <div className="mt-5 flex items-center gap-2 text-xs text-accent/60 bg-accent/[0.06] border border-accent/10 rounded-full font-semibold uppercase tracking-wider" style={{ padding: '6px 14px' }}>
                      <Server size={12} />
                      <span>Awaiting Configuration</span>
                    </div>
                  </>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center"
                  >
                    <div className="relative mb-8 flex items-center justify-center">
                      {/* Smooth Framer Motion Radar Rings */}
                      <motion.div 
                        className="absolute rounded-full border border-accent/[0.25]"
                        initial={{ width: 64, height: 64, opacity: 0.5 }}
                        animate={{ width: 140, height: 140, opacity: 0 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                      />
                      <motion.div 
                        className="absolute rounded-full border border-accent/[0.15]"
                        initial={{ width: 64, height: 64, opacity: 0.5 }}
                        animate={{ width: 180, height: 180, opacity: 0 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
                      />
                      <motion.div 
                        className="absolute rounded-full border border-accent/[0.05]"
                        initial={{ width: 64, height: 64, opacity: 0.5 }}
                        animate={{ width: 220, height: 220, opacity: 0 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1.2 }}
                      />
                      
                      {/* Central glowing icon */}
                      <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.2)] overflow-hidden">
                        <div className="absolute inset-0 bg-accent/10 rounded-full" />
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 origin-center"
                        >
                          <div className="w-1/2 h-1/2 bg-gradient-to-br from-accent/40 to-transparent" style={{ borderTopLeftRadius: '100%' }} />
                        </motion.div>
                        <Activity size={32} className="text-accent/90 relative z-10" />
                      </div>
                    </div>
                    <h3 className="text-white text-base font-bold tracking-wide mt-2">Initializing Network...</h3>
                    <p className="text-dim text-xs mt-2 leading-relaxed max-w-[300px] text-center font-medium">Connecting to monitoring backend and scanning for devices. Please wait.</p>
                    
                    {/* Loading dots */}
                    <div className="mt-6 flex items-center gap-3 text-xs text-accent/80 bg-accent/[0.08] border border-accent/20 rounded-full font-semibold uppercase tracking-wider shadow-[0_0_20px_rgba(59,130,246,0.15)]" style={{ padding: '8px 18px' }}>
                      <Loader size={14} className="animate-spin" />
                      <span>Establishing Connection</span>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* No results from search */}
            {!isLoading && devices.length > 0 && Object.keys(filteredGrouped).length === 0 && search.trim() !== '' && (
              <div className="relative flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent overflow-hidden" style={{ padding: '80px 24px' }}>
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full bg-accent/[0.03] blur-3xl" />
                </div>
                <div className="relative mb-6">
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/15 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                    <SearchX size={24} className="text-accent/70" />
                  </div>
                </div>
                <h3 className="text-white text-sm font-bold tracking-wide">No Results Found</h3>
                <p className="text-dim text-xs mt-2 leading-relaxed max-w-[280px] text-center font-medium">
                  No devices match &ldquo;<span className="text-white/70 font-semibold">{search}</span>&rdquo;. Check the spelling or try a different keyword.
                </p>
                <button
                  onClick={() => setSearch('')}
                  className="group mt-5 flex items-center gap-2 text-xs text-white/80 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] hover:border-white/[0.15] rounded-full font-semibold uppercase tracking-wider cursor-pointer transition-all duration-300"
                  style={{ padding: '7px 16px' }}
                >
                  <Search size={11} />
                  <span>Clear Search</span>
                </button>
              </div>
            )}

            {/* No results from dropdown filter */}
            {!isLoading && devices.length > 0 && Object.keys(filteredGrouped).length === 0 && search.trim() === '' && (
              <div className="relative flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent overflow-hidden" style={{ padding: '80px 24px' }}>
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full bg-warning/[0.03] blur-3xl" />
                </div>
                <div className="relative mb-6">
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-warning/15 to-warning/5 border border-warning/15 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.08)]">
                    <SlidersHorizontal size={24} className="text-warning/70" />
                  </div>
                </div>
                <h3 className="text-white text-sm font-bold tracking-wide">No Matching Devices</h3>
                <p className="text-dim text-xs mt-2 leading-relaxed max-w-[260px] text-center font-medium">Your current filter combination didn't return any results. Try adjusting your criteria.</p>
                <button
                  onClick={() => { setSearch(''); setStatusFilter('all'); setLocationFilter('all'); }}
                  className="group mt-5 flex items-center gap-2 text-xs text-white/80 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] hover:border-white/[0.15] rounded-full font-semibold uppercase tracking-wider cursor-pointer transition-all duration-300"
                  style={{ padding: '7px 16px' }}
                >
                  <RotateCcw size={11} className="transition-transform duration-500 group-hover:-rotate-180" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}

            {/* Location groups */}
            {!isLoading && Object.entries(filteredGrouped).map(([location, locDevices], i) => (
              <div
                key={location}
                className="flex flex-col gap-6 fade-in"
                style={i > 0 ? { marginTop: '48px' } : undefined}
              >
                {/* Group header */}
                <div className="flex items-center gap-3 pb-3 w-full">
                  <div className="h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                  <h2 className="font-bold tracking-wide text-white drop-shadow-[0_0_8px_rgba(59,130,246,0.3)] shrink-0 text-lg">
                    {location}
                  </h2>
                  <span
                    className="text-xs text-accent border border-accent/20 rounded-full bg-accent/10 tabular-nums font-bold tracking-widest uppercase shadow-inner shadow-accent/10 ml-1 shrink-0"
                    style={{ padding: '4px 10px' }}
                  >
                    {locDevices.length} DEVICE{locDevices.length !== 1 ? 'S' : ''}
                  </span>
                  {/* Fading line to the right, identical to .section-title::after */}
                  <div className="flex-1 h-[1.5px] bg-gradient-to-r from-white/[0.12] to-transparent ml-3" />
                </div>

                {/* Cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-6">
                  {locDevices.map(device => (
                    <DeviceCard
                      key={device.id}
                      device={device}
                      result={results[device.id]}
                      history={uptimeHistory[device.id] || []}
                      latencyHistory={latencyHistory[device.id] || []}

                      onClick={() => setSelectedDeviceId(device.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── Event history sidebar ──────────────────────────────────────── */}
          <div className="lg:col-span-4 xl:col-span-3">
            <EventPanel
              events={events.filter(e => devices.some(d => d.id === e.deviceId))}
              onEventClick={(deviceId) => setSelectedDeviceId(deviceId)}
              isConnected={isConnected}
              onClearEvents={clearEvents}
              onDeleteEvent={deleteEvent}
            />
          </div>

        </div>

        {/* ── Detail Panel ─────────────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedDevice && (
            <DeviceDetailPanel
              device={selectedDevice}
              result={results[selectedDevice.id]}
              history={uptimeHistory[selectedDevice.id] || []}
              latencyHistory={latencyHistory[selectedDevice.id] || []}
              events={events.filter(e => e.deviceId === selectedDevice.id)}
              deviceIncidents={incidents[selectedDevice.id] || []}
              triggerSnackbar={triggerSnackbar}
              triggerManualRTOEvent={triggerManualRTOEvent}
              onClose={() => setSelectedDeviceId(null)}
            />
          )}
        </AnimatePresence>

        {/* ── Snackbar toasts ──────────────────────────────────────────────── */}
        <div className="fixed bottom-5 right-5 flex flex-col gap-2.5 z-[110] pointer-events-none">
          <AnimatePresence>
            {snackbars.map(snack => {
              const snackColor = snack.type === 'DOWN' ? '#ef4444' : '#22c55e';
              return (
                <motion.div
                  key={snack.id}
                  initial={{ opacity: 0, y: 16, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95, transition: { duration: 0.18 } }}
                  whileHover={{
                    scale: 1.015,
                    boxShadow: `0 20px 48px rgba(0,0,0,0.5), 0 0 30px ${snackColor}20`,
                    borderColor: `${snackColor}45`
                  }}
                  transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                  onClick={() => dismissSnackbar(snack.id)}
                  style={{ 
                    padding: '10px 14px',
                    ...({ '--hover-color': snackColor } as any)
                  }}
                  className={cn(
                    'pointer-events-auto cursor-pointer active:scale-[0.98] group relative overflow-hidden flex items-center gap-3 rounded-xl border border-white/[0.06] backdrop-blur-xl bg-panel/95 transition-colors duration-300 w-[350px] sm:w-[380px] shadow-[0_16px_40px_rgba(0,0,0,0.45)] hover:bg-panel/98',
                  )}
                >
                  {/* Glowing Left Border Strip - Identical to DeviceCard */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[4px] pointer-events-none opacity-70 group-hover:w-[6px] group-hover:opacity-95 transition-all duration-300"
                    style={{
                      background: `linear-gradient(to bottom, transparent, ${snackColor}, transparent)`,
                      boxShadow: `12px 0 32px -4px ${snackColor}`,
                    }}
                  />

                  {/* Bottom-right Corner Gradient - Identical to DeviceCard */}
                  <div className={cn(
                    "absolute inset-0 opacity-10 pointer-events-none bg-gradient-to-br from-transparent via-transparent",
                    snack.type === 'DOWN' ? 'to-red-500/40' : 'to-green-500/40'
                  )} />

                  {/* Icon Area */}
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 shadow-md relative z-10 group-hover:scale-110 group-hover:rotate-3',
                    snack.type === 'DOWN'
                      ? 'bg-offline/10 border-offline/20 text-offline shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                      : 'bg-online/10 border-online/20 text-online shadow-[0_0_12px_rgba(34,197,94,0.2)]',
                  )}>
                    {snack.type === 'DOWN' ? (
                      <XCircle size={15} className="stroke-[2.5px]" />
                    ) : (
                      <CheckCircle size={15} className="stroke-[2.5px]" />
                    )}
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5 relative z-10">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-bold text-white leading-tight tracking-wide group-hover:text-[var(--hover-color)] transition-colors duration-300">
                        {snack.type === 'DOWN' ? 'Device Down' : 'Recovered'}
                      </p>
                      <p className="text-xs text-white/40 font-semibold tracking-wider uppercase tabular-nums">
                        {snack.timestamp || now.toLocaleTimeString('en-US', { hour12: false })}
                      </p>
                    </div>
                    <p className="text-xs text-muted truncate leading-normal">{snack.message}</p>
                  </div>

                {/* Progress Loading Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/[0.03] overflow-hidden pointer-events-none">
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 5, ease: 'linear' }}
                    className={cn(
                      "h-full rounded-r-full",
                      snack.type === 'DOWN'
                        ? 'bg-offline shadow-[0_0_8px_#ef4444]'
                        : 'bg-online shadow-[0_0_8px_#22c55e]'
                    )}
                  />
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </div>

        {/* Dedicated Spacer for Bottom Viewport Breathing Room */}
        <div className="h-12 w-full shrink-0 pointer-events-none" />
      </div>

      <Footer />
      </div>
    </div >
  );
}

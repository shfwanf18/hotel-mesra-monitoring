import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Device, PingResult, DeviceEvent, SnackbarMsg, HistoryItem, Incident } from '../types';
import { getStatus } from '../utils/network';

interface MonitoringContextType {
  isConnected: boolean;
  devices: Device[];
  results: Record<string, PingResult>;
  uptimeHistory: Record<string, HistoryItem[]>;
  latencyHistory: Record<string, number[]>;
  events: DeviceEvent[];
  incidents: Record<string, Incident[]>;
  snackbars: SnackbarMsg[];
  isLoading: boolean;
  lastUpdate: Date | null;
  triggerSnackbar: (message: string, type: 'DOWN' | 'RECOVERED') => void;
  triggerManualRTOEvent: (device: Device) => void;
  dismissSnackbar: (id: string) => void;
  clearEvents: () => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  refetchDevices: () => Promise<void>;
}

const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined);

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = `${SOCKET_URL}/devices`;

export function MonitoringProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [results, setResults] = useState<Record<string, PingResult>>({});
  const [uptimeHistory, setUptimeHistory] = useState<Record<string, HistoryItem[]>>({});
  const [latencyHistory, setLatencyHistory] = useState<Record<string, number[]>>({});
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const [incidents, setIncidents] = useState<Record<string, Incident[]>>({});
  const [snackbars, setSnackbars] = useState<SnackbarMsg[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const triggerSnackbar = (message: string, type: 'DOWN' | 'RECOVERED') => {
    const snack: SnackbarMsg = {
      id: Math.random().toString(36).slice(2, 9),
      type,
      message,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
    };
    setSnackbars(prev => [...prev, snack]);
    setTimeout(() => setSnackbars(prev => prev.filter(s => s.id !== snack.id)), 5000);
  };

  const dismissSnackbar = (id: string) => {
    setSnackbars(prev => prev.filter(s => s.id !== id));
  };

  const triggerManualRTOEvent = async (device: Device) => {
    triggerSnackbar(`Manual ping test failed for ${device.name} (${device.ip}) - Request Timeout!`, 'DOWN');

    try {
      await fetch(`${SOCKET_URL}/events/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: device.id,
          deviceName: device.name,
          message: '100% Packet Loss'
        })
      });
      // Incident will be created locally to maintain UI UX
      const inc: Incident = { id: Math.random().toString(36).slice(2, 9), deviceId: device.id, startTime: new Date().toISOString(), recovered: false };
      setIncidents(prev => ({ ...prev, [device.id]: [inc, ...(prev[device.id] || [])].slice(0, 20) }));
    } catch (e) {
      console.error('Failed to trigger manual event', e);
    }
  };

  const clearEvents = async () => {
    try {
      const res = await fetch(`${SOCKET_URL}/events`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      setEvents([]);
    } catch (err) {
      console.error('Failed to clear events:', err);
      alert('Gagal menghapus event. Pastikan backend sudah direstart agar endpoint DELETE tersedia.');
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const res = await fetch(`${SOCKET_URL}/events/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Failed to delete event:', err);
      alert('Gagal menghapus event. Pastikan backend sudah direstart agar endpoint DELETE tersedia.');
    }
  };

  const refetchDevices = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setDevices(data);
    } catch (err) {
      console.error('Failed to refetch devices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 1. Initial Data Fetch
    refetchDevices();

    fetch(`${SOCKET_URL}/events`)
      .then(r => r.json())
      .then((data: Array<Record<string, string>>) => {
        const normalized: DeviceEvent[] = data.map(e => ({
          id: e.id,
          deviceId: e.deviceId,
          deviceName: e.deviceName,
          type: e.type as 'DOWN' | 'RECOVERED',
          timestamp: e.occurredAt ?? e.timestamp ?? new Date().toISOString(),
          message: e.message,
        }));
        setEvents(normalized);
      })
      .catch(err => console.error('Failed to fetch events:', err));

    // 2. Socket Connection
    const socket: Socket = io(SOCKET_URL);
    
    // If connection happens after 2 seconds of page load (either backend was offline during load, or backend restarted), trigger a full reload.
    let isInitialMount = true;
    setTimeout(() => { isInitialMount = false; }, 2000);

    socket.on('connect', () => {
      if (!isInitialMount) {
        window.location.reload();
      } else {
        setIsConnected(true);
        refetchDevices(); // Ensure data is fetched if socket connects quickly
      }
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('ping-result', (data: PingResult) => {
      setResults(prev => ({ ...prev, [data.id]: data }));
      setLastUpdate(new Date());
      
      const s = getStatus(data);
      const nowObj = new Date(data.timestamp || Date.now());
      const dateStr = nowObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
      const timeStr = nowObj.toLocaleTimeString('en-US', { hour12: false });
      const timestamp = `${dateStr}, ${timeStr}`;

      setUptimeHistory(prev => ({
        ...prev,
        [data.id]: [
          ...(prev[data.id] || []),
          {
            status: s,
            timestamp,
            latency: data.alive && typeof data.time === 'number' ? (data.time as number) : 'unknown'
          } as HistoryItem
        ].slice(-40),
      }));
      setLatencyHistory(prev => ({
        ...prev,
        [data.id]: [...(prev[data.id] || []), data.alive && typeof data.time === 'number' ? data.time : 0].slice(-40),
      }));
    });

    socket.on('device-event', (raw: Omit<DeviceEvent, 'id'> & { id?: string }) => {
      const ev: DeviceEvent = { 
        ...raw, 
        id: raw.id ?? Math.random().toString(36).slice(2, 9),
        timestamp: raw.timestamp ?? new Date().toISOString(),
      };
      setEvents(prev => [ev, ...prev].slice(0, 50));
      
      if (ev.type === 'DOWN') {
        const inc: Incident = { id: ev.id, deviceId: ev.deviceId, startTime: ev.timestamp, recovered: false };
        setIncidents(prev => ({ ...prev, [ev.deviceId]: [inc, ...(prev[ev.deviceId] || [])].slice(0, 20) }));
      } else if (ev.type === 'RECOVERED') {
        setIncidents(prev => {
          const list = prev[ev.deviceId] || [];
          const open = list.find(i => !i.recovered);
          if (!open) return prev;
          const duration = new Date(ev.timestamp).getTime() - new Date(open.startTime).getTime();
          return { ...prev, [ev.deviceId]: list.map(i => i.id === open.id ? { ...i, endTime: ev.timestamp, duration, recovered: true } : i) };
        });
      }
      if (ev.type === 'DOWN' || ev.type === 'RECOVERED') {
        triggerSnackbar(`${ev.deviceName} → ${ev.type}`, ev.type);
      }
    });

    return () => { socket.disconnect(); };
  }, []);

  return (
    <MonitoringContext.Provider value={{
      isConnected, devices, results, uptimeHistory, latencyHistory,
      events, incidents, snackbars, isLoading, lastUpdate,
      triggerSnackbar, triggerManualRTOEvent, dismissSnackbar,
      clearEvents, deleteEvent, refetchDevices
    }}>
      {children}
    </MonitoringContext.Provider>
  );
}

export function useMonitoring() {
  const context = useContext(MonitoringContext);
  if (context === undefined) {
    throw new Error('useMonitoring must be used within a MonitoringProvider');
  }
  return context;
}

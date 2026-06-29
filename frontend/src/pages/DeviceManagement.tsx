import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor, Plus, Edit2, Trash2, Search, Server, Wifi, Router,
  AlertTriangle, CheckCircle, Loader, Menu, ArrowUp, ArrowDown, X, XCircle, HelpCircle,
  Tag, Globe, MapPin, Cpu, HardDrive, Network, Copy, ExternalLink, Activity,
  Check
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useSidebar } from '../components/layout/AppLayout';
import { CustomSelect } from '../components/ui/CustomSelect';
import { CreatableSelect } from '../components/ui/CreatableSelect';
import { useMonitoring } from '../context/MonitoringContext';

import { getStatus } from '../utils/network';
import { Footer } from '../components/layout/Footer';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/devices';

interface Device {
  id: string;
  name: string;
  ip: string;
  type: 'AP' | 'Router' | 'Server';
  location: string;
  macAddress?: string;
  firmware?: string;
  model?: string;
  description?: string;
  systemUptime?: string;
  isActive?: boolean;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  AP: Wifi,
  Router: Router,
  Server: Server,
};

const TYPE_COLORS: Record<string, string> = {
  AP: 'text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/20',
  Router: 'text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20',
  Server: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/20',
};

const TYPE_ACCENT: Record<string, string> = {
  AP: '#22c55e',
  Router: '#f59e0b',
  Server: '#3b82f6',
};

// ── Snackbar Types ──────────────────────────────────────────────────────────

interface CrudSnackbar {
  id: string;
  type: 'success';
  title: string;
  message: string;
  timestamp: string;
}

// ── Modal Form ──────────────────────────────────────────────────────────────

interface FormData {
  name: string;
  ip: string;
  type: 'AP' | 'Router' | 'Server';
  location: string;
  macAddress: string;
  firmware: string;
  model: string;
  description: string;
}

const EMPTY_FORM: FormData = {
  name: '', ip: '', type: 'Server', location: '',
  macAddress: '', firmware: '', model: '', description: '',
};

function DeviceFormModal({
  device,
  existingLocations = [],
  existingModels = [],
  existingFirmwares = [],
  onClose,
  onSaved,
}: {
  device?: Device;
  existingLocations?: string[];
  existingModels?: string[];
  existingFirmwares?: string[];
  onClose: () => void;
  onSaved: (action: 'created' | 'updated', name: string) => void;
}) {
  const isEdit = !!device;
  const [form, setForm] = useState<FormData>(device ? {
    name: device.name,
    ip: device.ip,
    type: device.type,
    location: device.location,
    macAddress: device.macAddress ?? '',
    firmware: device.firmware ?? '',
    model: device.model ?? '',
    description: device.description ?? '',
  } : EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [copiedIP, setCopiedIP] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [pingSuccess, setPingSuccess] = useState<boolean | null>(null);

  const field = (key: keyof FormData, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
  };

  const handleTestPing = async () => {
    if (!form.ip) return;
    setIsPinging(true);
    setPingSuccess(null);
    try {
      const res = await fetch(`${API}/ping/${form.ip}`);
      const data = await res.json();
      setPingSuccess(data.alive);
    } catch {
      setPingSuccess(false);
    } finally {
      setIsPinging(false);
      setTimeout(() => setPingSuccess(null), 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) newErrors.name = 'Device name is required.';
    
    if (!form.ip.trim()) {
      newErrors.ip = 'IP address is required.';
    } else if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(form.ip.trim()) && !/^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/.test(form.ip.trim()) && !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(form.ip.trim())) {
      newErrors.ip = 'Please enter a valid IP address or domain.';
    }
    
    if (form.macAddress.trim() && !/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(form.macAddress.trim())) {
      newErrors.macAddress = 'Invalid MAC format (e.g. AA:BB:CC:DD:EE:FF).';
    }
    
    if (!form.location.trim()) newErrors.location = 'Location is required.';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const body = {
        name: form.name,
        ip: form.ip,
        type: form.type,
        location: form.location,
        macAddress: form.macAddress || undefined,
        firmware: form.firmware || undefined,
        model: form.model || undefined,
        description: form.description || undefined,

      };
      const res = await fetch(
        isEdit ? `${API}/${device!.id}` : API,
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Request failed');
      }
      onSaved(isEdit ? 'updated' : 'created', form.name);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const accentColor = isEdit ? '#f59e0b' : '#3b82f6';

  const inputClass = "w-full h-[44px] bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] border border-white/[0.08] focus:border-accent/40 text-sm text-white placeholder-muted rounded-xl outline-none transition-all duration-300 px-4 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]";
  const textareaClass = "w-full bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] border border-white/[0.08] focus:border-accent/40 text-sm text-white placeholder-muted rounded-xl outline-none transition-all duration-300 px-5 py-3.5 resize-none focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]";
  const labelClass = "block type-label mb-2";
  const sectionTitle = "flex items-center gap-2 type-form-section mb-4";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative w-full max-w-[650px] bg-panel/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{ maxHeight: '90vh' }}
      >
        {/* Glowing Left Border Strip */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[4.5px] pointer-events-none z-20"
          style={{
            background: `linear-gradient(to bottom, transparent, ${accentColor}, transparent)`,
            boxShadow: `12px 0 32px -4px ${accentColor}`,
            opacity: 0.75,
          }}
        />

        {/* Corner Gradient */}
        <div
          className="absolute inset-0 pointer-events-none z-0 opacity-[0.04]"
          style={{ background: `linear-gradient(to bottom right, transparent 50%, ${accentColor})` }}
        />

        {/* Header */}
        <div
          className="flex items-center justify-between relative z-10 shrink-0"
          style={{ padding: '24px 32px', backgroundColor: 'rgba(0, 0, 0, 0.25)', borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center rounded-2xl shrink-0 transition-all duration-300"
              style={{
                width: 48, height: 48,
                background: `${accentColor}12`,
                border: `1px solid ${accentColor}25`,
                boxShadow: `0 0 20px ${accentColor}15`,
              }}
            >
              <Monitor size={20} style={{ color: accentColor }} />
            </div>
            <div>
              <h2 className="type-page-title text-white leading-tight">
                {isEdit ? 'Edit Device' : 'Add New Device'}
              </h2>
              <p className="type-body-sm text-muted mt-1">
                {isEdit ? `Editing ${device!.name}` : 'Register a new device to monitor'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isEdit && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(device!.ip);
                    setCopiedIP(true);
                    setTimeout(() => setCopiedIP(false), 2000);
                  }}
                  className="flex items-center gap-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] text-xs font-semibold text-white transition-colors"
                  style={{ padding: '8px 16px' }}
                >
                  {copiedIP ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-muted" />}
                  <span className="hidden md:inline">{copiedIP ? 'Copied!' : 'Copy IP'}</span>
                </button>
                <a
                  href={`http://${device!.ip}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] text-xs font-semibold text-white transition-colors"
                  style={{ padding: '8px 16px' }}
                  title="Open device configuration page in new tab"
                >
                  <ExternalLink size={14} className="text-accent" />
                  <span className="hidden md:inline">Web UI</span>
                </a>
                <div className="w-px h-6 bg-white/[0.1] mx-1" />
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-full hover:bg-white/10 text-muted hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="relative z-10 flex-1 overflow-y-auto" style={{ padding: '28px 32px' }}>
          <div className="flex flex-col" style={{ gap: '28px' }}>

            {/* Section: Basic Info */}
            <div>
              <div className={sectionTitle}>
                <div className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                Basic Information
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Name *</label>
                  <div className="relative group">
                    <Tag size={16} className={cn("absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 z-10 pointer-events-none", errors.name ? "text-red-500" : "text-muted group-focus-within:text-accent")} />
                    <input 
                      className={cn(inputClass, errors.name && "border-red-500/50 focus:border-red-500/50 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]")} 
                      style={{ paddingLeft: '44px', paddingRight: '16px' }} 
                      placeholder="e.g. Google DNS" 
                      value={form.name} 
                      onChange={e => field('name', e.target.value)} 
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.name}</p>}
                </div>
                <div>
                  <label className={labelClass}>IP Address / Hostname *</label>
                  <div className="relative group flex gap-2">
                    <div className="relative flex-1">
                      <Globe size={16} className={cn("absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 z-10 pointer-events-none", errors.ip ? "text-red-500" : "text-muted group-focus-within:text-accent")} />
                      <input 
                        className={cn(inputClass, errors.ip && "border-red-500/50 focus:border-red-500/50 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]")} 
                        style={{ paddingLeft: '44px', paddingRight: '16px' }} 
                        placeholder="e.g. 8.8.8.8" 
                        value={form.ip} 
                        onChange={e => field('ip', e.target.value)} 
                      />
                    </div>
                    {!isEdit && (
                      <button
                        type="button"
                        onClick={handleTestPing}
                        disabled={!form.ip || isPinging}
                        className={cn(
                          "h-[44px] px-6 rounded-xl text-xs font-bold transition-all duration-300 border flex items-center justify-center gap-2 shrink-0",
                          pingSuccess === true ? "bg-green-500/10 text-green-500 border-green-500/20" :
                          pingSuccess === false ? "bg-red-500/10 text-red-500 border-red-500/20" :
                          "bg-white/[0.03] text-white hover:bg-white/[0.06] border-white/10 disabled:opacity-50"
                        )}
                        style={{ minWidth: '100px' }}
                      >
                        {isPinging ? <Loader size={14} className="animate-spin" /> : 
                         pingSuccess === true ? <CheckCircle size={14} /> :
                         pingSuccess === false ? <X size={14} /> : <Activity size={14} />}
                        Test
                      </button>
                    )}
                  </div>
                  {errors.ip && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.ip}</p>}
                </div>
              </div>
            </div>

            {/* Section: Classification */}
            <div>
              <div className={sectionTitle}>
                <div className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                Classification
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Type *</label>
                  <div className="flex gap-2">
                    {(['AP', 'Router', 'Server'] as const).map(t => {
                      const TIcon = TYPE_ICONS[t];
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => field('type', t)}
                          className={cn(
                            'flex-1 h-[44px] rounded-xl text-xs font-semibold border transition-all duration-200 flex items-center justify-center gap-2',
                            form.type === t
                              ? TYPE_COLORS[t] + ' scale-[1.02] shadow-lg'
                              : 'bg-white/[0.02] border-white/[0.08] text-muted hover:text-white hover:bg-white/[0.04]'
                          )}
                        >
                          <TIcon size={14} />
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Location *</label>
                  <CreatableSelect
                    value={form.location}
                    onChange={(val) => field('location', val)}
                    options={existingLocations}
                    placeholder="e.g. External"
                    icon={<MapPin size={16} />}
                    accentColor={accentColor}
                    hasError={!!errors.location}
                  />
                  {errors.location && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.location}</p>}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.05]" />

            {/* Section: Hardware Details */}
            <div>
              <div className={sectionTitle}>
                <div className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                Hardware Details
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>MAC Address</label>
                  <div className="relative group">
                    <Network size={16} className={cn("absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 z-10 pointer-events-none", errors.macAddress ? "text-red-500" : "text-muted group-focus-within:text-accent")} />
                    <input 
                      className={cn(inputClass, errors.macAddress && "border-red-500/50 focus:border-red-500/50 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]")} 
                      style={{ paddingLeft: '44px', paddingRight: '16px' }} 
                      placeholder="e.g. AA:BB:CC:DD:EE:FF" 
                      value={form.macAddress} 
                      onChange={e => field('macAddress', e.target.value)} 
                    />
                  </div>
                  {errors.macAddress && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.macAddress}</p>}
                </div>
                <div>
                  <label className={labelClass}>Firmware</label>
                  <CreatableSelect
                    value={form.firmware}
                    onChange={(val) => field('firmware', val)}
                    options={existingFirmwares}
                    placeholder="e.g. BIND 9.18"
                    icon={<HardDrive size={16} />}
                    accentColor={accentColor}
                  />
                </div>
                <div>
                  <label className={labelClass}>Model</label>
                  <CreatableSelect
                    value={form.model}
                    onChange={(val) => field('model', val)}
                    options={existingModels}
                    placeholder="e.g. Cisco ISR 4321"
                    icon={<Cpu size={16} />}
                    accentColor={accentColor}
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={labelClass}>Description</label>
              <textarea className={textareaClass} placeholder="Optional device description..." rows={2} value={form.description} onChange={e => field('description', e.target.value)} />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-xs text-offline bg-offline/10 border border-offline/20 rounded-xl px-4 py-3">
                <AlertTriangle size={14} />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-[44px] rounded-xl text-sm font-semibold text-muted hover:text-white border border-white/[0.08] hover:border-white/[0.15] transition-all duration-200 hover:bg-white/[0.03]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-[44px] rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.01] disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)`,
                  boxShadow: `0 4px 20px ${accentColor}40`,
                }}
              >
                {loading ? <Loader size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Device'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Delete Confirm Modal (supports single & bulk) ────────────────────────────

function DeleteModal({
  target,
  onClose,
  onDeleted,
}: {
  target: Device | Device[];
  onClose: () => void;
  onDeleted: (name: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const isBulk = Array.isArray(target);
  const deviceList = isBulk ? target : [target];
  const firstDevice = deviceList[0];
  const Icon = TYPE_ICONS[firstDevice.type] ?? Server;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await Promise.all(deviceList.map(d => fetch(`${API}/${d.id}`, { method: 'DELETE' })));
      if (isBulk) {
        onDeleted(`${deviceList.length} devices`);
      } else {
        onDeleted(firstDevice.name);
      }
    } finally {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative w-full max-w-[440px] bg-panel/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Glowing Left Border Strip - Red */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[4.5px] pointer-events-none z-20"
          style={{
            background: 'linear-gradient(to bottom, transparent, #ef4444, transparent)',
            boxShadow: '12px 0 32px -4px #ef4444',
            opacity: 0.75,
          }}
        />

        {/* Corner Gradient - Red */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.04] bg-gradient-to-br from-transparent via-transparent to-red-500/40" />

        {/* Content */}
        <div className="relative z-10" style={{ padding: '28px 28px 24px' }}>
          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            <div
              className="flex items-center justify-center rounded-2xl shrink-0"
              style={{
                width: 48, height: 48,
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                boxShadow: '0 0 20px rgba(239,68,68,0.15)',
              }}
            >
              <AlertTriangle size={20} className="text-offline" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-white type-page-title tracking-tight">
                {isBulk ? `Remove ${deviceList.length} Devices` : 'Remove Device'}
              </h3>
              <p className="type-body-sm text-muted mt-1">This action cannot be undone</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-muted hover:text-white transition-colors cursor-pointer shrink-0 -mt-1"
            >
              <X size={16} />
            </button>
          </div>

          {/* Device Info Card(s) */}
          {isBulk ? (
            <div
              className="flex flex-col gap-2 rounded-xl mb-5 max-h-[200px] overflow-y-auto custom-scrollbar"
              style={{
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {deviceList.map(d => {
                const DIcon = TYPE_ICONS[d.type] ?? Server;
                return (
                  <div key={d.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-b-0">
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${TYPE_ACCENT[d.type]}18, ${TYPE_ACCENT[d.type]}05)`,
                        border: `1px solid ${TYPE_ACCENT[d.type]}30`,
                      }}
                    >
                      <DIcon size={14} style={{ color: TYPE_ACCENT[d.type] }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-semibold truncate">{d.name}</p>
                      <p className="text-muted text-xs font-mono truncate">{d.ip}</p>
                    </div>
                    <span
                      className="type-badge px-2 py-0.5 rounded border shrink-0"
                      style={{
                        color: TYPE_ACCENT[d.type],
                        borderColor: `${TYPE_ACCENT[d.type]}40`,
                        backgroundColor: `${TYPE_ACCENT[d.type]}15`,
                      }}
                    >
                      {d.type}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="flex items-center gap-4 rounded-xl mb-5"
              style={{
                padding: '16px 18px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${TYPE_ACCENT[firstDevice.type]}18, ${TYPE_ACCENT[firstDevice.type]}05)`,
                  border: `1px solid ${TYPE_ACCENT[firstDevice.type]}30`,
                }}
              >
                <Icon size={18} style={{ color: TYPE_ACCENT[firstDevice.type] }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-semibold truncate">{firstDevice.name}</p>
                <p className="text-muted text-xs font-mono truncate">{firstDevice.ip}</p>
              </div>
              <span className={cn('badge border type-badge font-medium px-2.5 py-0.5', TYPE_COLORS[firstDevice.type])}>
                {firstDevice.type}
              </span>
            </div>
          )}

          {/* Warning Text */}
          <p className="text-muted text-sm mb-6 leading-relaxed">
            {isBulk
              ? <>Are you sure you want to remove <span className="text-white font-semibold">{deviceList.length} devices</span> from monitoring? All associated data will be lost.</>
              : <>Are you sure you want to remove <span className="text-white font-semibold">{firstDevice.name}</span> from monitoring? All associated data will be lost.</>
            }
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-[44px] rounded-xl text-sm font-semibold text-muted border border-white/[0.08] hover:text-white hover:border-white/[0.15] hover:bg-white/[0.03] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 h-[44px] rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                boxShadow: '0 4px 20px rgba(239,68,68,0.3)',
              }}
            >
              {loading ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
              {loading
                ? 'Removing...'
                : isBulk ? `Remove ${deviceList.length} Devices` : 'Remove Device'
              }
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function DeviceManagement() {
  const { isOpen: isSidebarOpen } = useSidebar();
  const { devices, results, isLoading: contextLoading, refetchDevices } = useMonitoring();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'ip' | 'type' | 'location'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [showForm, setShowForm] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | undefined>(undefined);
  
  // deleteDevice now handles a single device or an array of devices for bulk delete
  const [deleteDevice, setDeleteDevice] = useState<Device | Device[] | undefined>(undefined);
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());

  // Snackbar state
  const [snackbars, setSnackbars] = useState<CrudSnackbar[]>([]);

  // Scroll-aware navbar (Dashboard parity)
  const [scrolled, setScrolled] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [isHoveringTop, setIsHoveringTop] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const el = document.querySelector('.dm-scroll-container');
    if (!el) return;
    const onScroll = () => {
      const currentScrollY = el.scrollTop;
      setScrolled(currentScrollY > 40);
      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setNavVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        setNavVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setIsHoveringTop(e.clientY < 80);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const finalNavVisible = navVisible || isHoveringTop;

  const isLoading = contextLoading;

  const onlineCount = devices.filter(d => getStatus(results[d.id]) === 'online').length;
  const offlineCount = devices.filter(d => getStatus(results[d.id]) === 'offline').length;
  const warningCount = devices.filter(d => getStatus(results[d.id]) === 'warning').length;
  const unknownCount = devices.filter(d => getStatus(results[d.id]) === 'unknown').length;


  const filtered = devices.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = !q || d.name.toLowerCase().includes(q) || d.ip.includes(q);
    const matchType = typeFilter === 'all' || d.type === typeFilter;
    const matchStatus = statusFilter === 'all' || getStatus(results[d.id]) === statusFilter;
    return matchSearch && matchType && matchStatus;
  }).sort((a, b) => {
    const aVal = String(a[sortBy] || '').toLowerCase();
    const bVal = String(b[sortBy] || '').toLowerCase();
    if (sortBy === 'ip') {
      const aParts = aVal.split('.').map(Number);
      const bParts = bVal.split('.').map(Number);
      for (let i = 0; i < 4; i++) {
        if (aParts[i] !== bParts[i]) {
          return sortOrder === 'asc' ? ((aParts[i] || 0) - (bParts[i] || 0)) : ((bParts[i] || 0) - (aParts[i] || 0));
        }
      }
      return 0;
    }
    const compare = aVal.localeCompare(bVal);
    return sortOrder === 'asc' ? compare : -compare;
  });

  const openCreate = () => { setEditDevice(undefined); setShowForm(true); };
  const openEdit = (d: Device) => { setEditDevice(d); setShowForm(true); };

  // Snackbar helper
  const triggerSnackbar = (title: string, message: string) => {
    const snack: CrudSnackbar = {
      id: Math.random().toString(36).slice(2, 9),
      type: 'success',
      title,
      message,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
    };
    setSnackbars(prev => [...prev.slice(-2), snack]);
    setTimeout(() => setSnackbars(prev => prev.filter(s => s.id !== snack.id)), 4000);
  };

  // CRUD callbacks
  const handleSaved = async (action: 'created' | 'updated', name: string) => {
    setShowForm(false);
    await refetchDevices();
    if (action === 'created') {
      triggerSnackbar('Device Added', `${name} has been registered successfully`);
    } else {
      triggerSnackbar('Device Updated', `${name} has been updated successfully`);
    }
  };

  const handleDeleted = async (name: string) => {
    await refetchDevices();
    triggerSnackbar('Device Removed', `${name} has been removed from monitoring`);
  };

  return (
    <div className="dm-scroll-container min-h-full flex-1 w-full text-text flex flex-col relative overflow-y-auto">
      {/* Background Pattern matching Dashboard */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-50 pointer-events-none" />

      {/* ── NAVBAR (Dashboard-style scroll/float behavior) ── */}
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
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 py-1">
            {/* Brand */}
            <div className="flex items-center gap-3 md:gap-4 min-w-0 shrink-0">
              {!isSidebarOpen && (
                <button
                  onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))}
                  className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/[0.08] transition-colors -ml-2 shrink-0"
                  title="Toggle Sidebar"
                >
                  <Menu size={20} className="text-white/90" />
                </button>
              )}
              <div className="flex items-center gap-3 md:gap-4 group cursor-pointer">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 shadow-inner shadow-accent/10 shrink-0 transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-[360deg] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                  <Monitor className="text-accent" size={20} />
                </div>
                <div className="min-w-0 flex flex-col justify-center transition-transform duration-300 group-hover:translate-x-1">
                  <h1 className="font-bold text-base md:text-lg tracking-tight leading-none text-white transition-colors duration-300 group-hover:text-accent">
                    Network Devices
                  </h1>
                  <p className="text-xs text-muted mt-1 font-medium leading-none">
                    {devices.length} device{devices.length !== 1 ? 's' : ''} registered
                  </p>
                </div>
              </div>
            </div>

            {/* Centered Search Input */}
            <div className="flex-1 flex justify-center w-full lg:w-auto px-0 lg:px-4 shrink-0">
              <motion.div
                whileHover={{ scale: 1.015, boxShadow: '0 0 16px rgba(59,130,246,0.15)' }}
                whileTap={{ scale: 0.99 }}
                className="relative w-full max-w-[500px] group shrink rounded-full transition-shadow duration-300 flex items-center h-[42px]"
              >
                <Search size={15} className="absolute left-[18px] top-1/2 -translate-y-1/2 text-dim pointer-events-none z-10 transition-all duration-300 group-focus-within:text-accent group-focus-within:scale-110" />
                <input
                  type="text"
                  placeholder="Search devices or IP…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full h-[42px] bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.07] border border-white/[0.08] focus:border-accent/40 text-sm text-white placeholder-muted rounded-full outline-none transition-all duration-300 shadow-inner shadow-black/20 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
                  style={{ paddingLeft: '46px', paddingRight: '24px' }}
                />
              </motion.div>
            </div>

            {/* Controls Group */}
            <div className="flex items-center gap-2 lg:gap-3 shrink-0">
              {/* Type Filter */}
              <div className="relative w-[120px] lg:w-[130px] shrink-0">
                <CustomSelect
                  value={typeFilter}
                  onChange={setTypeFilter}
                  options={[
                    { value: 'all', label: 'All Types' },
                    { value: 'AP', label: 'Access Point' },
                    { value: 'Router', label: 'Router' },
                    { value: 'Server', label: 'Server' }
                  ]}
                />
              </div>

              {/* Sort Filter & Direction */}
              <div className="flex items-center gap-2 lg:gap-3 shrink-0 relative z-30">
                <div className="w-[120px] lg:w-[130px]">
                  <CustomSelect
                    value={sortBy}
                    onChange={(val) => setSortBy(val as 'name' | 'ip' | 'type' | 'location')}
                    options={[
                      { value: 'name', label: 'Sort: Name' },
                      { value: 'ip', label: 'Sort: IP' },
                      { value: 'type', label: 'Sort: Type' },
                      { value: 'location', label: 'Sort: Area' }
                    ]}
                  />
                </div>
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center justify-center w-[42px] h-[42px] rounded-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition-all text-white/80 shrink-0 shadow-inner shadow-white/5"
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── CONTENT AREA ── */}
      <div
        className="w-full max-w-[1720px] mx-auto flex-1 flex flex-col page-container-x pb-16"
        style={{ paddingTop: '40px' }}
      >
        {/* ── SYSTEM OVERVIEW HEADER ── */}
        <div className="flex items-center gap-3 w-full" style={{ marginBottom: '28px' }}>
          <div className="h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
          <h2 className="font-bold tracking-wide text-white drop-shadow-[0_0_8px_rgba(59,130,246,0.3)] shrink-0 uppercase text-lg">
            System Overview
          </h2>
          <div className="flex-1 h-[1.5px] bg-gradient-to-r from-white/[0.12] to-transparent ml-3" />
        </div>

        {/* ── COMPACT SYSTEM OVERVIEW (Dashboard-style cards) ── */}
        <div className="grid grid-cols-5 gap-5" style={{ marginBottom: '56px' }}>
          {[
            { id: 'all', label: 'Total Devices', value: devices.length, color: '#3b82f6', icon: <Server size={18} className="stroke-[2.2px]" />, bgIcon: <Server size={110} className="stroke-[1.2px]" /> },
            { id: 'online', label: 'Active', value: onlineCount, color: '#22c55e', icon: <CheckCircle size={18} className="stroke-[2.2px]" />, bgIcon: <CheckCircle size={110} className="stroke-[1.2px]" /> },
            { id: 'warning', label: 'Warning', value: warningCount, color: '#f59e0b', icon: <AlertTriangle size={18} className="stroke-[2.2px]" />, bgIcon: <AlertTriangle size={110} className="stroke-[1.2px]" /> },
            { id: 'offline', label: 'Offline', value: offlineCount, color: '#ef4444', icon: <XCircle size={18} className="stroke-[2.2px]" />, bgIcon: <XCircle size={110} className="stroke-[1.2px]" /> },
            { id: 'unknown', label: 'Unknown', value: unknownCount, color: '#94a3b8', icon: <HelpCircle size={18} className="stroke-[2.2px]" />, bgIcon: <HelpCircle size={110} className="stroke-[1.2px]" /> },
          ].map(s => {
            const isActive = statusFilter === s.id || (s.id === 'all' && statusFilter === 'all');
            return (
              <motion.div
                key={s.id}
                onClick={() => setStatusFilter(s.id === 'all' ? 'all' : (statusFilter === s.id ? 'all' : s.id))}
                whileHover={{ y: -3, scale: 1.015, boxShadow: `0 16px 40px rgba(0,0,0,0.35), 0 0 30px ${s.color}20`, borderColor: `${s.color}45` }}
                transition={{ duration: 0.18 }}
                className={cn(
                  "group relative overflow-hidden rounded-2xl cursor-pointer select-none border bg-panel/90 backdrop-blur-xl transition-colors duration-300 hover:bg-panel min-h-[100px]"
                )}
                style={{
                  boxShadow: isActive ? `0 12px 32px rgba(0,0,0,0.3), 0 0 30px ${s.color}20` : '0 8px 24px rgba(0,0,0,0.2)',
                  borderColor: isActive ? `${s.color}45` : 'rgba(255,255,255,0.05)',
                  backgroundColor: isActive ? `${s.color}05` : undefined,
                }}
              >
                {/* Left glow strip */}
                <div
                  className={cn("absolute left-0 top-0 bottom-0 transition-all duration-300", isActive ? "w-[5px] opacity-95" : "w-[3px] opacity-50 group-hover:w-[5px] group-hover:opacity-90")}
                  style={{
                    background: `linear-gradient(to bottom, transparent, ${s.color}, transparent)`,
                    boxShadow: isActive ? `14px 0 36px -2px ${s.color}` : `10px 0 28px -4px ${s.color}`,
                  }}
                />
                {/* Radial glow */}
                <div
                  className={cn("absolute inset-0 pointer-events-none transition-opacity duration-300", isActive ? "opacity-[0.09]" : "opacity-[0.04] group-hover:opacity-[0.08]")}
                  style={{ background: `radial-gradient(circle at 100% 0%, ${s.color}, transparent 65%)` }}
                />
                {/* Background silhouette icon */}
                <div className="absolute right-[-10px] bottom-[-20px] pointer-events-none opacity-[0.035] transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:opacity-[0.06]" style={{ color: s.color }}>
                  {s.bgIcon}
                </div>
                {/* Content */}
                <div className="relative z-10 w-full h-full flex flex-col" style={{ padding: '24px', minHeight: '160px' }}>
                  <div className="flex items-center justify-between gap-3 relative z-20">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full shadow-[0_0_6px_currentColor]" style={{ background: s.color, color: s.color }} />
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: s.color }}>{s.label}</span>
                    </div>
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm shrink-0"
                      style={{ backgroundColor: `${s.color}08`, borderColor: `${s.color}15`, color: s.color, boxShadow: `0 0 16px ${s.color}05` }}
                    >
                      {s.icon}
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center mt-4">
                    <div className="text-[52px] leading-none font-black text-white tabular-nums tracking-tight" style={{ textShadow: `0 0 20px ${s.color}30` }}>{s.value}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── DEVICE LIST CARD (glassmorphic wrapper) ── */}
        <div
          className="relative rounded-2xl border border-white/[0.06] bg-[#101828]/50 backdrop-blur-xl overflow-hidden"
          style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)' }}
        >
          {/* Subtle inner ring */}
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.02] pointer-events-none" />

          {/* Section Header inside card */}
          <div className="flex items-center gap-3 w-full border-b border-white/[0.06]" style={{ padding: '20px 28px' }}>
            <div className="h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
            <h2 className="font-bold tracking-wide text-white drop-shadow-[0_0_8px_rgba(59,130,246,0.3)] shrink-0 uppercase text-base">
              Device List
            </h2>
            <span
              className="type-badge text-accent border border-accent/20 rounded-full bg-accent/10 tabular-nums shadow-inner shadow-accent/10 shrink-0"
              style={{ padding: '3px 10px' }}
            >
              {filtered.length} DEVICE{filtered.length !== 1 ? 'S' : ''}
            </span>
            <div className="flex-1 h-[1.5px] bg-gradient-to-r from-white/[0.12] to-transparent ml-3 mr-3" />
            
            <AnimatePresence mode="wait">
              {selectedDevices.size > 0 ? (
                <motion.div
                  key="bulk-actions"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-2.5 shrink-0"
                >
                  <span className="text-xs font-semibold text-white/70 tabular-nums">{selectedDevices.size} selected</span>
                  <button
                    onClick={() => setDeleteDevice(devices.filter(d => selectedDevices.has(d.id)))}
                    className="flex h-[34px] items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 rounded-xl shrink-0 select-none transition-all duration-300 text-red-500 font-bold type-badge tracking-wider"
                    style={{ padding: '0 14px' }}
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                  <button
                    onClick={() => setSelectedDevices(new Set())}
                    className="flex h-[34px] items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl shrink-0 select-none transition-all duration-300 text-white/60 font-bold type-badge tracking-wider"
                    style={{ padding: '0 14px' }}
                  >
                    <span>Cancel</span>
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="add-device"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={openCreate}
                  className="flex h-[34px] items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] border border-white/[0.08] rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] shrink-0 select-none transition-all duration-300 text-white font-medium text-sm"
                  style={{ padding: '0 16px' }}
                >
                  <Plus size={15} />
                  <span>Add Device</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Table Header */}
          <div
            className="grid items-center type-sublabel text-muted border-b border-white/[0.05]"
            style={{
              gridTemplateColumns: '48px 2.5fr 130px 1.5fr 120px 1.2fr 1.2fr 100px',
              padding: '14px 28px',
            }}
          >
            <div className="flex items-center justify-center">
              <button
                onClick={() => {
                  if (selectedDevices.size === filtered.length && filtered.length > 0) {
                    setSelectedDevices(new Set());
                  } else {
                    setSelectedDevices(new Set(filtered.map(d => d.id)));
                  }
                }}
                className={cn(
                  "w-[18px] h-[18px] rounded flex items-center justify-center border transition-all duration-300",
                  selectedDevices.size === filtered.length && filtered.length > 0
                    ? "bg-accent border-accent text-white"
                    : "border-white/20 hover:border-white/40 bg-white/5"
                )}
              >
                {selectedDevices.size === filtered.length && filtered.length > 0 && <Check size={12} strokeWidth={3} />}
              </button>
            </div>
            <span>Device Information</span>
            <span className="text-center">Status</span>
            <span style={{ paddingLeft: '24px' }}>IP Address</span>
            <span className="text-center">Type</span>
            <span>Location</span>
            <span>Model</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Rows */}
          <div className="flex flex-col gap-3" style={{ padding: '8px 12px 16px' }}>
            {isLoading ? (
              <div className="py-24 text-center">
                <Loader size={32} className="animate-spin text-accent mx-auto mb-4" />
                <p className="text-muted text-sm">Loading devices...</p>
              </div>
            ) : devices.length === 0 ? (
              <div className="relative flex flex-col items-center justify-center py-28 text-center px-4">
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-[300px] h-[300px] bg-accent/5 rounded-full blur-[80px]" />
                </div>
                <div className="relative mb-8">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.15)] group-hover:scale-110 transition-transform duration-500">
                    <Server size={32} className="text-accent" />
                  </div>
                </div>
                <h3 className="text-white text-xl font-bold tracking-wide mb-4 drop-shadow-md">No Devices Registered</h3>
                <p className="text-muted text-sm max-w-sm mb-10 leading-relaxed">Your monitoring dashboard is currently empty. Add your first device to start tracking uptime, latency, and real-time events.</p>
                <button
                  onClick={openCreate}
                  className="group relative flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white rounded-full font-bold uppercase tracking-wider type-badge transition-all duration-300 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] overflow-hidden w-auto"
                  style={{ padding: '10px 24px' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                  <Plus size={16} className="stroke-[3px]" />
                  <span>Add New Device</span>
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="relative flex flex-col items-center justify-center py-24 text-center px-4">
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-[250px] h-[250px] bg-warning/5 rounded-full blur-[60px]" />
                </div>
                <div className="relative mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-warning/15 to-warning/5 border border-warning/15 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.08)]">
                    <Search size={28} className="text-warning/80" />
                  </div>
                </div>
                <h3 className="text-white text-lg font-bold tracking-wide mb-3">No Matching Results</h3>
                <p className="text-muted text-sm max-w-xs leading-relaxed mb-10">We couldn't find any devices matching your current search or filter criteria.</p>
                <button
                  onClick={() => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); }}
                  className="group flex items-center justify-center gap-1.5 text-white/70 hover:text-white font-bold uppercase tracking-widest border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 rounded-full transition-all duration-300 w-auto type-badge"
                  style={{ padding: '8px 20px' }}
                >
                  <X size={12} className="group-hover:rotate-90 transition-transform duration-300" />
                  <span>Clear Filters</span>
                </button>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {filtered.map((device, idx) => {
                  const Icon = TYPE_ICONS[device.type] ?? Server;
                  const accent = TYPE_ACCENT[device.type] ?? '#3b82f6';
                  const isSelected = selectedDevices.has(device.id);
                  const status = getStatus(results[device.id]);
                  const isOnline = status === 'online';
                  const isWarning = status === 'warning';
                  const isOffline = status === 'offline';

                  const statusBg = isOnline ? 'bg-online' : isWarning ? 'bg-warning' : isOffline ? 'bg-offline' : 'bg-muted';
                  const statusLabel = isOnline ? 'Online' : isWarning ? 'Warning' : isOffline ? 'Offline' : 'Unknown';

                  return (
                    <motion.div
                      key={device.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ delay: idx * 0.03, duration: 0.2 }}
                      className={cn(
                        "grid items-center px-4 lg:px-7 group transition-all duration-300 rounded-xl relative overflow-hidden backdrop-blur-sm cursor-default",
                        isSelected ? "bg-accent/10 border-accent/30" : "bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.04] hover:border-white/[0.1]"
                      )}
                      style={{
                        paddingTop: '12px',
                        paddingBottom: '12px',
                        gridTemplateColumns: '48px 2.5fr 130px 1.5fr 120px 1.2fr 1.2fr 100px',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        boxShadow: isSelected ? '0 4px 24px rgba(59,130,246,0.15)' : 'none'
                      }}
                    >
                      {/* Left glow strip on hover */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-[3px] opacity-[0.25] group-hover:w-[4px] group-hover:opacity-100 transition-all duration-300 pointer-events-none"
                        style={{
                          background: `linear-gradient(to bottom, transparent, ${accent}, transparent)`,
                          boxShadow: `4px 0 12px ${accent}`,
                        }}
                      />

                      {/* Selection Glow */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent pointer-events-none" />
                      )}
                      
                      {/* Checkbox */}
                      <div className="flex items-center justify-center relative z-10">
                        <button
                          onClick={() => {
                            const newSet = new Set(selectedDevices);
                            if (newSet.has(device.id)) newSet.delete(device.id);
                            else newSet.add(device.id);
                            setSelectedDevices(newSet);
                          }}
                          className={cn(
                            "w-[18px] h-[18px] rounded flex items-center justify-center border transition-all duration-300",
                            isSelected
                              ? "bg-accent border-accent text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                              : "border-white/20 group-hover:border-white/40 bg-white/5"
                          )}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </button>
                      </div>

                      {/* Info Column */}
                      <div className="flex items-center gap-3.5 min-w-0 pr-4 relative z-10">
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-500 group-hover:scale-110",
                          isSelected ? "bg-accent/20 border-accent/40 text-accent" : "bg-white/[0.03] border-white/10 text-muted group-hover:text-white"
                        )}
                        style={!isSelected ? {
                            background: `linear-gradient(135deg, ${accent}18, ${accent}05)`,
                            border: `1px solid ${accent}30`,
                            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1)`,
                          } : undefined}>
                          <Icon size={16} style={!isSelected ? { color: accent } : undefined} />
                        </div>
                        <div className="min-w-0 flex flex-col justify-center">
                          <p className="text-white text-sm font-semibold truncate tracking-wide">{device.name}</p>
                          <p className="text-muted text-[11px] truncate mt-0.5 max-w-[180px]">{device.description || 'No description'}</p>
                        </div>
                      </div>

                      {/* Status Column as Badge */}
                      <div className="flex items-center justify-center relative z-10">
                        <span 
                          className="inline-flex items-center gap-2 border type-badge rounded-full shadow-inner"
                          style={{
                            padding: '4px 12px',
                            color: statusBg.replace('bg-', ''), // fallback text color
                            borderColor: statusBg.replace('bg-', '') === 'online' ? '#22c55e40' : statusBg.replace('bg-', '') === 'offline' ? '#ef444440' : statusBg.replace('bg-', '') === 'warning' ? '#f59e0b40' : '#94a3b840',
                            backgroundColor: statusBg.replace('bg-', '') === 'online' ? '#22c55e15' : statusBg.replace('bg-', '') === 'offline' ? '#ef444415' : statusBg.replace('bg-', '') === 'warning' ? '#f59e0b15' : '#94a3b815',
                            boxShadow: `inset 0 2px 4px 0 ${statusBg.replace('bg-', '') === 'online' ? '#22c55e10' : statusBg.replace('bg-', '') === 'offline' ? '#ef444410' : statusBg.replace('bg-', '') === 'warning' ? '#f59e0b10' : '#94a3b810'}`
                          }}
                        >
                          <div 
                            className="w-1.5 h-1.5 rounded-full shrink-0" 
                            style={{ 
                              backgroundColor: statusBg.replace('bg-', '') === 'online' ? '#22c55e' : statusBg.replace('bg-', '') === 'offline' ? '#ef4444' : statusBg.replace('bg-', '') === 'warning' ? '#f59e0b' : '#94a3b8',
                              boxShadow: `0 0 10px ${statusBg.replace('bg-', '') === 'online' ? '#22c55e' : statusBg.replace('bg-', '') === 'offline' ? '#ef4444' : statusBg.replace('bg-', '') === 'warning' ? '#f59e0b' : '#94a3b8'}`,
                            }} 
                          />
                          <span className="truncate" style={{ color: statusBg.replace('bg-', '') === 'online' ? '#22c55e' : statusBg.replace('bg-', '') === 'offline' ? '#ef4444' : statusBg.replace('bg-', '') === 'warning' ? '#f59e0b' : '#94a3b8' }}>
                            {statusLabel}
                          </span>
                        </span>
                      </div>

                      {/* IP Address */}
                      <div className="text-white/80 font-mono text-[13px] tracking-tight relative z-10" style={{ paddingLeft: '24px' }}>
                        {device.ip}
                      </div>

                      {/* Type Badge */}
                      <div className="flex items-center justify-center relative z-10">
                        <span 
                          className="inline-flex items-center justify-center border type-badge rounded-full shadow-inner"
                          style={{
                            padding: '4px 12px',
                            color: accent,
                            borderColor: `${accent}40`,
                            backgroundColor: `${accent}15`,
                            boxShadow: `inset 0 2px 4px 0 ${accent}10`
                          }}
                        >
                          {device.type}
                        </span>
                      </div>

                      {/* Location */}
                      <div className="text-muted text-[13px] truncate pr-4 relative z-10">
                        {device.location}
                      </div>

                      {/* Model */}
                      <div className="text-muted text-[13px] truncate pr-4 relative z-10">
                        {device.model || '—'}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-1.5 relative z-10 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(device); }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                          title="Edit Device"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteDevice(device); }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          title="Delete Device"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showForm && (
          <DeviceFormModal
            device={editDevice}
            existingLocations={Array.from(new Set(devices.map(d => d.location).filter(Boolean)))}
            existingModels={Array.from(new Set(devices.map(d => d.model).filter(Boolean))) as string[]}
            existingFirmwares={Array.from(new Set(devices.map(d => d.firmware).filter(Boolean))) as string[]}
            onClose={() => setShowForm(false)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteDevice && (
          <DeleteModal
            target={deleteDevice}
            onClose={() => { setDeleteDevice(undefined); setSelectedDevices(new Set()); }}
            onDeleted={handleDeleted}
          />
        )}
      </AnimatePresence>

      {/* ── Snackbar Toasts ── */}
      <div className="fixed bottom-5 right-5 flex flex-col gap-2.5 z-[110] pointer-events-none">
        <AnimatePresence>
          {snackbars.map(snack => (
            <motion.div
              key={snack.id}
              initial={{ opacity: 0, y: 16, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95, transition: { duration: 0.18 } }}
              whileHover={{
                scale: 1.015,
                boxShadow: '0 20px 48px rgba(0,0,0,0.5), 0 0 30px rgba(34,197,94,0.15)',
                borderColor: 'rgba(34,197,94,0.35)'
              }}
              transition={{ type: 'spring', damping: 22, stiffness: 260 }}
              onClick={() => setSnackbars(prev => prev.filter(s => s.id !== snack.id))}
              style={{ padding: '10px 14px' }}
              className="pointer-events-auto cursor-pointer active:scale-[0.98] group relative overflow-hidden flex items-center gap-3 rounded-xl border border-white/[0.06] backdrop-blur-xl bg-panel/95 transition-colors duration-300 w-[350px] sm:w-[380px] shadow-[0_16px_40px_rgba(0,0,0,0.45)] hover:bg-panel/98"
            >
              {/* Glowing Left Border Strip - Green */}
              <div
                className="absolute left-0 top-0 bottom-0 w-[4px] pointer-events-none opacity-70 group-hover:w-[6px] group-hover:opacity-95 transition-all duration-300"
                style={{
                  background: 'linear-gradient(to bottom, transparent, #22c55e, transparent)',
                  boxShadow: '12px 0 32px -4px #22c55e',
                }}
              />

              {/* Corner Gradient */}
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-gradient-to-br from-transparent via-transparent to-green-500/40" />

              {/* Icon */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 shadow-md relative z-10 group-hover:scale-110 group-hover:rotate-3 bg-online/10 border-online/20 text-online shadow-[0_0_12px_rgba(34,197,94,0.2)]">
                <CheckCircle size={15} className="stroke-[2.5px]" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col gap-0.5 relative z-10">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-bold text-white leading-tight tracking-wide group-hover:text-online transition-colors duration-300">
                    {snack.title}
                  </p>
                  <p className="text-xs text-white/40 font-semibold tracking-wider uppercase tabular-nums">
                    {snack.timestamp}
                  </p>
                </div>
                <p className="text-xs text-muted truncate leading-normal">{snack.message}</p>
              </div>

              {/* Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/[0.03] overflow-hidden pointer-events-none">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 4, ease: 'linear' }}
                  className="h-full rounded-r-full bg-online shadow-[0_0_8px_#22c55e]"
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Spacer & Footer */}
      <div className="h-12 shrink-0 pointer-events-none" />
      <Footer />
    </div>
  );
}

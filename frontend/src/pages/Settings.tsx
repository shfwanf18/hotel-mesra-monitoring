import { useState, useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon, Clock, Mail, Save,
  CheckCircle, Loader, Info, ToggleLeft, ToggleRight, Menu,
  Globe, Database, Activity, Zap, MessageSquare, Search,
  AlertTriangle, X
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Footer } from '../components/layout/Footer';
import { useSidebar } from '../components/layout/AppLayout';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/settings';

interface AppSettings {
  ping_interval_minutes?: string;
  fail_threshold?: string;
  email_alerts_enabled?: string;
  email_recipients?: string;
  telegram_alerts_enabled?: string;
  telegram_chat_id?: string;
}

interface TeleRecipient {
  id: string;
  label: string;
  chatId: string;
}

interface EmailRecipient {
  id: string;
  label: string;
  email: string;
}

// ── Snackbar Type ───────────────────────────────────────────────────────────

interface SettingsSnackbar {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'success' | 'error';
}

export default function Settings() {
  const { isOpen: isSidebarOpen } = useSidebar();

  const [, setSettings] = useState<AppSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Original values (for dirty tracking)
  const [origPingInterval, setOrigPingInterval] = useState('1');
  const [origFailThreshold, setOrigFailThreshold] = useState('3');
  const [origEmailEnabled, setOrigEmailEnabled] = useState(true);
  const [origEmailRecipients, setOrigEmailRecipients] = useState<EmailRecipient[]>([]);
  const [origTeleEnabled, setOrigTeleEnabled] = useState(false);
  const [origRecipients, setOrigRecipients] = useState<TeleRecipient[]>([]);

  // Editable values
  const [pingInterval, setPingInterval] = useState('1');
  const [failThreshold, setFailThreshold] = useState('3');
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailRecipients, setEmailRecipients] = useState<EmailRecipient[]>([]);
  const [teleEnabled, setTeleEnabled] = useState(false);
  const [recipients, setRecipients] = useState<TeleRecipient[]>([]);
  const [detecting, setDetecting] = useState<string | null>(null);
  const [testingEmail, setTestingEmail] = useState<string | null>(null);

  // Snackbar
  const [snackbars, setSnackbars] = useState<SettingsSnackbar[]>([]);

  // Scroll-aware navbar
  const [scrolled, setScrolled] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [isHoveringTop, setIsHoveringTop] = useState(false);
  const lastScrollY = useRef(0);

  // Dirty check
  const isDirty = pingInterval !== origPingInterval
    || failThreshold !== origFailThreshold
    || emailEnabled !== origEmailEnabled
    || teleEnabled !== origTeleEnabled
    || JSON.stringify(emailRecipients) !== JSON.stringify(origEmailRecipients)
    || JSON.stringify(recipients) !== JSON.stringify(origRecipients);

  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Router blocker
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowUnsavedModal(true);
    }
  }, [blocker.state]);

  // Native beforeunload
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Required for Chrome
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    const el = document.querySelector('.settings-scroll-container');
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

  const finalNavVisible = navVisible || isDirty || isHoveringTop;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setIsHoveringTop(e.clientY < 80);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    fetch(API)
      .then(r => r.json())
      .then((data: AppSettings) => {
        setSettings(data);
        const pi = data.ping_interval_minutes ?? '1';
        const ft = data.fail_threshold ?? '3';
        const ee = data.email_alerts_enabled !== 'false';
        const eid = data.email_recipients ?? '';
        const te = data.telegram_alerts_enabled === 'true';
        const tid = data.telegram_chat_id ?? '';
        setPingInterval(pi);
        setFailThreshold(ft);
        setEmailEnabled(ee);
        setTeleEnabled(te);

        let parsedEmailRecipients: EmailRecipient[] = [];
        if (eid) {
          try {
            const parsed = JSON.parse(eid);
            if (Array.isArray(parsed)) {
              parsedEmailRecipients = parsed.map(p => ({
                id: Math.random().toString(),
                label: p.label || '',
                email: p.email || ''
              }));
            } else {
              parsedEmailRecipients = [{ id: Math.random().toString(), label: 'Default', email: eid }];
            }
          } catch {
            parsedEmailRecipients = eid.split(',').map(id => ({
              id: Math.random().toString(),
              label: 'Recipient',
              email: id.trim()
            })).filter(r => !!r.email);
          }
        }
        if (parsedEmailRecipients.length === 0) {
          parsedEmailRecipients = [{ id: Math.random().toString(), label: '', email: '' }];
        }
        setEmailRecipients(parsedEmailRecipients);
        setOrigEmailRecipients(parsedEmailRecipients);

        let parsedRecipients: TeleRecipient[] = [];
        if (tid) {
          try {
            const parsed = JSON.parse(tid);
            if (Array.isArray(parsed)) {
              parsedRecipients = parsed.map(p => ({
                id: Math.random().toString(),
                label: p.label || '',
                chatId: p.chatId || ''
              }));
            } else {
              parsedRecipients = [{ id: Math.random().toString(), label: 'Default', chatId: tid }];
            }
          } catch {
            parsedRecipients = tid.split(',').map(id => ({
              id: Math.random().toString(),
              label: 'Recipient',
              chatId: id.trim()
            })).filter(r => !!r.chatId);
          }
        }
        if (parsedRecipients.length === 0) {
          parsedRecipients = [{ id: Math.random().toString(), label: '', chatId: '' }];
        }
        setRecipients(parsedRecipients);
        setOrigRecipients(parsedRecipients);

        setOrigPingInterval(pi);
        setOrigFailThreshold(ft);
        setOrigEmailEnabled(ee);
        setOrigTeleEnabled(te);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const triggerSnackbar = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    const snack: SettingsSnackbar = {
      id: Math.random().toString(36).slice(2, 9),
      title,
      message,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      type,
    };
    setSnackbars(prev => [...prev.slice(-2), snack]);
    setTimeout(() => setSnackbars(prev => prev.filter(s => s.id !== snack.id)), 4000);
  };

  const handleAutoDetect = async (idToUpdate: string) => {
    setDetecting(idToUpdate);
    try {
      const res = await fetch(API + '/telegram/check');
      const data = await res.json();
      if (data.chatId) {
        setRecipients(prev => prev.map(r => r.id === idToUpdate ? { ...r, chatId: data.chatId } : r));
        triggerSnackbar('Chat ID Detected', `Successfully linked Chat ID: ${data.chatId}`, 'success');
      } else {
        triggerSnackbar('Not Found', data.message || 'Please send a message to the bot first.', 'error');
      }
    } catch (e) {
      triggerSnackbar('Error', 'Failed to detect Chat ID. Check your bot token.', 'error');
    } finally {
      setDetecting(null);
    }
  };

  const handleTestTelegram = async (chatId: string) => {
    if (!chatId.trim()) return triggerSnackbar('Error', 'Please enter a Chat ID first.', 'error');
    try {
      const res = await fetch(API + '/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId })
      });
      if (res.ok) {
        triggerSnackbar('Test Sent', 'Test notification sent to Telegram.', 'success');
      } else {
        const errorData = await res.json().catch(() => ({}));
        triggerSnackbar('Error', errorData.message || 'Failed to send test notification. Check bot token.', 'error');
      }
    } catch (e) {
      triggerSnackbar('Error', 'Failed to connect to backend.', 'error');
    }
  };

  const handleTestEmail = async (email: string) => {
    if (!email.trim()) return triggerSnackbar('Error', 'Please enter an Email Address first.', 'error');
    setTestingEmail(email);
    try {
      const res = await fetch(API + '/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        triggerSnackbar('Test Sent', 'Test notification sent to Email.', 'success');
      } else {
        const errorData = await res.json().catch(() => ({}));
        triggerSnackbar('Error', errorData.message || 'Failed to send test notification.', 'error');
      }
    } catch (e) {
      triggerSnackbar('Error', 'Failed to connect to backend.', 'error');
    } finally {
      setTestingEmail(null);
    }
  };

  const handleSave = async () => {
    if (emailEnabled) {
      for (const r of emailRecipients) {
        if (!r.label.trim() && r.email.trim()) return triggerSnackbar('Error', 'Label is required for Email Recipients.', 'error');
        if (r.label.trim() && !r.email.trim()) return triggerSnackbar('Error', 'Email address is required.', 'error');
        if (r.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email.trim())) {
          return triggerSnackbar('Error', `Invalid email format: ${r.email}`, 'error');
        }
      }
    }
    
    if (teleEnabled) {
      for (const r of recipients) {
        if (!r.label.trim() && r.chatId.trim()) return triggerSnackbar('Error', 'Label is required for Telegram Recipients.', 'error');
        if (r.label.trim() && !r.chatId.trim()) return triggerSnackbar('Error', 'Chat ID is required.', 'error');
        if (r.chatId.trim() && !/^-?\d+$/.test(r.chatId.trim())) {
          return triggerSnackbar('Error', `Invalid Chat ID format: ${r.chatId}. It should be a number.`, 'error');
        }
      }
    }

    setSaving(true);
    try {
      const validEmailRecipients = emailRecipients.filter(r => r.email.trim() !== '');
      const emailRecipientsPayload = validEmailRecipients.length > 0 ? JSON.stringify(validEmailRecipients.map(r => ({ label: r.label, email: r.email }))) : '';
      
      const validRecipients = recipients.filter(r => r.chatId.trim() !== '');
      const teleChatIdPayload = validRecipients.length > 0 ? JSON.stringify(validRecipients.map(r => ({ label: r.label, chatId: r.chatId }))) : '';
      
      await fetch(API, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ping_interval_minutes: pingInterval,
          fail_threshold: failThreshold,
          email_alerts_enabled: String(emailEnabled),
          email_recipients: emailRecipientsPayload,
          telegram_alerts_enabled: String(teleEnabled),
          telegram_chat_id: teleChatIdPayload,
        }),
      });
      // Update originals so dirty resets
      setOrigPingInterval(pingInterval);
      setOrigFailThreshold(failThreshold);
      setOrigEmailEnabled(emailEnabled);
      setOrigEmailRecipients(emailRecipients);
      setOrigTeleEnabled(teleEnabled);
      setOrigRecipients(recipients);
      triggerSnackbar('Settings Saved', 'Configuration has been updated successfully', 'success');
    } catch (e) {
      console.error('Failed to save settings', e);
      triggerSnackbar('Error', 'Failed to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const intervals = [
    { value: '1', label: '1 Min', desc: 'Real-time', icon: Zap },
    { value: '2', label: '2 Min', desc: 'Balanced', icon: Activity },
    { value: '5', label: '5 Min', desc: 'Standard', icon: Clock },
    { value: '15', label: '15 Min', desc: 'Low resource', icon: Clock },
    { value: '30', label: '30 Min', desc: 'Minimal', icon: Clock },
  ];

  // Live System Status
  const [systemStatus, setSystemStatus] = useState<{
    services: Record<string, { status: string; label: string }>;
    meta: { uptime: string; version: string };
  } | null>(null);
  const [systemStatusLoading, setSystemStatusLoading] = useState(true);

  useEffect(() => {
    const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/settings';
    const fetchStatus = () => {
      setSystemStatusLoading(true);
      fetch(`${BASE}/system-status`)
        .then(r => r.json())
        .then(data => setSystemStatus(data))
        .catch(() => setSystemStatus(null))
        .finally(() => setSystemStatusLoading(false));
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);


  const forceDiscard = () => {
    setPingInterval(origPingInterval);
    setFailThreshold(origFailThreshold);
    setEmailEnabled(origEmailEnabled);
    setEmailRecipients(origEmailRecipients);
    setTeleEnabled(origTeleEnabled);
    setRecipients(origRecipients);
    setShowUnsavedModal(false);
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  };

  const cancelDiscard = () => {
    setShowUnsavedModal(false);
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  };

  return (
    <div className="settings-scroll-container min-h-full flex-1 w-full text-text flex flex-col relative overflow-y-auto">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-50 pointer-events-none" />

      {/* ── NAVBAR (Dashboard-style) ── */}
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
                  <SettingsIcon className="text-accent" size={20} />
                </div>
                <div className="min-w-0 flex flex-col justify-center transition-transform duration-300 group-hover:translate-x-1">
                  <h1 className="type-page-title transition-colors duration-300 group-hover:text-accent">
                    Settings
                  </h1>
                  <p className="type-body-sm text-dim mt-1 leading-none">
                    Manage monitoring behavior
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Dirty indicator */}
              {isDirty && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 text-xs text-warning font-bold uppercase tracking-widest"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-warning shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" />
                  Unsaved
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={saving || loading || !isDirty}
                className={cn(
                  "flex items-center gap-2 h-[42px] rounded-full text-sm font-bold text-white transition-all duration-300",
                  isDirty
                    ? "shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)]"
                    : "opacity-50 cursor-not-allowed"
                )}
                style={{
                  paddingLeft: '18px',
                  paddingRight: '18px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                }}
              >
                {saving
                  ? <Loader size={14} className="animate-spin" />
                  : <Save size={14} />
                }
                {saving ? 'Saving...' : 'Save Changes'}
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* ── CONTENT AREA ── */}
      <div
        className="w-full max-w-[1720px] mx-auto flex-1 flex flex-col page-container-x pb-24"
        style={{ paddingTop: '56px' }}
      >
        <div className="max-w-[900px] w-full flex flex-col">

          {loading ? (
            <div className="py-24 text-center">
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
                    <SettingsIcon size={32} className="text-accent/90 relative z-10" />
                  </div>
                </div>
                <h3 className="text-white text-base font-bold tracking-wide mt-2">Loading Configuration...</h3>
                <p className="text-dim text-xs mt-2 leading-relaxed max-w-[300px] text-center font-medium">Fetching monitoring behaviors and alert rules from the backend. Please wait.</p>
                
                {/* Loading dots */}
                <div className="mt-6 flex items-center gap-3 text-xs text-accent/80 bg-accent/[0.08] border border-accent/20 rounded-full font-semibold uppercase tracking-wider shadow-[0_0_20px_rgba(59,130,246,0.15)]" style={{ padding: '8px 18px' }}>
                  <Loader size={14} className="animate-spin" />
                  <span>Synchronizing Data</span>
                </div>
              </motion.div>
            </div>
          ) : (
            <>
              {/* ═══════════════════════════════════════════════════════════════ */}
              {/* SECTION: Monitoring Configuration                              */}
              {/* ═══════════════════════════════════════════════════════════════ */}
              <div className="flex items-center gap-3 w-full" style={{ marginBottom: '28px' }}>
                <div className="h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                <h2 className="type-section-header text-white drop-shadow-[0_0_8px_rgba(59,130,246,0.3)] shrink-0">
                  Monitoring Configuration
                </h2>
                <div className="flex-1 h-[1.5px] bg-gradient-to-r from-white/[0.12] to-transparent ml-3" />
              </div>

              {/* Card: Monitoring */}
              <div
                className="rounded-2xl relative overflow-hidden backdrop-blur-sm"
                style={{
                  padding: '28px 32px',
                  background: 'rgba(16, 24, 40, 0.4)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                }}
              >
                {/* Left glow strip */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-[4px] opacity-65 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to bottom, transparent, #3b82f6, transparent)',
                    boxShadow: '12px 0 32px -4px #3b82f6',
                  }}
                />
                {/* Corner gradient */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ background: 'radial-gradient(circle at 100% 0%, #3b82f6, transparent 50%)' }} />
                {/* Inner ring */}
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.02] pointer-events-none" />

                <div className="relative z-10 flex flex-col" style={{ gap: '32px' }}>

                  {/* Ping Interval */}
                  <div>
                    <label className="block type-label mb-2">Ping Interval</label>
                    <p className="type-body-sm mb-4">How often devices are pinged to check connectivity.</p>
                    <div className="flex flex-wrap gap-3">
                      {intervals.map(opt => {
                        const isSelected = pingInterval === opt.value;
                        const OptIcon = opt.icon;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => setPingInterval(opt.value)}
                            className={cn(
                              "flex flex-col items-center gap-1.5 rounded-2xl border transition-all duration-200 hover:scale-[1.03] cursor-pointer",
                              isSelected && "scale-[1.02]"
                            )}
                            style={{
                              padding: '14px 20px',
                              minWidth: '100px',
                              background: isSelected ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.02)',
                              borderColor: isSelected ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.07)',
                              boxShadow: isSelected ? '0 4px 20px rgba(59,130,246,0.2), inset 0 1px 0 rgba(255,255,255,0.05)' : 'none',
                            }}
                          >
                            <OptIcon size={16} className={isSelected ? 'text-accent' : 'text-muted'} />
                            <span className={cn('type-nav-label', isSelected ? 'text-accent' : 'text-white/80')}>
                              {opt.label}
                            </span>
                            <span className="type-body-sm">{opt.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-white/[0.05]" />

                  {/* Fail Threshold */}
                  <div>
                    <label className="block type-label mb-2">Fail Threshold</label>
                    <p className="type-body-sm mb-4">Number of consecutive failed pings before triggering a DOWN alert.</p>
                    <div className="flex items-center gap-5">
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5, 7, 10].map(n => {
                          const isSelected = failThreshold === String(n);
                          return (
                            <button
                              key={n}
                              onClick={() => setFailThreshold(String(n))}
                              className="w-11 h-11 rounded-xl text-sm font-bold border transition-all duration-200 hover:scale-110 cursor-pointer"
                              style={{
                                background: isSelected ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.02)',
                                borderColor: isSelected ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.07)',
                                color: isSelected ? '#3b82f6' : '#94a3b8',
                                boxShadow: isSelected ? '0 4px 16px rgba(59,130,246,0.2)' : 'none',
                              }}
                            >
                              {n}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-2 text-muted text-xs">
                        <Info size={12} />
                        <span>Current: <span className="text-white font-semibold">{failThreshold} failed ping{Number(failThreshold) > 1 ? 's' : ''}</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════════ */}
              {/* SECTION: Notifications                                         */}
              {/* ═══════════════════════════════════════════════════════════════ */}
              <div className="flex items-center gap-3 w-full" style={{ marginTop: '56px', marginBottom: '28px' }}>
                <div className="h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                <h2 className="type-section-header text-white drop-shadow-[0_0_8px_rgba(59,130,246,0.3)] shrink-0">
                  Notifications
                </h2>
                <div className="flex-1 h-[1.5px] bg-gradient-to-r from-white/[0.12] to-transparent ml-3" />
              </div>

              {/* Card: Notifications */}
              <div
                className="rounded-2xl relative overflow-hidden backdrop-blur-sm"
                style={{
                  padding: '28px 32px',
                  background: 'rgba(16, 24, 40, 0.4)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                }}
              >


                {/* Corner gradients */}
                <div
                  className="absolute top-0 right-0 w-[50%] h-[50%] pointer-events-none transition-opacity duration-300"
                  style={{
                    opacity: emailEnabled ? 0.04 : 0.01,
                    background: `radial-gradient(circle at 100% 0%, ${emailEnabled ? '#22c55e' : '#475569'}, transparent 70%)`,
                  }}
                />
                <div
                  className="absolute bottom-0 right-0 w-[50%] h-[50%] pointer-events-none transition-opacity duration-300"
                  style={{
                    opacity: teleEnabled ? 0.04 : 0.01,
                    background: `radial-gradient(circle at 100% 100%, ${teleEnabled ? '#38bdf8' : '#475569'}, transparent 70%)`,
                  }}
                />

                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.02] pointer-events-none" />

                <div className="relative z-10 flex flex-col" style={{ gap: '32px' }}>
                  {/* --- Email Alerts Section --- */}
                  <div className="relative flex items-start justify-between gap-6">
                    {/* Left glow strip for Email */}
                    <div
                      className="absolute left-[-32px] top-[-28px] bottom-[-33px] w-[4px] opacity-65 pointer-events-none"
                      style={{
                        background: `linear-gradient(to bottom, transparent, ${emailEnabled ? '#22c55e' : '#475569'})`,
                        boxShadow: `12px 0 32px -4px ${emailEnabled ? '#22c55e' : '#475569'}`,
                        transition: 'background 0.3s, box-shadow 0.3s',
                      }}
                    />
                    <div className="flex items-start gap-4">
                      <div
                        className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 transition-all duration-300"
                        style={{
                          background: emailEnabled ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${emailEnabled ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.07)'}`,
                          boxShadow: emailEnabled ? '0 0 20px rgba(34,197,94,0.15)' : 'none',
                        }}
                      >
                        <Mail size={20} className={cn('transition-colors duration-300', emailEnabled ? 'text-green-500' : 'text-muted')} />
                      </div>
                      <div className="flex-1 w-full max-w-[550px]">
                        <p className="type-nav-label text-white">Email Alerts</p>
                        <p className="type-body-sm mt-1.5">
                          Send email notifications when a device goes DOWN or RECOVERS. Manage your recipients below.
                        </p>

                        <div className="mt-6 flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <label className="type-label">Email Recipients</label>
                            <button
                              onClick={() => setEmailRecipients(prev => [...prev, { id: Math.random().toString(), label: '', email: '' }])}
                              disabled={!emailEnabled}
                              className="flex items-center gap-2 text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg hover:bg-green-500/20 hover:border-green-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                              style={{ padding: '8px 16px' }}
                            >
                              <span className="text-sm leading-none">+</span> Add Recipient
                            </button>
                          </div>
                          
                          {emailRecipients.map(r => (
                            <div key={r.id} className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={r.label}
                                  onChange={e => setEmailRecipients(prev => prev.map(item => item.id === r.id ? { ...item, label: e.target.value } : item))}
                                  placeholder="Label (e.g. Admin)"
                                  className="w-[140px] bg-black/40 border border-white/10 rounded-xl h-11 text-sm text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-white/25 px-4"
                                  disabled={!emailEnabled}
                                />
                                <input
                                  type="email"
                                  value={r.email}
                                  onChange={e => setEmailRecipients(prev => prev.map(item => item.id === r.id ? { ...item, email: e.target.value } : item))}
                                  placeholder="Email Address"
                                  className="flex-1 bg-black/40 border border-white/10 rounded-xl h-11 text-sm text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-white/25 px-4"
                                  disabled={!emailEnabled}
                                />
                                <button
                                  onClick={() => handleTestEmail(r.email)}
                                  disabled={!emailEnabled || !r.email || testingEmail === r.email}
                                  className="flex items-center justify-center h-11 w-11 shrink-0 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-xl text-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Send Test Notification"
                                >
                                  {testingEmail === r.email ? <Loader size={16} className="animate-spin" /> : <Mail size={16} />}
                                </button>
                                {emailRecipients.length > 1 && (
                                  <button
                                    onClick={() => setEmailRecipients(prev => prev.filter(item => item.id !== r.id))}
                                    disabled={!emailEnabled}
                                    className="flex items-center justify-center h-11 w-11 shrink-0 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Remove"
                                  >
                                    <X size={16} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                          <div className={cn('w-1.5 h-1.5 rounded-full transition-colors duration-300', emailEnabled ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-dim')} />
                          <span className={cn('text-xs font-bold uppercase tracking-widest transition-colors duration-300', emailEnabled ? 'text-green-500' : 'text-muted')}>
                            {emailEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setEmailEnabled(v => !v)}
                      className="shrink-0 transition-all duration-300 hover:scale-110 cursor-pointer mt-2"
                    >
                      {emailEnabled
                        ? <ToggleRight size={40} className="text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                        : <ToggleLeft size={40} className="text-muted" />
                      }
                    </button>
                  </div>

                  {/* Divider exactly like Monitoring Config */}
                  <div className="h-px bg-white/[0.05]" />

                  {/* --- Telegram Alerts Section --- */}
                  <div className="relative flex items-start justify-between gap-6">
                    {/* Left glow strip for Telegram */}
                    <div
                      className="absolute left-[-32px] top-[-32px] bottom-[-28px] w-[4px] opacity-65 pointer-events-none"
                      style={{
                        background: `linear-gradient(to bottom, ${teleEnabled ? '#38bdf8' : '#475569'}, transparent)`,
                        boxShadow: `12px 0 32px -4px ${teleEnabled ? '#38bdf8' : '#475569'}`,
                        transition: 'background 0.3s, box-shadow 0.3s',
                      }}
                    />
                    <div className="flex items-start gap-4">
                      <div
                        className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 transition-all duration-300"
                        style={{
                          background: teleEnabled ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${teleEnabled ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.07)'}`,
                          boxShadow: teleEnabled ? '0 0 20px rgba(56,189,248,0.15)' : 'none',
                        }}
                      >
                        <MessageSquare size={20} className={cn('transition-colors duration-300', teleEnabled ? 'text-[#38bdf8]' : 'text-muted')} />
                      </div>
                      <div className="flex-1 w-full max-w-[550px]">
                        <p className="type-nav-label text-white">Telegram Alerts</p>
                        <p className="type-body-sm mt-1.5">
                          Send push notifications via Telegram Bot. Very fast and highly recommended for mobile staff.
                        </p>
                        
                        <div className="mt-6 flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <label className="type-label">Telegram Recipients</label>
                            <button
                              onClick={() => setRecipients(prev => [...prev, { id: Math.random().toString(), label: '', chatId: '' }])}
                              disabled={!teleEnabled}
                              className="flex items-center gap-2 text-xs font-bold text-[#38bdf8] bg-[#38bdf8]/10 border border-[#38bdf8]/20 rounded-lg hover:bg-[#38bdf8]/20 hover:border-[#38bdf8]/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                              style={{ padding: '8px 16px' }}
                            >
                              <span className="text-sm leading-none">+</span> Add Recipient
                            </button>
                          </div>
                          
                          {recipients.map(r => (
                            <div key={r.id} className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={r.label}
                                  onChange={e => setRecipients(prev => prev.map(item => item.id === r.id ? { ...item, label: e.target.value } : item))}
                                  placeholder="Label (e.g. IT Dept)"
                                  className="w-[140px] bg-black/40 border border-white/10 rounded-xl h-11 text-sm text-white focus:outline-none focus:border-[#38bdf8]/50 focus:ring-1 focus:ring-[#38bdf8]/50 transition-all placeholder:text-white/25 px-4"
                                  disabled={!teleEnabled}
                                />
                                <input
                                  type="text"
                                  value={r.chatId}
                                  onChange={e => setRecipients(prev => prev.map(item => item.id === r.id ? { ...item, chatId: e.target.value } : item))}
                                  placeholder="Chat ID (e.g. -100...)"
                                  className="flex-1 bg-black/40 border border-white/10 rounded-xl h-11 text-sm text-white focus:outline-none focus:border-[#38bdf8]/50 focus:ring-1 focus:ring-[#38bdf8]/50 transition-all placeholder:text-white/25 px-4"
                                  disabled={!teleEnabled}
                                />
                                <button
                                  onClick={() => handleAutoDetect(r.id)}
                                  disabled={!teleEnabled || detecting === r.id}
                                  className="flex items-center justify-center h-11 w-11 shrink-0 bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/20 rounded-xl text-[#38bdf8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Auto Detect Chat ID"
                                >
                                  {detecting === r.id ? <Loader size={16} className="animate-spin" /> : <Search size={16} />}
                                </button>
                                <button
                                  onClick={() => handleTestTelegram(r.chatId)}
                                  disabled={!teleEnabled || !r.chatId}
                                  className="flex items-center justify-center h-11 w-11 shrink-0 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-xl text-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Send Test Notification"
                                >
                                  <MessageSquare size={16} />
                                </button>
                                {recipients.length > 1 && (
                                  <button
                                    onClick={() => setRecipients(prev => prev.filter(item => item.id !== r.id))}
                                    disabled={!teleEnabled}
                                    className="flex items-center justify-center h-11 w-11 shrink-0 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Remove"
                                  >
                                    <X size={16} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {teleEnabled && (
                          <p className="text-xs font-medium text-warning mt-4 mb-2">
                            Send any message to <a href="https://t.me/hotel_mesra_monitor_bot" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#38bdf8] transition-colors font-semibold">your bot</a> first, then click the search icon.
                          </p>
                        )}

                        <div className="mt-4 flex items-center gap-2">
                          <div className={cn('w-1.5 h-1.5 rounded-full transition-colors duration-300', teleEnabled ? 'bg-[#38bdf8] shadow-[0_0_8px_rgba(56,189,248,0.8)]' : 'bg-dim')} />
                          <span className={cn('text-xs font-bold uppercase tracking-widest transition-colors duration-300', teleEnabled ? 'text-[#38bdf8]' : 'text-muted')}>
                            {teleEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setTeleEnabled(v => !v)}
                      className="shrink-0 transition-all duration-300 hover:scale-110 cursor-pointer mt-2"
                    >
                      {teleEnabled
                        ? <ToggleRight size={40} className="text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                        : <ToggleLeft size={40} className="text-muted" />
                      }
                    </button>
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════════ */}
              {/* SECTION: System Status                                          */}
              {/* ═══════════════════════════════════════════════════════════════ */}
              <div className="flex items-center gap-3 w-full" style={{ marginTop: '60px', marginBottom: '32px' }}>
                <div className="h-2 w-2 rounded-full bg-online shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                <h2 className="type-section-header text-white drop-shadow-[0_0_8px_rgba(34,197,94,0.3)] shrink-0">
                  System Status
                </h2>
                <div className="flex-1 h-[1.5px] bg-gradient-to-r from-white/[0.12] to-transparent ml-3" />
              </div>

              {/* Card: System Status */}
              <div
                className="rounded-2xl relative overflow-hidden backdrop-blur-sm"
                style={{
                  padding: '24px 28px',
                  background: 'rgba(16, 24, 40, 0.4)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                }}
              >
                {/* Left glow strip */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-[4px] opacity-65 pointer-events-none"
                  style={{
                    background: `linear-gradient(to bottom, transparent, ${systemStatus && !systemStatusLoading ? '#22c55e' : '#94a3b8'}, transparent)`,
                    boxShadow: `12px 0 32px -4px ${systemStatus && !systemStatusLoading ? '#22c55e' : '#94a3b8'}`,
                  }}
                />
                <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ background: 'radial-gradient(circle at 100% 0%, #22c55e, transparent 50%)' }} />
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.02] pointer-events-none" />

                <div className="relative z-10 flex flex-col gap-2">
                  {/* Service Rows */}
                  {systemStatusLoading ? (
                    <div className="flex items-center justify-center gap-3 py-8">
                      <Loader size={16} className="text-muted animate-spin" />
                      <span className="type-body-sm">Checking services...</span>
                    </div>
                  ) : systemStatus ? (
                    <>
                      {([
                        { key: 'apiServer', label: 'API Server', icon: Globe },
                        { key: 'database', label: 'Database', icon: Database },
                        { key: 'websocket', label: 'WebSocket', icon: Zap },
                        { key: 'telegram', label: 'Telegram Bot', icon: MessageSquare },
                        { key: 'email', label: 'Email Service', icon: Mail },
                      ] as const).map(({ key, label, icon: Icon }) => {
                        const svc = systemStatus.services[key];
                        const svcStatus = svc?.status || 'unknown';
                        const svcLabel = svc?.label || 'Unknown';

                        const dotColor = svcStatus === 'operational' || svcStatus === 'connected'
                          ? 'bg-online shadow-[0_0_6px_rgba(34,197,94,0.6)]'
                          : svcStatus === 'failed' || svcStatus === 'disconnected'
                          ? 'bg-offline shadow-[0_0_6px_rgba(239,68,68,0.6)]'
                          : svcStatus === 'warning' || svcStatus === 'degraded'
                          ? 'bg-warning shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                          : 'bg-muted/50';

                        const textColor = svcStatus === 'operational' || svcStatus === 'connected'
                          ? 'text-online'
                          : svcStatus === 'failed' || svcStatus === 'disconnected'
                          ? 'text-offline'
                          : svcStatus === 'warning' || svcStatus === 'degraded'
                          ? 'text-warning'
                          : 'text-muted';

                        return (
                          <div
                            key={key}
                            className="flex items-center gap-4 rounded-xl group hover:bg-white/[0.03] transition-all duration-200"
                            style={{
                              padding: '12px 16px',
                              background: 'rgba(0,0,0,0.12)',
                              border: '1px solid rgba(255,255,255,0.04)',
                            }}
                          >
                            <div
                              className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                              style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                              }}
                            >
                              <Icon size={14} className="text-muted" />
                            </div>
                            <div className="flex-1 min-w-0 flex justify-between items-center gap-3">
                              <span className="type-value text-white">{label}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className={cn('h-1.5 w-1.5 rounded-full', dotColor)} />
                                <span className={cn('type-badge', textColor)}>{svcLabel}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Separator */}
                      <div className="h-px bg-white/[0.06] my-1" />

                      {/* Meta Row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div
                          className="flex items-center gap-4 rounded-xl"
                          style={{
                            padding: '12px 16px',
                            background: 'rgba(0,0,0,0.12)',
                            border: '1px solid rgba(255,255,255,0.04)',
                          }}
                        >
                          <div
                            className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                          >
                            <Clock size={14} className="text-muted" />
                          </div>
                          <div className="flex-1 min-w-0 flex justify-between items-center gap-3">
                            <span className="type-body-sm text-muted">Application Uptime</span>
                            <span className="type-mono text-white">{systemStatus.meta.uptime}</span>
                          </div>
                        </div>
                        <div
                          className="flex items-center gap-4 rounded-xl"
                          style={{
                            padding: '12px 16px',
                            background: 'rgba(0,0,0,0.12)',
                            border: '1px solid rgba(255,255,255,0.04)',
                          }}
                        >
                          <div
                            className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                          >
                            <Info size={14} className="text-muted" />
                          </div>
                          <div className="flex-1 min-w-0 flex justify-between items-center gap-3">
                            <span className="type-body-sm text-muted">Version</span>
                            <span className="type-mono text-white">{systemStatus.meta.version}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-8">
                      <AlertTriangle size={20} className="text-warning" />
                      <span className="text-xs text-muted">Unable to reach API server</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Snackbar Toasts ── */}
      <div className="fixed bottom-5 right-5 flex flex-col gap-2.5 z-[110] pointer-events-none">
        <AnimatePresence>
          {snackbars.map(snack => {
            const isError = snack.type === 'error';
            const colorHex = isError ? '#ef4444' : '#22c55e';
            const shadowColorHex = isError ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)';
            const glowColorHex = isError ? 'rgba(239,68,68,0.35)' : 'rgba(34,197,94,0.35)';
            const Icon = isError ? AlertTriangle : CheckCircle;
            const iconBgClass = isError ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_12px_rgba(239,68,68,0.2)]' : 'bg-online/10 border-online/20 text-online shadow-[0_0_12px_rgba(34,197,94,0.2)]';
            const titleHoverClass = isError ? 'group-hover:text-red-500' : 'group-hover:text-online';

            return (
              <motion.div
                key={snack.id}
                initial={{ opacity: 0, y: 16, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95, transition: { duration: 0.18 } }}
                whileHover={{
                  scale: 1.015,
                  boxShadow: `0 20px 48px rgba(0,0,0,0.5), 0 0 30px ${shadowColorHex}`,
                  borderColor: glowColorHex
                }}
                transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                onClick={() => setSnackbars(prev => prev.filter(s => s.id !== snack.id))}
                style={{ padding: '10px 14px' }}
                className="pointer-events-auto cursor-pointer active:scale-[0.98] group relative overflow-hidden flex items-center gap-3 rounded-xl border border-white/[0.06] backdrop-blur-xl bg-panel/95 transition-colors duration-300 w-[350px] sm:w-[380px] shadow-[0_16px_40px_rgba(0,0,0,0.45)] hover:bg-panel/98"
              >
                {/* Glowing Left Border Strip */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-[4px] pointer-events-none opacity-70 group-hover:w-[6px] group-hover:opacity-95 transition-all duration-300"
                  style={{
                    background: `linear-gradient(to bottom, transparent, ${colorHex}, transparent)`,
                    boxShadow: `12px 0 32px -4px ${colorHex}`,
                  }}
                />

                {/* Corner Gradient */}
                <div 
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 100% 100%, ${colorHex}, transparent 70%)` }}
                />

                {/* Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 shadow-md relative z-10 group-hover:scale-110 group-hover:rotate-3 ${iconBgClass}`}>
                  <Icon size={15} className="stroke-[2.5px]" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col gap-0.5 relative z-10">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={`type-nav-label text-white leading-tight transition-colors duration-300 ${titleHoverClass}`}>
                      {snack.title}
                    </p>
                    <p className="type-sublabel text-white/40 tabular-nums">
                      {snack.timestamp}
                    </p>
                  </div>
                  <p className="type-body-sm text-muted truncate leading-normal">{snack.message}</p>
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/[0.03] overflow-hidden pointer-events-none">
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 4, ease: 'linear' }}
                    className="h-full rounded-r-full"
                    style={{ background: colorHex, boxShadow: `0 0 8px ${colorHex}` }}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Unsaved Changes Modal */}
      <AnimatePresence>
        {showUnsavedModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cancelDiscard}
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-[440px] bg-panel/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl"
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-[4.5px] pointer-events-none z-20"
                style={{
                  background: 'linear-gradient(to bottom, transparent, #f59e0b, transparent)',
                  boxShadow: '12px 0 32px -4px #f59e0b',
                  opacity: 0.75,
                }}
              />
              <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.04] bg-gradient-to-br from-transparent via-transparent to-amber-500/40" />

              <div className="relative z-10" style={{ padding: '28px 28px 24px' }}>
                <div className="flex items-start gap-4 mb-5">
                  <div
                    className="flex items-center justify-center rounded-2xl shrink-0"
                    style={{
                      width: 48, height: 48,
                      background: 'rgba(245,158,11,0.1)',
                      border: '1px solid rgba(245,158,11,0.2)',
                      boxShadow: '0 0 20px rgba(245,158,11,0.15)',
                    }}
                  >
                    <AlertTriangle size={20} className="text-amber-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="type-page-title text-white">Unsaved Changes</h3>
                    <p className="type-body-sm text-muted mt-1">You have unsaved edits</p>
                  </div>
                </div>

                <p className="type-body-sm text-muted mb-6 leading-relaxed">
                  Are you sure you want to discard your changes? Your edits will be lost permanently.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={cancelDiscard}
                    className="flex-1 h-[44px] rounded-xl text-sm font-semibold text-muted border border-white/[0.08] hover:text-white hover:border-white/[0.15] hover:bg-white/[0.03] transition-all"
                  >
                    Keep Editing
                  </button>
                  <button
                    onClick={forceDiscard}
                    className="flex-1 h-[44px] rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      boxShadow: '0 4px 20px rgba(245,158,11,0.3)',
                    }}
                  >
                    Discard Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Spacer & Footer */}
      <div className="h-12 shrink-0 pointer-events-none" />
      <Footer />
    </div>
  );
}

import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, LayoutDashboard, Monitor, Settings, ChevronLeft
} from 'lucide-react';
import { useSidebar } from './AppLayout';
import { cn } from '../../utils/cn';

const navItems = [
  {
    to: '/',
    icon: LayoutDashboard,
    label: 'Dashboard',
    description: 'Live monitoring',
    exact: true,
  },
  {
    to: '/devices',
    icon: Monitor,
    label: 'Device Management',
    description: 'CRUD devices',
    exact: false,
  },
  {
    to: '/settings',
    icon: Settings,
    label: 'Settings',
    description: 'Configuration',
    exact: false,
  },
];

export function Sidebar() {
  const { isOpen, setIsOpen } = useSidebar();
  const location = useLocation();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 260 : 0, opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "flex flex-col h-screen shrink-0 overflow-hidden z-[60] backdrop-blur-xl transition-all absolute left-0 top-0",
        isOpen ? "border-r border-white/[0.08]" : "border-none"
      )}
      style={{
        background: 'rgba(16, 24, 40, 0.65)',
        boxShadow: isOpen ? '4px 0 32px rgba(0,0,0,0.5)' : 'none',
      }}
    >
      <div style={{ width: 260 }} className="h-full flex flex-col shrink-0 relative">
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(59,130,246,0.06) 0%, transparent 70%)',
          }}
        />

        {/* Subtle vertical gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(59,130,246,0.02) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.15) 100%)',
          }}
        />

        {/* Logo Area */}
        <div
          className="relative flex items-center gap-4 shrink-0 overflow-hidden"
          style={{
            height: 80,
            paddingLeft: 24,
            paddingRight: 16,
          }}
        >
          {/* Icon */}
          <div
            className="flex items-center justify-center rounded-full shrink-0 transition-all duration-700 ease-out"
            style={{
              width: 40,
              height: 40,
              background: 'linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(59,130,246,0.05) 100%)',
              border: '1px solid rgba(59,130,246,0.3)',
              boxShadow: '0 0 20px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            <Activity size={18} className="text-accent drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
          </div>

          {/* Brand Name */}
          <div className="min-w-0 flex flex-col flex-1">
            <span className="type-nav-label text-white whitespace-nowrap overflow-hidden text-ellipsis">
              Mesra Network
            </span>
            <span className="text-accent type-nav-desc font-semibold mt-1 whitespace-nowrap tracking-wide">
              Monitoring
            </span>
          </div>

          {/* Close Toggle */}
          <button
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center rounded-full transition-all duration-300 bg-white/[0.06] hover:bg-white/[0.12] hover:scale-110 cursor-pointer"
            style={{
              width: 28,
              height: 28,
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            title="Close sidebar"
          >
            <ChevronLeft size={14} className="text-white/70" />
          </button>
        </div>

        {/* Logo Divider */}
        <div
          className="shrink-0 mx-5"
          style={{
            height: 1,
            background: 'linear-gradient(to right, rgba(59,130,246,0.2), rgba(255,255,255,0.06), transparent)',
          }}
        />

        {/* Nav Items */}
        <nav className="flex flex-col gap-2 flex-1 overflow-y-auto py-6 px-4 relative z-10">
          {/* Section Label */}
          <div className="mb-3 mt-1 flex items-center gap-3 w-full pl-3">
            <div className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
            <p className="type-form-section text-white/90 drop-shadow-[0_0_4px_rgba(59,130,246,0.2)] shrink-0">
              Navigation
            </p>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-white/[0.1] to-transparent ml-2" />
          </div>

          {navItems.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            const Icon = item.icon;

            return (
              <NavLink key={item.to} to={item.to} end={item.exact}>
                <motion.div
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    'relative flex items-center gap-3.5 rounded-xl transition-all duration-200 overflow-hidden justify-start group',
                    isActive
                      ? 'text-white'
                      : 'text-muted hover:text-white hover:bg-white/[0.04]'
                  )}
                  style={{
                    height: 52,
                    paddingLeft: 16,
                    paddingRight: 16,
                    background: isActive
                      ? 'rgba(59,130,246,0.12)'
                      : 'transparent',
                    border: isActive
                      ? '1px solid rgba(59,130,246,0.22)'
                      : '1px solid transparent',
                    boxShadow: isActive
                      ? '0 2px 16px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.06)'
                      : 'none',
                  }}
                >
                  {/* Active left border */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-1 top-2.5 bottom-2.5 w-[3px] rounded-full bg-accent"
                      style={{ boxShadow: '0 0 10px rgba(59,130,246,0.7)' }}
                    />
                  )}

                  {/* Active radial glow */}
                  {isActive && (
                    <div
                      className="absolute inset-0 pointer-events-none opacity-[0.06]"
                      style={{ background: 'radial-gradient(circle at 0% 50%, #3b82f6, transparent 60%)' }}
                    />
                  )}

                  {/* Icon */}
                  <div
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-all duration-300',
                      isActive
                        ? 'bg-accent/15 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                        : 'bg-white/[0.03] group-hover:bg-white/[0.06]'
                    )}
                    style={{
                      border: isActive
                        ? '1px solid rgba(59,130,246,0.25)'
                        : '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <Icon
                      size={16}
                      className={cn(
                        'shrink-0 transition-all duration-200',
                        isActive
                          ? 'text-accent drop-shadow-[0_0_6px_rgba(59,130,246,0.5)]'
                          : 'text-muted group-hover:text-white/80'
                      )}
                    />
                  </div>

                  {/* Label + Description */}
                  <div className="flex flex-col min-w-0 overflow-hidden">
                    <span className="type-nav-label whitespace-nowrap">
                      {item.label}
                    </span>
                    <span className={cn(
                      'type-nav-desc mt-0.5 whitespace-nowrap transition-colors duration-200',
                      isActive ? 'text-accent/70' : 'text-muted/70 group-hover:text-muted'
                    )}>
                      {item.description}
                    </span>
                  </div>
                </motion.div>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Footer */}
        <div className="shrink-0 relative z-10">
          {/* Divider */}
          <div
            className="mx-5"
            style={{
              height: 1,
              background: 'linear-gradient(to right, rgba(59,130,246,0.15), rgba(255,255,255,0.05), transparent)',
            }}
          />

          <div className="flex items-center gap-3 px-6 py-5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent/50 shadow-[0_0_6px_rgba(59,130,246,0.4)]" />
            <div className="flex flex-col min-w-0">
              <span className="type-footer-label">
                Mesra Monitoring
              </span>
              <span className="type-nav-desc text-white/20 font-mono mt-0.5">
                v1.2.0
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

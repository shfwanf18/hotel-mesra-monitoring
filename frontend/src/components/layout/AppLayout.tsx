import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useState, useEffect, createContext, useContext } from 'react';

export const SidebarContext = createContext<{
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}>({ isOpen: false, setIsOpen: () => {} });

export function useSidebar() {
  return useContext(SidebarContext);
}

export function AppLayout() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsOpen(v => !v);
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="flex h-screen overflow-hidden bg-bg text-text">
        {/* Sidebar */}
        <Sidebar />

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto relative flex flex-col">
        {/* Premium background effects (same as original App.tsx) */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] max-w-[900px] max-h-[900px] rounded-full bg-accent/[0.08] blur-[120px] animate-orb-1" />
          <div className="absolute bottom-[-15%] right-[-5%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full bg-[#a855f7]/[0.05] blur-[130px] animate-orb-2" />
          <div className="absolute top-[20%] right-[15%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-[#10b981]/[0.03] blur-[100px] animate-orb-1" style={{ animationDelay: '-10s', animationDuration: '35s' }} />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_50%,transparent_110%)]" />
        </div>

        {/* Page content */}
        <div className="relative z-10 flex-1 flex flex-col min-h-full">
          <Outlet />
        </div>
      </div>
      </div>
    </SidebarContext.Provider>
  );
}
